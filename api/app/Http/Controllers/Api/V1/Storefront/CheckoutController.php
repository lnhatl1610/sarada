<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\GetShippingFeeRequest;
use App\Http\Requests\Api\V1\Storefront\ListAvailableCouponsRequest;
use App\Http\Resources\AvailableCouponResource;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Membership\Actions\RedeemMembershipPointsAction;
use App\Modules\Shipping\Actions\GetStorefrontShippingEstimateAction;
use App\Modules\Shipping\Queries\AvailableShippingMethods;
use App\Support\StorefrontPaymentConfiguration;
use App\Support\StoreOrderNotifier;
use App\Support\VietnamAddressCatalog;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function availableCoupons(ListAvailableCouponsRequest $request): JsonResponse
    {
        $cart = $this->cart($request);
        $items = $cart->items()->with(['variant.product', 'variant.inventory'])->get();
        $pricingAt = now();
        $subtotal = 0;

        foreach ($items as $item) {
            $variant = $item->variant;
            if (! $variant || ! $variant->is_active || $variant->product?->status !== 'active') {
                throw ValidationException::withMessages(['cart' => 'Một sản phẩm trong giỏ không còn được bán.']);
            }

            $available = max(0, ($variant->inventory?->quantity ?? 0) - ($variant->inventory?->reserved ?? 0));
            if ($item->quantity > $available) {
                throw ValidationException::withMessages(['cart' => 'Số lượng tồn kho đã thay đổi. Vui lòng cập nhật giỏ hàng.']);
            }

            $subtotal += $variant->effectivePrice($variant->product, $pricingAt) * $item->quantity;
        }

        $userId = $request->user()?->id;
        $usedByUser = $userId
            ? DB::table('coupon_usages')->select('coupon_id', DB::raw('COUNT(*) as usage_count'))->where('user_id', $userId)->groupBy('coupon_id')->pluck('usage_count', 'coupon_id')
            : collect();
        $coupons = Coupon::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $pricingAt))
            ->where(fn ($query) => $query
                ->where(fn ($query) => $query->whereNotNull('ends_at')->where('ends_at', '>=', $pricingAt))
                ->orWhere(fn ($query) => $query->whereNull('ends_at')->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>=', $pricingAt))))
            ->orderBy('min_order_value')
            ->orderBy('id')
            ->limit(100)
            ->get();

        $offers = $coupons->map(function (Coupon $coupon) use ($subtotal, $usedByUser): array {
            $reason = null;
            if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
                $reason = 'Mã ưu đãi đã hết lượt sử dụng.';
            } elseif ($coupon->usage_per_user !== null) {
                if (($usedByUser[$coupon->id] ?? 0) >= $coupon->usage_per_user) {
                    $reason = 'Bạn đã sử dụng hết lượt của mã ưu đãi này.';
                }
            }

            if ($reason === null && $subtotal < (int) $coupon->min_order_value) {
                $reason = 'Đơn hàng cần đạt tối thiểu '.number_format((int) $coupon->min_order_value, 0, ',', '.').'₫.';
            }

            return [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'description' => $coupon->description,
                'type' => $coupon->type,
                'value' => (int) $coupon->value,
                'max_discount' => $coupon->max_discount === null ? null : (int) $coupon->max_discount,
                'min_order_value' => (int) $coupon->min_order_value,
                'ends_at' => ($coupon->ends_at ?? $coupon->expires_at)?->toIso8601String(),
                'eligible' => $reason === null,
                'unavailable_reason' => $reason,
            ];
        });

        return response()->json(['data' => AvailableCouponResource::collection($offers)]);
    }

    public function shippingFee(GetShippingFeeRequest $request, GetStorefrontShippingEstimateAction $estimate): JsonResponse
    {
        $data = $request->validated();

        return response()->json(['data' => $estimate->execute($data['province_code'], $data['ward_code'] ?? null)]);
    }

    public function pickupAvailability(Request $request): JsonResponse
    {
        $cart = $this->cart($request);
        $items = $cart->items()->get(['variant_id', 'quantity']);
        if ($items->isEmpty() || $items->contains(fn (object $item): bool => $item->variant_id === null)) {
            return response()->json(['data' => []]);
        }
        $eligibleVariantCount = DB::table('product_variants')->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereIn('product_variants.id', $items->pluck('variant_id'))->where('product_variants.is_active', true)->where('products.status', 'active')->count();
        if ($eligibleVariantCount !== $items->pluck('variant_id')->unique()->count()) {
            return response()->json(['data' => []]);
        }
        $locations = DB::table('store_locations')->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();
        $data = $locations->map(function (object $location) use ($items): ?array {
            $stocks = DB::table('store_location_inventories')->where('store_location_id', $location->id)
                ->whereIn('variant_id', $items->pluck('variant_id'))->get()->keyBy('variant_id');
            foreach ($items as $item) {
                $stock = $stocks->get($item->variant_id);
                if (! $stock || $stock->quantity - $stock->reserved < $item->quantity) {
                    return null;
                }
            }

            return [
                'id' => (int) $location->id,
                'name' => (string) $location->name,
                'address' => (string) $location->address,
                'province_name' => (string) $location->province_name,
                'ward_name' => $location->ward_name,
                'phone' => (string) $location->phone,
                'opening_hours' => (string) $location->opening_hours,
            ];
        })->filter()->values();

        return response()->json(['data' => $data]);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->merge(['fulfillment_type' => $request->input('fulfillment_type', 'delivery')]);
        $data = $request->validate([
            'fulfillment_type' => ['sometimes', 'in:delivery,pickup'],
            'pickup_location_id' => ['required_if:fulfillment_type,pickup', 'nullable', 'integer', 'min:1'],
            'province_code' => ['required_if:fulfillment_type,delivery', 'nullable', 'string', 'max:32'],
            'ward_code' => ['nullable', 'string', 'max:32'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'shipping_method_id' => ['nullable', 'integer', 'min:1'],
            'use_points' => ['sometimes', 'boolean'],
        ]);
        $fulfillmentType = $data['fulfillment_type'] ?? 'delivery';
        if ($fulfillmentType === 'delivery') {
            $this->assertProvinceCode($data['province_code'], 'province_code');
            if (! blank($data['ward_code'] ?? null)) {
                $this->assertWardCode($data['province_code'], $data['ward_code'], 'ward_code');
            }
        }
        $cart = $this->cart($request);
        $items = $cart->items()->with(['variant.product', 'variant.inventory'])->get();
        $quote = $this->quote($items, $data['province_code'] ?? '', $data['coupon_code'] ?? null, $request->user()?->id, shippingMethodId: isset($data['shipping_method_id']) ? (int) $data['shipping_method_id'] : null, wardCode: $data['ward_code'] ?? null, usePoints: (bool) ($data['use_points'] ?? false), fulfillmentType: $fulfillmentType, pickupLocationId: isset($data['pickup_location_id']) ? (int) $data['pickup_location_id'] : null);

        return response()->json(['data' => $quote]);
    }

    public function placeOrder(Request $request, InventoryService $inventoryService, RedeemMembershipPointsAction $redeemPoints): JsonResponse
    {
        $request->merge(['fulfillment_type' => $request->input('fulfillment_type', 'delivery')]);
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:160'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'fulfillment_type' => ['sometimes', 'in:delivery,pickup'],
            'pickup_location_id' => ['required_if:fulfillment_type,pickup', 'nullable', 'integer', 'min:1'],
            'shipping_address' => ['required_if:fulfillment_type,delivery', 'array'],
            'shipping_address.province_code' => ['required_if:fulfillment_type,delivery', 'string', 'max:32'],
            'shipping_address.district_code' => ['nullable', 'string', 'max:32'],
            'shipping_address.ward_code' => ['required_if:fulfillment_type,delivery', 'string', 'max:32'],
            'shipping_address.street' => ['required_if:fulfillment_type,delivery', 'string', 'max:255'],
            'shipping_address.recipient_name' => ['required_if:fulfillment_type,delivery', 'string', 'max:160'],
            'shipping_address.phone' => ['required_if:fulfillment_type,delivery', 'string', 'max:32'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'shipping_method_id' => ['nullable', 'integer', 'min:1'],
            'use_points' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string', 'max:2000'],
            'invoice_requested' => ['sometimes', 'boolean'],
            'invoice_tax_code' => ['exclude_unless:invoice_requested,true', 'required', 'string', 'regex:/^\d{10}(?:-\d{3})?$/', 'max:14'],
            'invoice_company_name' => ['exclude_unless:invoice_requested,true', 'required', 'string', 'max:255'],
            'invoice_address' => ['exclude_unless:invoice_requested,true', 'required', 'string', 'max:500'],
            'terms_accepted' => ['required', 'accepted'],
            'payment_method' => ['required', 'in:cod,bank_transfer'],
        ]);
        $fulfillmentType = $data['fulfillment_type'] ?? 'delivery';
        $data['shipping_address'] ??= [];
        if ($fulfillmentType === 'delivery' && blank($data['shipping_address']['district_code'] ?? null)) {
            $catalog = app(VietnamAddressCatalog::class);
            $province = $catalog->province($data['shipping_address']['province_code']);
            $ward = $catalog->ward($data['shipping_address']['province_code'], $data['shipping_address']['ward_code']);

            if (! $province) {
                $this->assertProvinceCode($data['shipping_address']['province_code'], 'shipping_address.province_code');
            }

            if (! $ward) {
                throw ValidationException::withMessages(['shipping_address.ward_code' => 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.']);
            }

            $data['shipping_address']['province_name'] = $province['name'];
            $data['shipping_address']['ward_name'] = $ward['name'];
            $data['shipping_address']['district_code'] = null;
        }
        $key = $request->header('Idempotency-Key');
        if (! $key || strlen($key) > 120) {
            throw ValidationException::withMessages(['Idempotency-Key' => 'Header Idempotency-Key là bắt buộc và tối đa 120 ký tự.']);
        }

        $idempotencyScope = $this->idempotencyScope($request);
        $existing = DB::table('orders')->where('idempotency_key', $key)->first();
        if ($existing) {
            abort_unless($existing->idempotency_scope !== null && hash_equals($existing->idempotency_scope, $idempotencyScope), 404);

            return response()->json(['data' => $this->orderPayload($existing)], 200);
        }

        $cart = $this->cart($request);
        $result = DB::transaction(function () use ($data, $key, $idempotencyScope, $request, $cart, $inventoryService, $redeemPoints, $fulfillmentType): array {
            $pricingAt = now();
            $existing = DB::table('orders')->where('idempotency_key', $key)->lockForUpdate()->first(['id', 'idempotency_scope']);
            if ($existing) {
                abort_unless($existing->idempotency_scope !== null && hash_equals($existing->idempotency_scope, $idempotencyScope), 404);

                return ['id' => (int) $existing->id, 'created' => false];
            }

            $paymentMethod = (string) $data['payment_method'];
            $paymentConfiguration = app(StorefrontPaymentConfiguration::class);
            $bankSettings = $paymentConfiguration->bankTransferSettings();
            $codEnabled = filter_var(DB::table('settings')->where('key', 'payment_cod_enabled')->value('value') ?? true, FILTER_VALIDATE_BOOLEAN);
            if ($paymentMethod === 'cod' && ! $codEnabled) {
                throw ValidationException::withMessages(['payment_method' => 'Thanh toán khi nhận hàng hiện chưa khả dụng.']);
            }
            if ($paymentMethod === 'bank_transfer' && ! $paymentConfiguration->bankTransferAvailable($bankSettings)) {
                throw ValidationException::withMessages(['payment_method' => 'Chuyển khoản/QR chưa được cửa hàng cấu hình đầy đủ.']);
            }

            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $items = $lockedCart->items()->with(['variant.product.images', 'variant.color', 'variant.size', 'variant.inventory'])->orderBy('variant_id')->get();
            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['cart' => 'Giỏ hàng đang trống.']);
            }

            $lockedVariants = ProductVariant::query()
                ->whereIn('id', $items->pluck('variant_id'))
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->where('status', 'active'))
                ->with(['product.images', 'color', 'size'])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $pickupLocation = null;
            $lockedStoreInventories = collect();
            if ($fulfillmentType === 'pickup') {
                $pickupLocation = DB::table('store_locations')->where('id', (int) $data['pickup_location_id'])->where('is_active', true)->lockForUpdate()->first();
                if (! $pickupLocation) {
                    throw ValidationException::withMessages(['pickup_location_id' => 'Cửa hàng nhận hàng không còn hoạt động. Hãy chọn địa điểm khác.']);
                }
                $lockedStoreInventories = DB::table('store_location_inventories')->where('store_location_id', $pickupLocation->id)
                    ->whereIn('variant_id', $lockedVariants->keys())->orderBy('variant_id')->lockForUpdate()->get()->keyBy('variant_id');
                $lockedInventories = collect();
            } else {
                $lockedInventories = Inventory::query()->whereIn('variant_id', $lockedVariants->keys())->orderBy('variant_id')->lockForUpdate()->get()->keyBy('variant_id');
            }

            foreach ($items as $item) {
                $variant = $lockedVariants->get($item->variant_id);
                if (! $variant) {
                    throw ValidationException::withMessages(['cart' => 'Một sản phẩm trong giỏ không còn được bán.']);
                }
                $inventory = $fulfillmentType === 'pickup' ? $lockedStoreInventories->get($variant->id) : $lockedInventories->get($variant->id);
                if ($fulfillmentType === 'delivery') {
                    $variant->setRelation('inventory', $inventory);
                }
                $item->setRelation('variant', $variant);
                $available = max(0, ($inventory?->quantity ?? 0) - ($inventory?->reserved ?? 0));
                if ($item->quantity > $available) {
                    throw ValidationException::withMessages([$fulfillmentType === 'pickup' ? 'pickup_location_id' : 'cart' => "Sản phẩm {$variant->sku} không đủ tồn kho tại lựa chọn hiện tại."]);
                }
            }

            $usePoints = (bool) ($data['use_points'] ?? false);
            if ($usePoints && ! $request->user()) {
                throw ValidationException::withMessages(['use_points' => 'Đăng nhập để sử dụng điểm thành viên.']);
            }
            if ($usePoints) {
                DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
            }

            $quote = $this->quote(
                $items,
                $data['shipping_address']['province_code'] ?? '',
                $data['coupon_code'] ?? null,
                $request->user()?->id,
                true,
                $pricingAt,
                isset($data['shipping_method_id']) ? (int) $data['shipping_method_id'] : null,
                $data['shipping_address']['ward_code'] ?? null,
                $usePoints,
                $fulfillmentType,
                isset($data['pickup_location_id']) ? (int) $data['pickup_location_id'] : null,
            );
            $pickupSnapshot = $pickupLocation ? [
                'id' => (int) $pickupLocation->id,
                'name' => $pickupLocation->name,
                'address' => $pickupLocation->address,
                'province_name' => $pickupLocation->province_name,
                'ward_name' => $pickupLocation->ward_name,
                'phone' => $pickupLocation->phone,
                'email' => $pickupLocation->email,
                'opening_hours' => $pickupLocation->opening_hours,
            ] : null;
            $code = 'FS'.now()->format('ymd').'-'.Str::upper(Str::random(6));
            $paymentInstructions = $paymentMethod === 'bank_transfer' ? [
                'bin' => (string) $bankSettings['payment_bank_bin'],
                'name' => (string) $bankSettings['payment_bank_name'],
                'account' => (string) $bankSettings['payment_bank_account'],
                'holder' => (string) $bankSettings['payment_bank_holder'],
                'note' => (string) ($bankSettings['payment_bank_note'] ?? ''),
                'transfer_content' => Str::upper(Str::replaceMatches('/[^A-Z0-9]/', '', $code)),
            ] : null;
            $now = now();
            $orderId = DB::table('orders')->insertGetId([
                'code' => $code,
                'idempotency_key' => $key,
                'idempotency_scope' => $idempotencyScope,
                'user_id' => $request->user()?->id,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => json_encode($data['shipping_address'], JSON_THROW_ON_ERROR),
                'fulfillment_type' => $fulfillmentType,
                'pickup_location_id' => $pickupLocation?->id,
                'pickup_location_snapshot' => $pickupSnapshot === null ? null : json_encode($pickupSnapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'subtotal' => $quote['subtotal'],
                'discount_total' => $quote['discount_total'],
                'membership_points_used' => $quote['membership_points_used'],
                'membership_discount_total' => $quote['membership_discount_total'],
                'shipping_fee' => $quote['shipping_fee'],
                'shipping_method_id' => $quote['shipping_method_id'],
                'shipping_method_name' => $quote['shipping_method']['name'] ?? null,
                'shipping_method_est_days' => $quote['shipping_method']['est_days'] ?? null,
                'grand_total' => $quote['grand_total'],
                'coupon_id' => $quote['coupon_id'],
                'coupon_code' => $quote['coupon_code'],
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $paymentMethod,
                'payment_instructions' => $paymentInstructions === null ? null : json_encode($paymentInstructions, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'note' => $data['note'] ?? null,
                'invoice_requested' => (bool) ($data['invoice_requested'] ?? false),
                'invoice_tax_code' => ($data['invoice_requested'] ?? false) ? $data['invoice_tax_code'] : null,
                'invoice_company_name' => ($data['invoice_requested'] ?? false) ? $data['invoice_company_name'] : null,
                'invoice_address' => ($data['invoice_requested'] ?? false) ? $data['invoice_address'] : null,
                'placed_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($quote['membership_points_used'] > 0) {
                $redeemPoints->redeemForOrder((int) $request->user()->id, (int) $orderId, $code, (int) $quote['membership_points_used']);
            }

            foreach ($items as $item) {
                $variant = $lockedVariants->get($item->variant_id);
                $product = $variant->product;
                $unitPrice = $variant->effectivePrice($product, $pricingAt);
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_name' => trim(($variant->color?->value ?? '').' '.($variant->size?->value ?? '')) ?: null,
                    'sku' => $variant->sku,
                    'image' => $product->images->first()?->url,
                    'unit_price' => $unitPrice,
                    'quantity' => $item->quantity,
                    'line_total' => $unitPrice * $item->quantity,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($fulfillmentType === 'pickup') {
                    $inventoryService->reservePickup((int) $pickupLocation->id, (int) $variant->id, (int) $item->quantity, (int) $orderId, 'Giữ đơn nhận tại cửa hàng '.$code, $request->user()?->id);
                } else {
                    $inventory = $variant->inventory;
                    if (! $inventory) {
                        throw ValidationException::withMessages(['cart' => 'Tồn kho của một sản phẩm chưa được khởi tạo.']);
                    }
                    $inventoryService->reserveForOrder((int) $variant->id, (int) $item->quantity, (int) $orderId, 'Reserve order '.$code, $request->user()?->id);
                }
            }

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'method' => $paymentMethod,
                'amount' => $quote['grand_total'],
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('order_status_histories')->insert([
                'order_id' => $orderId,
                'from_status' => null,
                'to_status' => 'pending',
                'note' => 'Đơn hàng được tạo',
                'changed_by' => $request->user()?->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($quote['coupon_id']) {
                DB::table('coupon_usages')->insert([
                    'coupon_id' => $quote['coupon_id'],
                    'user_id' => $request->user()?->id,
                    'order_id' => $orderId,
                    'discount' => $quote['coupon_discount_total'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                DB::table('coupons')->where('id', $quote['coupon_id'])->increment('used_count');
            }

            $lockedCart->items()->delete();
            $lockedCart->clearRecoveryContact();

            return ['id' => (int) $orderId, 'created' => true];
        });

        $orderId = $result['id'];
        $order = DB::table('orders')->where('id', $orderId)->first();
        if ($result['created']) {
            StoreOrderNotifier::orderPlaced($order);
        }

        return response()->json(['data' => $this->orderPayload($order)], $result['created'] ? 201 : 200);
    }

    private function idempotencyScope(Request $request): string
    {
        $scope = $request->user()
            ? 'user:'.$request->user()->getAuthIdentifier()
            : 'guest:'.(string) $request->header('X-Cart-Token');

        return hash('sha256', $scope);
    }

    private function cart(Request $request): Cart
    {
        if ($request->user()) {
            $cart = Cart::query()->firstOrCreate(['user_id' => $request->user()->id], ['expires_at' => now()->addDays(30)]);
        } else {
            $token = $request->header('X-Cart-Token');
            if (! $token) {
                throw ValidationException::withMessages(['cart' => 'Thiếu mã giỏ hàng.']);
            }

            $cart = Cart::query()->where('session_token', $token)->firstOrFail();
        }

        if ($cart->expires_at?->isPast()) {
            throw ValidationException::withMessages(['cart' => 'Giỏ hàng đã hết hạn. Hãy quay lại giỏ hàng để kiểm tra sản phẩm trước khi thanh toán.']);
        }

        return $cart;
    }

    private function quote(Collection $items, string $provinceCode, ?string $couponCode, ?int $userId, bool $lockCoupon = false, ?CarbonInterface $pricingAt = null, ?int $shippingMethodId = null, ?string $wardCode = null, bool $usePoints = false, string $fulfillmentType = 'delivery', ?int $pickupLocationId = null): array
    {
        $pricingAt ??= now();
        if ($fulfillmentType === 'pickup' && (! $pickupLocationId || ! DB::table('store_locations')->where('id', $pickupLocationId)->where('is_active', true)->exists())) {
            throw ValidationException::withMessages(['pickup_location_id' => 'Cửa hàng nhận hàng không còn hoạt động. Hãy chọn địa điểm khác.']);
        }
        $subtotal = 0;
        foreach ($items as $item) {
            $variant = $item->variant;
            if (! $variant || ! $variant->is_active || $variant->product?->status !== 'active') {
                throw ValidationException::withMessages(['cart' => 'Một sản phẩm trong giỏ không còn được bán.']);
            }
            $inventory = $fulfillmentType === 'pickup' && $pickupLocationId
                ? DB::table('store_location_inventories')->where('store_location_id', $pickupLocationId)->where('variant_id', $variant->id)->first()
                : $variant->inventory;
            $available = max(0, ($inventory?->quantity ?? 0) - ($inventory?->reserved ?? 0));
            if ($item->quantity > $available) {
                throw ValidationException::withMessages([$fulfillmentType === 'pickup' ? 'pickup_location_id' : 'cart' => $fulfillmentType === 'pickup' ? 'Cửa hàng này không còn đủ hàng trong giỏ. Hãy chọn cửa hàng khác.' : 'Số lượng tồn kho đã thay đổi. Vui lòng cập nhật giỏ hàng.']);
            }
            $subtotal += $variant->effectivePrice($variant->product, $pricingAt) * $item->quantity;
        }

        $rate = DB::table('shipping_rates')->where('province_code', $provinceCode)->where('is_active', true)->first();
        $provinceShippingFee = (int) ($rate?->fee ?? $this->storeSetting('default_shipping_fee'));
        $threshold = $rate?->free_shipping_threshold ?? $this->storeSetting('free_shipping_threshold');

        $shippingMethod = null;
        if ($fulfillmentType === 'delivery' && $shippingMethodId !== null) {
            $shippingMethodQuery = app(AvailableShippingMethods::class)->forDestination($provinceCode, $wardCode)->where('id', $shippingMethodId);
            if ($lockCoupon) {
                $shippingMethodQuery->lockForUpdate();
            }
            $shippingMethod = $shippingMethodQuery->first();
        }
        if ($fulfillmentType === 'delivery' && $shippingMethodId !== null && ! $shippingMethod) {
            throw ValidationException::withMessages(['shipping_method_id' => 'Phương thức giao hàng không còn khả dụng. Vui lòng chọn lại.']);
        }
        $activeShippingMethods = $fulfillmentType === 'delivery'
            ? app(AvailableShippingMethods::class)->forDestination($provinceCode, $wardCode)->orderBy('fee')->orderBy('name')->get(['id', 'name', 'fee', 'est_days'])
            : collect();
        $freeShippingReached = $threshold !== null && $subtotal >= (int) $threshold;
        $shippingFee = $fulfillmentType === 'pickup' ? 0 : ($shippingMethod ? (int) $shippingMethod->fee : $provinceShippingFee);
        if ($freeShippingReached) {
            $shippingFee = 0;
        }

        $discount = 0;
        $couponId = null;
        $couponApplied = null;
        $coupon = null;
        if ($couponCode) {
            $couponQuery = Coupon::query()->where('code', Str::upper(trim($couponCode)))->where('is_active', true);
            if ($lockCoupon) {
                $couponQuery->lockForUpdate();
            }
            $coupon = $couponQuery->first();
            $couponEndsAt = $coupon?->ends_at ?? $coupon?->expires_at;
            if (! $coupon || ($coupon->starts_at && $coupon->starts_at->isFuture()) || ($couponEndsAt && $couponEndsAt->isPast())) {
                throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn.']);
            }
            if ($subtotal < $coupon->min_order_value || ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit)) {
                throw ValidationException::withMessages(['coupon_code' => 'Đơn hàng chưa đáp ứng điều kiện của mã giảm giá.']);
            }
            if ($userId && $coupon->usage_per_user !== null) {
                $usedByUser = DB::table('coupon_usages')->where('coupon_id', $coupon->id)->where('user_id', $userId)->count();
                if ($usedByUser >= $coupon->usage_per_user) {
                    throw ValidationException::withMessages(['coupon_code' => 'Bạn đã sử dụng hết lượt của mã này.']);
                }
            }
            $couponId = $coupon->id;
            $couponApplied = $coupon->code;
            if ($coupon->type === 'percent') {
                $discount = (int) floor($subtotal * $coupon->value / 100);
                if ($coupon->max_discount !== null) {
                    $discount = min($discount, $coupon->max_discount);
                }
            } elseif ($coupon->type === 'fixed') {
                $discount = min($subtotal, $coupon->value);
            } elseif ($coupon->type === 'free_ship') {
                $shippingFee = 0;
            }
        }

        $shippingMethods = collect([[
            'id' => null,
            'name' => 'Giao hàng theo tỉnh/thành',
            'fee' => $freeShippingReached || ($coupon?->type === 'free_ship') ? 0 : $provinceShippingFee,
            'est_days' => null,
        ]])->concat($activeShippingMethods->map(fn (object $method): array => [
            'id' => (int) $method->id,
            'name' => (string) $method->name,
            'fee' => $freeShippingReached || ($coupon?->type === 'free_ship') ? 0 : (int) $method->fee,
            'est_days' => $method->est_days === null ? null : (string) $method->est_days,
        ]))->values();
        if ($fulfillmentType === 'pickup') {
            $shippingMethods = collect();
        }

        $couponDiscount = min($discount, $subtotal);
        $pointsBalance = 0;
        $pointsUsed = 0;
        $pointsDiscount = 0;
        if ($userId !== null) {
            $redemption = app(RedeemMembershipPointsAction::class)->preview($userId, max(0, $subtotal - $couponDiscount));
            $pointsBalance = $redemption['available_points'];
            if ($usePoints) {
                $pointsUsed = $redemption['points_used'];
                $pointsDiscount = $redemption['discount_vnd'];
            }
        }
        $discount = $couponDiscount + $pointsDiscount;

        return [
            'fulfillment_type' => $fulfillmentType,
            'pickup_location_id' => $pickupLocationId,
            'shipping_method_id' => $shippingMethod ? (int) $shippingMethod->id : null,
            'items' => $items->map(fn ($item): array => [
                'variant_id' => $item->variant_id,
                'sku' => $item->variant->sku,
                'quantity' => $item->quantity,
                'unit_price' => $item->variant->effectivePrice($item->variant->product, $pricingAt),
                'line_total' => $item->variant->effectivePrice($item->variant->product, $pricingAt) * $item->quantity,
            ])->values(),
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'coupon_discount_total' => $couponDiscount,
            'membership_points_balance' => $pointsBalance,
            'membership_points_used' => $pointsUsed,
            'membership_discount_total' => $pointsDiscount,
            'shipping_fee' => $shippingFee,
            'shipping_method' => $shippingMethod ? [
                'id' => (int) $shippingMethod->id,
                'name' => (string) $shippingMethod->name,
                'est_days' => $shippingMethod->est_days === null ? null : (string) $shippingMethod->est_days,
            ] : null,
            'shipping_methods' => $shippingMethods,
            'grand_total' => max(0, $subtotal - $discount + $shippingFee),
            'coupon_id' => $couponId,
            'coupon_code' => $couponApplied,
        ];
    }

    private function assertProvinceCode(string $provinceCode, string $field): void
    {
        if (! app(VietnamAddressCatalog::class)->province($provinceCode)) {
            throw ValidationException::withMessages([$field => 'Vui lòng chọn tỉnh/thành phố hợp lệ.']);
        }
    }

    private function assertWardCode(string $provinceCode, string $wardCode, string $field): void
    {
        if (! app(VietnamAddressCatalog::class)->ward($provinceCode, $wardCode)) {
            throw ValidationException::withMessages([$field => 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.']);
        }
    }

    private function storeSetting(string $key): int
    {
        return (int) (DB::table('settings')->where('key', $key)->value('value') ?? config('store.'.$key));
    }

    private function orderPayload(object $order): array
    {
        $items = DB::table('order_items')
            ->where('order_id', $order->id)
            ->orderBy('id')
            ->get(['product_name', 'variant_name', 'image', 'quantity', 'unit_price', 'line_total'])
            ->map(fn (object $item): array => [
                'product_name' => (string) $item->product_name,
                'variant_name' => $item->variant_name === null ? null : (string) $item->variant_name,
                'image' => $item->image === null ? null : (string) $item->image,
                'quantity' => (int) $item->quantity,
                'unit_price' => (int) $item->unit_price,
                'line_total' => (int) $item->line_total,
            ])
            ->all();

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

        return [
            'code' => $order->code,
            'status' => $order->status,
            'fulfillment_type' => $order->fulfillment_type ?? 'delivery',
            'pickup_location' => isset($order->pickup_location_snapshot) && $order->pickup_location_snapshot !== null ? json_decode($order->pickup_location_snapshot, true) : null,
            'payment_method' => (string) $order->payment_method,
            'invoice_requested' => (bool) ($order->invoice_requested ?? false),
            'payment_access_token' => $order->payment_method === 'bank_transfer' && $order->payment_status === 'unpaid'
                ? app(StorefrontPaymentConfiguration::class)->paymentToken((string) $order->code)
                : null,
            'shipping_method' => $shippingMethod,
            'payment_status' => $order->payment_status,
            'subtotal' => (int) $order->subtotal,
            'discount_total' => (int) $order->discount_total,
            'membership_points_used' => (int) ($order->membership_points_used ?? 0),
            'membership_discount_total' => (int) ($order->membership_discount_total ?? 0),
            'shipping_fee' => (int) $order->shipping_fee,
            'grand_total' => (int) $order->grand_total,
            'placed_at' => $order->placed_at,
            'items' => $items,
        ];
    }
}
