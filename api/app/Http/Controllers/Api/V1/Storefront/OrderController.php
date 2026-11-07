<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\CreateOrderChangeRequest;
use App\Http\Requests\Api\V1\Storefront\ListCustomerOrdersRequest;
use App\Http\Requests\Api\V1\Storefront\TrackOrderRequest;
use App\Modules\Orders\Actions\CreateOrderChangeRequestAction;
use App\Modules\Orders\Actions\TransitionOrderAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(ListCustomerOrdersRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $query = DB::table('orders')->where('user_id', $request->user()->id);
        $status = $filters['status'] ?? 'all';
        match ($status) {
            'pending' => $query->where('status', 'pending'),
            'processing' => $query->whereIn('status', ['confirmed', 'processing']),
            'shipping' => $query->whereIn('status', ['shipping', 'delivery_failed']),
            'delivered' => $query->whereIn('status', ['delivered', 'completed']),
            'cancelled' => $query->where('status', 'cancelled'),
            'returned' => $query->where('status', 'returned'),
            default => null,
        };

        if (! empty($filters['q'])) {
            $term = trim($filters['q']);
            $query->where(function ($orders) use ($term): void {
                $orders->where('code', 'like', '%'.$term.'%')
                    ->orWhereExists(function ($items) use ($term): void {
                        $items->selectRaw('1')->from('order_items')
                            ->whereColumn('order_items.order_id', 'orders.id')
                            ->where('order_items.product_name', 'like', '%'.$term.'%');
                    });
            });
        }

        if (! empty($filters['from'])) {
            $query->whereDate('placed_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('placed_at', '<=', $filters['to']);
        }

        $orders = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15, ['id', 'code', 'status', 'fulfillment_type', 'pickup_location_snapshot', 'payment_status', 'grand_total', 'placed_at']);

        $orders->setCollection($orders->getCollection()->map(function (object $order): object {
            $order->fulfillment_type ??= 'delivery';
            $order->pickup_location = isset($order->pickup_location_snapshot) && $order->pickup_location_snapshot !== null ? json_decode($order->pickup_location_snapshot, true) : null;
            unset($order->pickup_location_snapshot);

            return $order;
        }));

        return response()->json(['data' => $orders->items(), 'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'total' => $orders->total()]]);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = DB::table('orders')->where('code', $code)->where('user_id', $request->user()->id)->first();
        abort_if(! $order, 404);

        return response()->json(['data' => $this->details($order)]);
    }

    public function track(TrackOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $usesEmail = isset($data['email']);
        $order = DB::table('orders')
            ->where('code', $data['code'])
            ->where($usesEmail ? 'customer_email' : 'customer_phone', $usesEmail ? $data['email'] : $data['phone'])
            ->first();
        abort_if(! $order, 404);

        return response()->json(['data' => $this->details($order, false)]);
    }

    public function cancel(Request $request, string $code, TransitionOrderAction $transition): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $order = DB::table('orders')->where('code', $code)->where('user_id', $request->user()->id)->first();
        abort_if(! $order, 404);
        if ($order->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể hủy đơn đang chờ xác nhận.']);
        }

        if (Schema::hasTable('order_change_requests') && DB::table('order_change_requests')->where('order_id', $order->id)->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['status' => 'Đơn hàng đã có yêu cầu thay đổi đang chờ nhân viên xử lý.']);
        }

        $updated = $transition->handle((int) $order->id, 'cancelled', $data['reason'] ?? 'Khách hàng yêu cầu hủy', $request->user()->id);

        return response()->json(['data' => $this->details($updated)]);
    }

    public function requestChange(CreateOrderChangeRequest $request, string $code, CreateOrderChangeRequestAction $action): JsonResponse
    {
        $data = $request->validated();
        $result = $action->handle($code, (int) $request->user()->id, $data['type'], $data['reason']);

        return response()->json(['data' => $this->details($result['order'])], 201);
    }

    private function details(object $order, bool $includeChangeRequests = true): array
    {
        $changeRequests = $includeChangeRequests && Schema::hasTable('order_change_requests')
            ? DB::table('order_change_requests')->where('order_id', $order->id)
                ->orderByDesc('created_at')->orderByDesc('id')->get([
                    'id', 'type', 'status', 'reason', 'resolution_note', 'created_at', 'reviewed_at',
                ])->map(fn (object $changeRequest): array => [
                    'id' => (int) $changeRequest->id,
                    'type' => $changeRequest->type,
                    'status' => $changeRequest->status,
                    'reason' => $changeRequest->reason,
                    'resolution_note' => $changeRequest->resolution_note,
                    'created_at' => $changeRequest->created_at,
                    'reviewed_at' => $changeRequest->reviewed_at,
                ])->all()
            : [];
        $shippingMethod = null;
        if ($order->shipping_method_name !== null) {
            $shippingMethod = [
                'id' => $order->shipping_method_id === null ? null : (int) $order->shipping_method_id,
                'name' => (string) $order->shipping_method_name,
                'est_days' => $order->shipping_method_est_days === null ? null : (string) $order->shipping_method_est_days,
            ];
        } elseif ($order->shipping_method_id !== null) {
            $method = DB::table('shipping_methods')->where('id', $order->shipping_method_id)->first(['id', 'name', 'est_days']);
            $shippingMethod = $method ? ['id' => (int) $method->id, 'name' => (string) $method->name, 'est_days' => $method->est_days === null ? null : (string) $method->est_days] : null;
        }

        $refunds = DB::table('payment_refunds')->where('order_id', $order->id)
            ->orderBy('created_at')->orderBy('id')->get(['amount', 'created_at'])
            ->map(fn (object $refund): array => [
                'amount_vnd' => (int) $refund->amount,
                'created_at' => $refund->created_at,
            ])->all();

        return [
            'code' => $order->code,
            'status' => $order->status,
            'shipping_method' => $shippingMethod,
            'payment_method' => (string) $order->payment_method,
            'payment_status' => $order->payment_status,
            'subtotal' => (int) $order->subtotal,
            'discount_total' => (int) $order->discount_total,
            'membership_points_used' => (int) ($order->membership_points_used ?? 0),
            'membership_discount_total' => (int) ($order->membership_discount_total ?? 0),
            'shipping_fee' => (int) $order->shipping_fee,
            'grand_total' => (int) $order->grand_total,
            'refund_total' => array_sum(array_column($refunds, 'amount_vnd')),
            'refunds' => $refunds,
            'shipping_address' => json_decode($order->shipping_address, true),
            'fulfillment_type' => $order->fulfillment_type ?? 'delivery',
            'pickup_location' => isset($order->pickup_location_snapshot) && $order->pickup_location_snapshot !== null ? json_decode($order->pickup_location_snapshot, true) : null,
            'placed_at' => $order->placed_at,
            'delivered_at' => $order->delivered_at,
            'items' => $this->orderItems($order, $includeChangeRequests),
            'shipments' => DB::table('shipments')->where('order_id', $order->id)
                ->orderByDesc('created_at')->orderByDesc('id')->get([
                    'id', 'carrier', 'tracking_code', 'tracking_url', 'status', 'shipped_at', 'delivered_at',
                ])->map(fn (object $shipment): array => [
                    'id' => (int) $shipment->id,
                    'carrier' => $shipment->carrier,
                    'tracking_code' => $shipment->tracking_code,
                    'tracking_url' => $shipment->tracking_url,
                    'status' => $shipment->status,
                    'shipped_at' => $shipment->shipped_at,
                    'delivered_at' => $shipment->delivered_at,
                ])->all(),
            'change_requests' => $changeRequests,
            'history' => DB::table('order_status_histories')->where('order_id', $order->id)
                ->where(fn ($query) => $query->whereNull('note')->orWhere('note', 'not like', '[INTERNAL_NOTE]%'))
                ->orderBy('created_at')->get(),
        ];
    }

    private function orderItems(object $order, bool $includeReviewStatus): Collection
    {
        $query = DB::table('order_items as order_items')->where('order_items.order_id', $order->id);

        if ($includeReviewStatus) {
            $query->leftJoin('reviews', function ($join) use ($order): void {
                $join->on('reviews.order_item_id', '=', 'order_items.id')
                    ->where('reviews.user_id', '=', $order->user_id);
            })->addSelect('order_items.*', 'reviews.status as review_status');
        } else {
            $query->select('order_items.*');
        }

        return $query->get();
    }
}
