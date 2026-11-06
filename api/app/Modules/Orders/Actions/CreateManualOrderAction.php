<?php

namespace App\Modules\Orders\Actions;

use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateManualOrderAction
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    public function handle(array $data, int $actorId, ?string $idempotencyKey): object
    {
        if (! $idempotencyKey || strlen($idempotencyKey) > 120) {
            throw ValidationException::withMessages(['Idempotency-Key' => 'Thiếu mã yêu cầu tạo đơn hoặc mã quá dài.']);
        }

        return DB::transaction(function () use ($data, $actorId, $idempotencyKey): object {
            $pricingAt = now();
            $existing = DB::table('orders')->where('idempotency_key', $idempotencyKey)->lockForUpdate()->first();
            if ($existing) {
                $existing->was_created = false;

                return $existing;
            }

            $quantities = collect($data['items'])->keyBy('variant_id');
            $variants = ProductVariant::query()->whereIn('id', $quantities->keys())
                ->where('is_active', true)->whereHas('product', fn ($query) => $query->where('status', 'active'))
                ->with(['product.images', 'color', 'size'])->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            if ($variants->count() !== $quantities->count()) {
                throw ValidationException::withMessages(['items' => 'Có biến thể không còn được bán.']);
            }

            $inventories = Inventory::query()
                ->whereIn('variant_id', $variants->keys())
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get()
                ->keyBy('variant_id');
            $subtotal = 0;
            foreach ($quantities as $variantId => $item) {
                $variant = $variants->get($variantId);
                $inventory = $inventories->get($variantId);
                $quantity = (int) $item['quantity'];
                if (! $inventory || $quantity > max(0, $inventory->quantity - $inventory->reserved)) {
                    throw ValidationException::withMessages(['items' => "Biến thể {$variant->sku} không đủ tồn kho khả dụng."]);
                }
                $variant->setRelation('inventory', $inventory);
                $subtotal += $variant->effectivePrice($variant->product, $pricingAt) * $quantity;
            }

            $shippingMethod = null;
            if (! empty($data['shipping_method_id'])) {
                $shippingMethod = DB::table('shipping_methods')->where('id', $data['shipping_method_id'])->where('is_active', true)->first();
                if (! $shippingMethod) {
                    throw ValidationException::withMessages(['shipping_method_id' => 'Phương thức vận chuyển không còn hoạt động.']);
                }
            }
            $provinceCode = $data['shipping_address']['province_code'];
            $provinceRate = DB::table('shipping_rates')->where('province_code', $provinceCode)->where('is_active', true)->first();
            $shippingFee = (int) ($provinceRate?->fee ?? $shippingMethod->fee ?? DB::table('settings')->where('key', 'default_shipping_fee')->value('value') ?? config('store.default_shipping_fee', 0));
            $threshold = $provinceRate?->free_shipping_threshold ?? DB::table('settings')->where('key', 'free_shipping_threshold')->value('value') ?? config('store.free_shipping_threshold');
            if ($threshold !== null && $subtotal >= (int) $threshold) {
                $shippingFee = 0;
            }
            $coupon = null;
            $discount = 0;
            if (! empty($data['coupon_code'])) {
                $coupon = Coupon::query()->where('code', Str::upper(trim($data['coupon_code'])))->where('is_active', true)->lockForUpdate()->first();
                if (! $coupon || ($coupon->starts_at && $coupon->starts_at->isFuture()) || ($coupon->ends_at && $coupon->ends_at->isPast())
                    || $subtotal < $coupon->min_order_value || ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit)) {
                    throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không hợp lệ, hết hạn hoặc chưa đủ điều kiện.']);
                }
                if (! empty($data['customer_id']) && $coupon->usage_per_user !== null) {
                    $usedByCustomer = DB::table('coupon_usages')->where('coupon_id', $coupon->id)->where('user_id', $data['customer_id'])->count();
                    if ($usedByCustomer >= $coupon->usage_per_user) {
                        throw ValidationException::withMessages(['coupon_code' => 'Khách hàng đã sử dụng hết lượt của mã giảm giá này.']);
                    }
                }
                if ($coupon->type === 'percent') {
                    $discount = (int) floor($subtotal * $coupon->value / 100);
                    if ($coupon->max_discount !== null) {
                        $discount = min($discount, (int) $coupon->max_discount);
                    }
                } elseif ($coupon->type === 'fixed') {
                    $discount = min($subtotal, (int) $coupon->value);
                } elseif ($coupon->type === 'free_ship') {
                    $shippingFee = 0;
                }
            }
            $now = $pricingAt;
            $code = 'FS'.now()->format('ymd').'-'.Str::upper(Str::random(6));
            $orderId = DB::table('orders')->insertGetId([
                'code' => $code, 'idempotency_key' => $idempotencyKey, 'user_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'], 'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'], 'shipping_address' => json_encode($data['shipping_address'], JSON_THROW_ON_ERROR),
                'subtotal' => $subtotal, 'discount_total' => $discount, 'shipping_fee' => $shippingFee,
                'grand_total' => $subtotal - $discount + $shippingFee, 'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code, 'shipping_method_id' => $shippingMethod->id ?? null,
                'status' => 'pending', 'payment_status' => 'unpaid', 'payment_method' => 'cod',
                'note' => $data['note'] ?? null, 'placed_at' => $now, 'created_at' => $now, 'updated_at' => $now,
            ]);

            foreach ($quantities as $variantId => $item) {
                $variant = $variants->get($variantId);
                $product = $variant->product;
                $quantity = (int) $item['quantity'];
                DB::table('order_items')->insert([
                    'order_id' => $orderId, 'product_id' => $product->id, 'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_name' => trim(($variant->color?->value ?? '').' '.($variant->size?->value ?? '')) ?: null,
                    'sku' => $variant->sku, 'image' => $product->images->first()?->url,
                    'unit_price' => $variant->effectivePrice($product, $pricingAt), 'quantity' => $quantity,
                    'line_total' => $variant->effectivePrice($product, $pricingAt) * $quantity, 'created_at' => $now, 'updated_at' => $now,
                ]);
                $this->inventoryService->reserveForOrder((int) $variant->id, $quantity, (int) $orderId, 'Giữ tồn cho đơn thủ công '.$code, $actorId);
            }

            DB::table('payments')->insert(['order_id' => $orderId, 'method' => 'cod', 'amount' => $subtotal - $discount + $shippingFee, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now]);
            DB::table('order_status_histories')->insert(['order_id' => $orderId, 'from_status' => null, 'to_status' => 'pending', 'note' => 'Đơn hàng thủ công được tạo', 'changed_by' => $actorId, 'created_at' => $now, 'updated_at' => $now]);
            if ($coupon) {
                DB::table('coupon_usages')->insert(['coupon_id' => $coupon->id, 'user_id' => $data['customer_id'] ?? null, 'order_id' => $orderId, 'discount' => $discount, 'created_at' => $now, 'updated_at' => $now]);
                $coupon->increment('used_count');
            }

            $order = DB::table('orders')->where('id', $orderId)->first();
            $order->was_created = true;

            return $order;
        });
    }
}
