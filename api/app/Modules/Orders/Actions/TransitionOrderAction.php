<?php

namespace App\Modules\Orders\Actions;

use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Membership\Actions\ApplyOrderMembershipPointsAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class TransitionOrderAction
{
    public function __construct(private readonly InventoryService $inventory, private readonly ApplyOrderMembershipPointsAction $membershipPoints) {}

    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['shipping', 'cancelled'],
        'shipping' => ['delivered', 'delivery_failed'],
        'delivery_failed' => ['shipping', 'returned'],
        'delivered' => ['completed', 'returned'],
        'completed' => ['returned'],
        'cancelled' => [],
        'returned' => [],
    ];

    public function handle(int $orderId, string $toStatus, ?string $note, ?int $changedBy, bool $paymentCollected = false): object
    {
        return DB::transaction(function () use ($orderId, $toStatus, $note, $changedBy, $paymentCollected): object {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (! $order) {
                throw ValidationException::withMessages(['order' => 'Không tìm thấy đơn hàng.']);
            }

            if (! in_array($toStatus, self::TRANSITIONS[$order->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'INVALID_ORDER_TRANSITION']);
            }
            if (($order->fulfillment_type ?? 'delivery') === 'pickup' && $toStatus === 'delivery_failed') {
                throw ValidationException::withMessages(['status' => 'Đơn nhận tại cửa hàng không có trạng thái giao hàng thất bại.']);
            }

            $now = now();
            if ($toStatus === 'cancelled') {
                $this->releaseReservation($order, $changedBy, $note);
                $this->releaseCoupon($order->id, $order->coupon_id);
            }

            if ($toStatus === 'returned') {
                if (in_array($order->status, ['delivered', 'completed'], true)) {
                    $approvedReturnExists = Schema::hasTable('order_change_requests') && DB::table('order_change_requests')->where('order_id', $orderId)
                        ->where('type', 'return')->where('status', 'approved')->exists();
                    if (! $approvedReturnExists) {
                        throw ValidationException::withMessages(['status' => 'Cần có yêu cầu trả hàng đã được duyệt trước khi xác nhận đã nhận hàng trả.']);
                    }
                    $this->restoreDeliveredSale($order, $changedBy, $note);
                } else {
                    $this->releaseReservation($order, $changedBy, $note);
                }
                $this->releaseCoupon($order->id, $order->coupon_id);
            }

            if ($toStatus === 'delivered') {
                $this->completeSale($order, $changedBy);
            }

            $timestamps = match ($toStatus) {
                'confirmed' => ['confirmed_at' => $now],
                'shipping' => ['shipped_at' => $now],
                'delivered' => ['delivered_at' => $now],
                'cancelled' => ['cancelled_at' => $now, 'cancel_reason' => $note],
                default => [],
            };
            $paymentStatus = $toStatus === 'delivered' && $paymentCollected ? 'paid' : $order->payment_status;

            DB::table('orders')->where('id', $orderId)->update([
                'status' => $toStatus,
                'payment_status' => $paymentStatus,
                'updated_at' => $now,
                ...$timestamps,
            ]);
            DB::table('order_status_histories')->insert([
                'order_id' => $orderId,
                'from_status' => $order->status,
                'to_status' => $toStatus,
                'note' => $note,
                'changed_by' => $changedBy,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if (in_array($toStatus, ['delivered', 'completed'], true)) {
                $this->membershipPoints->award($orderId);
            } elseif ($toStatus === 'returned') {
                $this->membershipPoints->reverseReturnedOrder($orderId);
            }

            if ($toStatus === 'delivered' && $paymentCollected) {
                DB::table('payments')->where('order_id', $orderId)->where('method', 'cod')->update([
                    'status' => 'paid',
                    'paid_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            return DB::table('orders')->where('id', $orderId)->first();
        });
    }

    private function releaseReservation(object $order, ?int $changedBy, ?string $note): void
    {
        $items = DB::table('order_items')->where('order_id', $order->id)->whereNotNull('variant_id')
            ->orderBy('variant_id')->orderBy('id')->get();
        foreach ($items as $item) {
            if (($order->fulfillment_type ?? 'delivery') === 'pickup' && $order->pickup_location_id) {
                $this->inventory->releasePickupReservation((int) $order->pickup_location_id, (int) $item->variant_id, (int) $item->quantity, (int) $order->id, 'Giải phóng đơn nhận tại cửa hàng '.$order->code.($note ? ': '.$note : ''), $changedBy);
            } else {
                $this->inventory->releaseOrderReservation((int) $item->variant_id, (int) $item->quantity, (int) $order->id, 'Giải phóng đơn '.$order->code.($note ? ': '.$note : ''), $changedBy);
            }
        }
    }

    private function completeSale(object $order, ?int $changedBy): void
    {
        $items = DB::table('order_items')->where('order_id', $order->id)->whereNotNull('variant_id')
            ->orderBy('variant_id')->orderBy('id')->get();
        foreach ($items as $item) {
            if (($order->fulfillment_type ?? 'delivery') === 'pickup' && $order->pickup_location_id) {
                $this->inventory->completePickupSale((int) $order->pickup_location_id, (int) $item->variant_id, (int) ($item->product_id ?? 0), (int) $item->quantity, (int) $order->id, 'Khách nhận hàng tại cửa hàng '.$order->code, $changedBy);
            } else {
                $this->inventory->completeOrderSale((int) $item->variant_id, (int) ($item->product_id ?? 0), (int) $item->quantity, (int) $order->id, 'Hoàn tất giao COD '.$order->code, $changedBy);
            }
        }
    }

    private function restoreDeliveredSale(object $order, ?int $changedBy, ?string $note): void
    {
        $items = DB::table('order_items')->where('order_id', $order->id)->whereNotNull('variant_id')
            ->orderBy('variant_id')->orderBy('id')->get();
        foreach ($items as $item) {
            if (($order->fulfillment_type ?? 'delivery') === 'pickup' && $order->pickup_location_id) {
                $this->inventory->restorePickupSale((int) $order->pickup_location_id, (int) $item->variant_id, (int) ($item->product_id ?? 0), (int) $item->quantity, (int) $order->id, 'Nhập lại hàng trả tại cửa hàng '.$order->code.($note ? ': '.$note : ''), $changedBy);
            } else {
                $this->inventory->restoreDeliveredSale((int) $item->variant_id, (int) ($item->product_id ?? 0), (int) $item->quantity, (int) $order->id, 'Nhập lại hàng trả đơn '.$order->code.($note ? ': '.$note : ''), $changedBy);
            }
        }
    }

    private function releaseCoupon(int $orderId, ?int $couponId): void
    {
        if (! $couponId) {
            return;
        }
        $usage = DB::table('coupon_usages')->where('order_id', $orderId)->first();
        if (! $usage) {
            return;
        }
        DB::table('coupon_usages')->where('id', $usage->id)->delete();
        DB::table('coupons')->where('id', $couponId)->where('used_count', '>', 0)->decrement('used_count');
    }
}
