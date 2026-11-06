<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\BulkUpdateOrderStatusRequest;
use App\Http\Requests\Api\V1\Admin\CreateManualOrderRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminOrdersRequest;
use App\Http\Requests\Api\V1\Admin\RefundOrderRequest;
use App\Http\Requests\Api\V1\Admin\ReviewOrderChangeRequest;
use App\Http\Requests\Api\V1\Admin\UpdateOrderAddressRequest;
use App\Http\Requests\Api\V1\Admin\UpdateOrderNoteRequest;
use App\Http\Requests\Api\V1\Admin\UpdateOrderPaymentRequest;
use App\Http\Requests\Api\V1\Admin\UpdateOrderShipmentRequest;
use App\Http\Requests\Api\V1\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\OrderDetailResource;
use App\Modules\Membership\Actions\ApplyOrderMembershipPointsAction;
use App\Modules\Orders\Actions\CreateManualOrderAction;
use App\Modules\Orders\Actions\ReviewOrderChangeRequestAction;
use App\Modules\Orders\Actions\TransitionOrderAction;
use App\Modules\Payments\Actions\RefundPaymentAction;
use App\Support\AdminNotificationDispatcher;
use App\Support\PaymentPayloadSanitizer;
use App\Support\StoreOrderNotifier;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function createManual(CreateManualOrderRequest $request, CreateManualOrderAction $action): JsonResponse
    {
        $order = $action->handle($request->validated(), (int) $request->user()->id, $request->header('Idempotency-Key'));
        if ($order->was_created ?? false) {
            StoreOrderNotifier::orderPlaced($order, $request->user()?->signature);
        }

        return response()->json(['data' => ['id' => $order->id, 'code' => $order->code, 'status' => $order->status, 'grand_total' => (int) $order->grand_total]], 201);
    }

    public function manualOptions(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        $now = now()->toDateTimeString();
        $products = DB::table('product_variants as v')
            ->join('products as p', 'p.id', '=', 'v.product_id')
            ->leftJoin('inventories as i', 'i.variant_id', '=', 'v.id')
            ->leftJoin('attribute_values as c', 'c.id', '=', 'v.color_value_id')
            ->leftJoin('attribute_values as s', 's.id', '=', 'v.size_value_id')
            ->whereNull('p.deleted_at')->where('p.status', 'active')->where('v.is_active', true)
            ->where(fn ($builder) => $builder->where('p.name', 'like', '%'.$query.'%')->orWhere('v.sku', 'like', '%'.$query.'%'))
            ->select(['v.id as variant_id', 'v.sku', 'p.name as product_name', 'i.quantity', 'i.reserved', 'c.value as color', 's.value as size'])
            ->selectRaw('CASE WHEN v.compare_at_price IS NOT NULL AND v.compare_at_price > v.price AND (p.sale_starts_at IS NULL OR p.sale_starts_at <= ?) AND (p.sale_ends_at IS NULL OR p.sale_ends_at >= ?) THEN v.price WHEN v.compare_at_price IS NOT NULL AND v.compare_at_price > v.price THEN v.compare_at_price ELSE v.price END AS price', [$now, $now])
            ->limit(30)->get();

        return response()->json(['data' => $products->map(fn (object $row): array => [
            ...(array) $row,
            'available' => max(0, (int) ($row->quantity ?? 0) - (int) ($row->reserved ?? 0)),
            'price' => (int) $row->price,
        ]), 'shipping_methods' => DB::table('shipping_methods')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'fee'])]);
    }

    public function manualCustomers(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        $customers = DB::table('users')->whereNull('deleted_at')->where('status', 'active')
            ->where(fn ($builder) => $builder->where('name', 'like', '%'.$query.'%')->orWhere('email', 'like', '%'.$query.'%')->orWhere('phone', 'like', '%'.$query.'%'))
            ->orderBy('name')->limit(15)->get(['id', 'name', 'email', 'phone']);

        return response()->json(['data' => $customers]);
    }

    public function index(ListAdminOrdersRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $orders = $this->orderedOrders($filters)->paginate($filters['per_page'] ?? 20);
        $shippingMethods = DB::table('shipping_methods')->orderBy('name')->get(['id', 'name']);
        $provinces = DB::table('shipping_rates')->orderBy('province_name')->get(['province_code', 'province_name'])
            ->keyBy('province_code');
        if ($provinces->isEmpty()) {
            DB::table('orders')
                ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province_code')) as province_code")
                ->whereNotNull('shipping_address')
                ->whereRaw("JSON_EXTRACT(shipping_address, '$.province_code') IS NOT NULL")
                ->distinct()->limit(100)->pluck('province_code')
                ->each(function (string $code) use ($provinces): void {
                    $provinces->put($code, (object) ['province_code' => $code, 'province_name' => $code]);
                });
        }
        $provinces = $provinces->sortBy('province_name')->values();
        $countFilters = $filters;
        unset($countFilters['status']);
        $statusCounts = $this->orderedOrders($countFilters)->reorder()
            ->select('orders.status')->selectRaw('COUNT(*) as count')->groupBy('orders.status')->get()
            ->mapWithKeys(fn (object $row): array => [$row->status => (int) $row->count])->all();

        return response()->json([
            'data' => $orders->items(),
            'links' => [
                'first' => $orders->url(1), 'last' => $orders->url($orders->lastPage()),
                'prev' => $orders->previousPageUrl(), 'next' => $orders->nextPageUrl(),
            ],
            'meta' => ['current_page' => $orders->currentPage(), 'last_page' => $orders->lastPage(), 'per_page' => $orders->perPage(), 'total' => $orders->total()],
            'filters' => [
                'shipping_methods' => $shippingMethods,
                'provinces' => $provinces,
                'coupon_codes' => DB::table('coupons')->orderBy('code')->limit(100)->pluck('code'),
                'status_counts' => $statusCounts,
            ],
        ]);
    }

    public function show(int $order): JsonResponse
    {
        $record = DB::table('orders')->where('id', $order)->first();
        abort_if(! $record, 404);

        return $this->detailResponse($record);
    }

    public function reviewChangeRequest(ReviewOrderChangeRequest $request, int $order, int $changeRequest, ReviewOrderChangeRequestAction $action): JsonResponse
    {
        $data = $request->validated();
        $result = $action->handle($order, $changeRequest, (int) $request->user()->id, $data['decision'], $data['resolution_note'] ?? null);

        return $this->detailResponse($result['order']);
    }

    public function export(ListAdminOrdersRequest $request): StreamedResponse
    {
        $filters = $request->validated();
        $orders = $this->orderedOrders($filters)->cursor();

        return response()->streamDownload(function () use ($orders): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['Mã đơn', 'Khách hàng', 'Số điện thoại', 'Số sản phẩm', 'Phương thức thanh toán', 'Tổng tiền (VND)', 'Thanh toán', 'Trạng thái', 'Ngày đặt']);
            foreach ($orders as $order) {
                fputcsv($handle, [$order->code, $order->customer_name, $order->customer_phone, $order->item_count, $order->payment_method, $order->grand_total, $order->payment_status, $order->status, $order->placed_at ?? $order->created_at]);
            }
            fclose($handle);
        }, 'orders-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function orderedOrders(array $filters): Builder
    {
        $sort = $filters['sort'] ?? '-placed_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $direction = $descending ? 'desc' : 'asc';

        $query = DB::table('orders')->select('orders.*')
            ->selectSub(
                DB::table('order_items')->selectRaw('COALESCE(SUM(order_items.quantity), 0)')
                    ->whereColumn('order_items.order_id', 'orders.id'),
                'item_count',
            )
            ->selectSub(
                DB::table('payments')->selectRaw('COUNT(*)')
                    ->whereColumn('payments.order_id', 'orders.id')->where('payments.status', 'failed'),
                'failed_payment_count',
            )
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->when(($filters['queue'] ?? null) === 'overdue', fn ($query) => $query->whereIn('status', ['confirmed', 'processing'])->where('updated_at', '<=', now()->subHours(24)))
            ->when(($filters['queue'] ?? null) === 'cancel_return', function ($query): void {
                if (! Schema::hasTable('order_change_requests')) {
                    $query->whereRaw('1 = 0');

                    return;
                }
                $query->whereExists(fn (Builder $requests) => $requests->selectRaw('1')
                    ->from('order_change_requests')->whereColumn('order_change_requests.order_id', 'orders.id')->where('order_change_requests.status', 'pending'));
            })
            ->when(isset($filters['payment_status']), function ($query) use ($filters) {
                if ($filters['payment_status'] === 'failed') {
                    return $query->whereExists(fn (Builder $payments) => $payments->selectRaw('1')
                        ->from('payments')->whereColumn('payments.order_id', 'orders.id')->where('payments.status', 'failed'));
                }

                return $query->where('orders.payment_status', $filters['payment_status']);
            })
            ->when(isset($filters['payment_method']), function ($query) use ($filters) {
                if ($filters['payment_method'] === 'other') {
                    return $query->whereNotIn('payment_method', ['cod', 'bank_transfer']);
                }

                return $query->where('payment_method', $filters['payment_method']);
            })
            ->when(isset($filters['shipping_method_id']), fn ($query) => $query->where('shipping_method_id', $filters['shipping_method_id']))
            ->when(isset($filters['shipping_method_ids']), fn ($query) => $query->whereIn('shipping_method_id', array_map('intval', explode(',', $filters['shipping_method_ids']))))
            ->when(isset($filters['has_coupon']), fn ($query) => $filters['has_coupon'] ? $query->whereNotNull('coupon_id') : $query->whereNull('coupon_id'))
            ->when(isset($filters['coupon_code']), fn ($query) => $query->where('coupon_code', strtoupper(trim($filters['coupon_code']))))
            ->when(isset($filters['province_code']), fn ($query) => $query->where('shipping_address->province_code', $filters['province_code']))
            ->when(isset($filters['province_codes']), fn ($query) => $query->whereIn('shipping_address->province_code', explode(',', $filters['province_codes'])))
            ->when(isset($filters['has_note']), fn ($query) => $filters['has_note'] ? $query->whereNotNull('note')->where('note', '!=', '') : $query->where(fn ($notes) => $notes->whereNull('note')->orWhere('note', '')))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate(DB::raw('COALESCE(placed_at, created_at)'), '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate(DB::raw('COALESCE(placed_at, created_at)'), '<=', $filters['to']))
            ->when(isset($filters['min_total']), fn ($query) => $query->where('grand_total', '>=', $filters['min_total']))
            ->when(isset($filters['max_total']), fn ($query) => $query->where('grand_total', '<=', $filters['max_total']))
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('code', 'like', '%'.$filters['q'].'%')->orWhere('customer_phone', 'like', '%'.$filters['q'].'%')->orWhere('customer_name', 'like', '%'.$filters['q'].'%')->orWhere('customer_email', 'like', '%'.$filters['q'].'%')));

        if ($field === 'grand_total') {
            $query->orderBy('grand_total', $direction);
        } else {
            $query->orderByRaw('COALESCE(placed_at, created_at) '.$direction);
        }

        return $query->orderByDesc('created_at')->orderByDesc('id');
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $order, TransitionOrderAction $transition): JsonResponse
    {
        $data = $request->validated();
        $record = $transition->handle($order, $data['status'], $data['note'] ?? null, $request->user()?->id, $data['payment_collected'] ?? false);

        return $this->detailResponse($record);
    }

    public function updatePaymentStatus(UpdateOrderPaymentRequest $request, int $order, ApplyOrderMembershipPointsAction $membershipPoints): JsonResponse
    {
        $data = $request->validated();
        $record = DB::transaction(function () use ($data, $order, $request): object {
            $record = DB::table('orders')->where('id', $order)->lockForUpdate()->first();
            abort_if(! $record, 404);
            if ($data['payment_status'] === 'paid' && (! in_array($record->payment_method, ['cod', 'bank_transfer'], true) || $record->payment_status !== 'unpaid')) {
                throw ValidationException::withMessages(['payment_status' => 'Chỉ có thể ghi nhận COD hoặc chuyển khoản đã đối soát cho đơn chưa thanh toán.']);
            }
            $now = now();
            DB::table('orders')->where('id', $order)->update(['payment_status' => $data['payment_status'], 'updated_at' => $now]);
            DB::table('payments')->where('order_id', $order)->latest('id')->limit(1)->update([
                'status' => $data['payment_status'] === 'unpaid' ? 'pending' : $data['payment_status'],
                'paid_at' => $data['payment_status'] === 'paid' ? $now : null,
                'updated_at' => $now,
            ]);
            DB::table('order_status_histories')->insert([
                'order_id' => $order, 'from_status' => $record->status, 'to_status' => $record->status,
                'note' => 'Thanh toán: '.$data['payment_status'].(! empty($data['note']) ? ' — '.$data['note'] : ''),
                'changed_by' => $request->user()?->id, 'created_at' => $now, 'updated_at' => $now,
            ]);

            if ($data['payment_status'] === 'paid' && in_array($record->status, ['delivered', 'completed'], true)) {
                $membershipPoints->award((int) $record->id);
            }

            return DB::table('orders')->where('id', $order)->first();
        });

        return $this->detailResponse($record);
    }

    public function refund(RefundOrderRequest $request, int $order, RefundPaymentAction $refundPayment): JsonResponse
    {
        $data = $request->validated();
        $orderRecord = DB::table('orders')->where('id', $order)->first();
        abort_if(! $orderRecord, 404);
        $payment = DB::table('payments')->where('order_id', $order)->whereIn('status', ['success', 'paid'])->orderByDesc('id')->first();
        abort_if(! $payment, 422, 'Không có giao dịch đã thanh toán để hoàn tiền.');
        $alreadyRefunded = (int) DB::table('payment_refunds')->where('payment_id', $payment->id)->sum('amount');
        $amount = (int) ($data['amount'] ?? max(0, (int) $payment->amount - $alreadyRefunded));
        $refundPayment->execute((int) $payment->id, $amount, trim($data['reason']), (int) $request->user()->id);

        return $this->detailResponse(DB::table('orders')->where('id', $order)->first());
    }

    public function bulkStatus(BulkUpdateOrderStatusRequest $request, TransitionOrderAction $transition): JsonResponse
    {
        $data = $request->validated();
        $updated = [];
        foreach ($data['order_ids'] as $orderId) {
            $record = $transition->handle($orderId, $data['status'], $data['note'] ?? null, $request->user()?->id, $data['payment_collected'] ?? false);
            $updated[] = $record->id;
        }

        return response()->json(['data' => ['updated_ids' => $updated, 'count' => count($updated)]]);
    }

    public function updateShipment(UpdateOrderShipmentRequest $request, int $order): JsonResponse
    {
        $data = $request->validated();

        [$record, $notifyCustomer, $trackingCode, $notifyDeliveryFailed] = DB::transaction(function () use ($data, $order): array {
            $orderRecord = DB::table('orders')->where('id', $order)->lockForUpdate()->first();
            abort_if(! $orderRecord, 404);
            $shipment = DB::table('shipments')->where('order_id', $order)->latest('id')->lockForUpdate()->first();
            $trackingCode = $data['tracking_code'] ?? null;
            $notifyCustomer = in_array($data['status'], ['picked_up', 'in_transit', 'delivered'], true)
                && ($shipment === null || $shipment->status !== $data['status'] || $shipment->tracking_code !== $trackingCode);
            $notifyDeliveryFailed = $data['status'] === 'failed' && ($shipment === null || $shipment->status !== 'failed');
            $timestamps = [
                'shipped_at' => in_array($data['status'], ['picked_up', 'in_transit', 'delivered'], true) ? now() : ($shipment?->shipped_at ?? null),
                'delivered_at' => $data['status'] === 'delivered' ? now() : ($shipment?->delivered_at ?? null),
            ];
            $payload = [
                'carrier' => $data['carrier'] ?? null,
                'tracking_code' => $data['tracking_code'] ?? null,
                'status' => $data['status'],
                ...$timestamps,
                'updated_at' => now(),
            ];
            if ($shipment) {
                DB::table('shipments')->where('id', $shipment->id)->update($payload);
            } else {
                DB::table('shipments')->insertGetId($payload + ['order_id' => $order, 'created_at' => now()]);
            }

            return [$orderRecord, $notifyCustomer, $trackingCode, $notifyDeliveryFailed];
        });
        if ($notifyCustomer) {
            StoreOrderNotifier::shipmentUpdated($record, $trackingCode, $request->user()?->signature);
        }
        if ($notifyDeliveryFailed) {
            AdminNotificationDispatcher::send(
                'delivery_failed',
                'orders.view',
                'Giao hàng thất bại: '.$record->code,
                'Đơn hàng '.$record->code.' cần được kiểm tra lại trạng thái giao hàng.',
                '/shipments?status=failed',
            );
        }

        return $this->detailResponse($record);
    }

    public function updateNote(UpdateOrderNoteRequest $request, int $order): JsonResponse
    {
        $data = $request->validated();
        $record = DB::transaction(function () use ($data, $order, $request): object {
            $record = DB::table('orders')->where('id', $order)->lockForUpdate()->first();
            abort_if(! $record, 404);
            $signature = trim((string) $request->user()?->signature);
            DB::table('order_status_histories')->insert([
                'order_id' => $order,
                'from_status' => $record->status,
                'to_status' => $record->status,
                'note' => '[INTERNAL_NOTE] '.$data['note'].($signature !== '' ? "\n— ".$signature : ''),
                'changed_by' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('orders')->where('id', $order)->update(['updated_at' => now()]);

            return DB::table('orders')->where('id', $order)->first();
        });

        return $this->detailResponse($record);
    }

    public function updateAddress(UpdateOrderAddressRequest $request, int $order): JsonResponse
    {
        $data = $request->validated();
        $record = DB::transaction(function () use ($data, $order): object {
            $record = DB::table('orders')->where('id', $order)->lockForUpdate()->first();
            abort_if(! $record, 404);
            $latestShipment = DB::table('shipments')->where('order_id', $order)->orderByDesc('id')->first();
            if (in_array($record->status, ['delivered', 'completed', 'returned', 'cancelled'], true)
                || $latestShipment?->status === 'delivered' || $latestShipment?->delivered_at !== null) {
                throw ValidationException::withMessages(['shipping_address' => 'Không thể sửa địa chỉ sau khi đơn hàng đã giao, hoàn hoặc hủy.']);
            }
            $shippingAddress = json_decode((string) $record->shipping_address, true) ?: [];
            $shippingAddress = array_merge($shippingAddress, $data['shipping_address']);
            DB::table('orders')->where('id', $order)->update([
                'customer_name' => $data['customer_name'], 'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null, 'shipping_address' => json_encode($shippingAddress, JSON_UNESCAPED_UNICODE), 'updated_at' => now(),
            ]);

            return DB::table('orders')->where('id', $order)->first();
        });

        return $this->detailResponse($record);
    }

    private function detailResponse(object $order): JsonResponse
    {
        return OrderDetailResource::make($this->details($order))->response();
    }

    /** @return array<string, mixed> */
    private function details(object $order): array
    {
        $paymentRows = DB::table('payments')->where('order_id', $order->id)->orderByDesc('created_at')->orderByDesc('id')->get([
            'id', 'method', 'transaction_ref', 'amount', 'status', 'paid_at', 'created_at', 'raw_payload',
        ]);
        $refundRows = DB::table('payment_refunds')->leftJoin('users as actors', 'actors.id', '=', 'payment_refunds.recorded_by')
            ->whereIn('payment_refunds.payment_id', $paymentRows->pluck('id'))
            ->orderBy('payment_refunds.created_at')->orderBy('payment_refunds.id')
            ->get(['payment_refunds.id', 'payment_refunds.payment_id', 'payment_refunds.amount', 'payment_refunds.reason', 'payment_refunds.created_at', 'actors.name as recorded_by_name']);
        $refundsByPayment = $refundRows->groupBy('payment_id');
        $payments = $paymentRows->map(function (object $payment) use ($refundsByPayment): array {
            $refunds = $refundsByPayment->get($payment->id, collect())->map(fn (object $refund): array => [
                'id' => (int) $refund->id,
                'amount' => (int) $refund->amount,
                'reason' => $refund->reason,
                'recorded_by_name' => $refund->recorded_by_name,
                'created_at' => $refund->created_at,
            ])->values();
            $refundedAmount = (int) $refunds->sum('amount');

            return [
                'id' => (int) $payment->id,
                'provider' => $payment->method,
                'transaction_ref' => $payment->transaction_ref,
                'amount' => (int) $payment->amount,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
                'payload' => PaymentPayloadSanitizer::sanitizedArray($payment->raw_payload),
                'refunded_amount' => $refundedAmount,
                'refundable_amount' => max(0, (int) $payment->amount - $refundedAmount),
                'refunds' => $refunds->all(),
            ];
        });

        return [
            'id' => $order->id,
            'code' => $order->code,
            'customer_id' => $order->user_id ? (int) $order->user_id : null,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'invoice_requested' => (bool) ($order->invoice_requested ?? false),
            'invoice_tax_code' => $order->invoice_tax_code ?? null,
            'invoice_company_name' => $order->invoice_company_name ?? null,
            'invoice_address' => $order->invoice_address ?? null,
            'shipping_address' => json_decode($order->shipping_address, true),
            'fulfillment_type' => $order->fulfillment_type ?? 'delivery',
            'pickup_location' => isset($order->pickup_location_snapshot) && $order->pickup_location_snapshot !== null ? json_decode($order->pickup_location_snapshot, true) : null,
            'subtotal' => (int) $order->subtotal,
            'discount_total' => (int) $order->discount_total,
            'membership_points_used' => (int) ($order->membership_points_used ?? 0),
            'membership_discount_total' => (int) ($order->membership_discount_total ?? 0),
            'shipping_fee' => (int) $order->shipping_fee,
            'grand_total' => (int) $order->grand_total,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'coupon_code' => $order->coupon_code,
            'note' => $order->note,
            'placed_at' => $order->placed_at,
            'delivered_at' => $order->delivered_at,
            'created_at' => $order->created_at,
            'items' => DB::table('order_items')->where('order_id', $order->id)->orderBy('id')->get([
                'id', 'product_id', 'variant_id', 'product_name', 'variant_name', 'sku', 'image',
                'unit_price', 'quantity', 'line_total',
            ])->map(fn (object $item): array => [
                'id' => (int) $item->id,
                'product_id' => $item->product_id ? (int) $item->product_id : null,
                'variant_id' => $item->variant_id ? (int) $item->variant_id : null,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'sku' => $item->sku,
                'image' => $item->image,
                'unit_price' => (int) $item->unit_price,
                'quantity' => (int) $item->quantity,
                'line_total' => (int) $item->line_total,
            ])->all(),
            'payments' => $payments->all(),
            'shipments' => DB::table('shipments')->where('order_id', $order->id)->orderByDesc('created_at')->orderByDesc('id')->get([
                'id', 'carrier', 'tracking_code', 'status', 'shipped_at', 'delivered_at', 'created_at',
            ])->map(fn (object $shipment): array => [
                'id' => (int) $shipment->id,
                'carrier' => $shipment->carrier,
                'tracking_code' => $shipment->tracking_code,
                'status' => $shipment->status,
                'shipped_at' => $shipment->shipped_at,
                'delivered_at' => $shipment->delivered_at,
                'created_at' => $shipment->created_at,
            ])->all(),
            'history' => DB::table('order_status_histories')->leftJoin('users as actors', 'actors.id', '=', 'order_status_histories.changed_by')
                ->where('order_status_histories.order_id', $order->id)->orderBy('order_status_histories.created_at')->orderBy('order_status_histories.id')
                ->get(['order_status_histories.id', 'order_status_histories.from_status', 'order_status_histories.to_status', 'order_status_histories.note', 'order_status_histories.changed_by', 'order_status_histories.created_at', 'actors.name as changed_by_name'])
                ->map(fn (object $history): array => [
                    'id' => (int) $history->id,
                    'from_status' => $history->from_status,
                    'to_status' => $history->to_status,
                    'note' => str_starts_with((string) $history->note, '[INTERNAL_NOTE]')
                        ? ltrim(substr((string) $history->note, strlen('[INTERNAL_NOTE]')))
                        : $history->note,
                    'type' => str_starts_with((string) $history->note, '[INTERNAL_NOTE]') ? 'internal_note' : 'status_change',
                    'changed_by' => $history->changed_by ? (int) $history->changed_by : null,
                    'changed_by_name' => $history->changed_by_name,
                    'created_at' => $history->created_at,
                ])->all(),
            'change_requests' => Schema::hasTable('order_change_requests') ? DB::table('order_change_requests')->leftJoin('users as requesters', 'requesters.id', '=', 'order_change_requests.requester_id')
                ->leftJoin('users as reviewers', 'reviewers.id', '=', 'order_change_requests.reviewed_by')
                ->where('order_change_requests.order_id', $order->id)->orderByDesc('order_change_requests.created_at')->orderByDesc('order_change_requests.id')
                ->get(['order_change_requests.id', 'order_change_requests.requester_id', 'order_change_requests.type', 'order_change_requests.status', 'order_change_requests.reason', 'order_change_requests.resolution_note', 'order_change_requests.reviewed_by', 'order_change_requests.created_at', 'order_change_requests.reviewed_at', 'requesters.name as requester_name', 'reviewers.name as reviewer_name'])
                ->map(fn (object $changeRequest): array => [
                    'id' => (int) $changeRequest->id,
                    'requester_id' => $changeRequest->requester_id ? (int) $changeRequest->requester_id : null,
                    'requester_name' => $changeRequest->requester_name,
                    'type' => $changeRequest->type,
                    'status' => $changeRequest->status,
                    'reason' => $changeRequest->reason,
                    'resolution_note' => $changeRequest->resolution_note,
                    'reviewed_by' => $changeRequest->reviewed_by ? (int) $changeRequest->reviewed_by : null,
                    'reviewer_name' => $changeRequest->reviewer_name,
                    'created_at' => $changeRequest->created_at,
                    'reviewed_at' => $changeRequest->reviewed_at,
                ])->all() : [],
        ];
    }
}
