<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\AddCartItemRequest;
use App\Http\Requests\Api\V1\Storefront\MergeGuestCartRequest;
use App\Http\Requests\Api\V1\Storefront\StoreCartRecoveryContactRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Modules\Cart\Actions\MergeGuestCartAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $cart = $this->cart($request);
        $cart->load([
            'items.variant.product.images',
            'items.variant.product.variants.color',
            'items.variant.product.variants.size',
            'items.variant.product.variants.inventory',
            'items.variant.color',
            'items.variant.size',
            'items.variant.inventory',
        ]);

        return response()->json(['data' => $this->present($cart, (bool) $request->attributes->get('cart_was_expired', false))]);
    }

    public function add(AddCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $cart = $this->cart($request);

        DB::transaction(function () use ($cart, $data): void {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $variant = ProductVariant::query()->whereKey($data['variant_id'])->where('is_active', true)->whereHas('product', fn ($query) => $query->where('status', 'active'))->with('product')->lockForUpdate()->first();
            if (! $variant) {
                throw ValidationException::withMessages(['variant_id' => 'Sản phẩm này hiện không còn được bán.']);
            }

            $inventory = Inventory::query()->where('variant_id', $variant->id)->lockForUpdate()->first();
            $available = max(0, ($inventory?->quantity ?? 0) - ($inventory?->reserved ?? 0));
            $item = CartItem::query()->where('cart_id', $cart->id)->where('variant_id', $variant->id)->lockForUpdate()->first();
            $quantity = ($item?->quantity ?? 0) + $data['quantity'];

            if ($quantity > 20) {
                throw ValidationException::withMessages(['quantity' => 'Mỗi biến thể chỉ được thêm tối đa 20 sản phẩm vào giỏ.']);
            }

            if ($quantity > $available) {
                throw ValidationException::withMessages(['quantity' => 'Số lượng sản phẩm trong kho không đủ.']);
            }

            CartItem::query()->updateOrCreate(
                ['cart_id' => $cart->id, 'variant_id' => $variant->id],
                ['quantity' => $quantity, 'unit_price_snapshot' => $variant->effectivePrice()],
            );
            $cart->recordActivity();
        });

        return $this->show($request)->setStatusCode(201);
    }

    public function update(UpdateCartItemRequest $request, int $item): JsonResponse
    {
        $data = $request->validated();
        $cart = $this->cart($request);
        DB::transaction(function () use ($cart, $item, $data): void {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $cartItem = $cart->items()->whereKey($item)->lockForUpdate()->firstOrFail();
            $originalVariant = ProductVariant::query()->whereKey($cartItem->variant_id)->lockForUpdate()->first();
            if (! $originalVariant) {
                throw ValidationException::withMessages(['variant_id' => 'Biến thể hiện tại trong giỏ không còn tồn tại.']);
            }

            $variant = ProductVariant::query()
                ->whereKey($data['variant_id'] ?? $cartItem->variant_id)
                ->where('product_id', $originalVariant->product_id)
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->where('status', 'active'))
                ->with('product')
                ->lockForUpdate()
                ->first();

            if (! $variant) {
                throw ValidationException::withMessages(['quantity' => 'Sản phẩm này hiện không còn được bán.']);
            }

            $inventory = Inventory::query()->where('variant_id', $variant->id)->lockForUpdate()->first();
            $available = max(0, ($inventory?->quantity ?? 0) - ($inventory?->reserved ?? 0));
            $existingTarget = $variant->id === $cartItem->variant_id
                ? null
                : $cart->items()->where('variant_id', $variant->id)->where('id', '<>', $cartItem->id)->lockForUpdate()->first();
            $quantity = $data['quantity'] + ($existingTarget?->quantity ?? 0);

            if ($quantity > 20) {
                throw ValidationException::withMessages(['quantity' => 'Mỗi biến thể chỉ được có tối đa 20 sản phẩm trong giỏ.']);
            }

            if ($quantity > $available) {
                throw ValidationException::withMessages(['quantity' => 'Số lượng sản phẩm trong kho không đủ.']);
            }

            if ($existingTarget) {
                $existingTarget->update(['quantity' => $quantity, 'unit_price_snapshot' => $variant->effectivePrice($variant->product)]);
                $cartItem->delete();
            } else {
                $cartItem->update([
                    'variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'unit_price_snapshot' => $variant->effectivePrice($variant->product),
                ]);
            }
            $cart->recordActivity();
        });

        return $this->show($request);
    }

    public function remove(Request $request, int $item): JsonResponse
    {
        $cart = $this->cart($request);
        DB::transaction(function () use ($cart, $item): void {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $cart->items()->whereKey($item)->lockForUpdate()->firstOrFail()->delete();
            $cart->recordActivity();
            if (! $cart->items()->exists()) {
                $cart->clearRecoveryContact();
            }
        });

        return $this->show($request);
    }

    public function saveRecoveryContact(StoreCartRecoveryContactRequest $request): JsonResponse
    {
        $cart = $this->cart($request);
        $data = $request->validated();
        DB::transaction(function () use ($cart, $data): void {
            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            if ($lockedCart->user_id !== null) {
                abort(403);
            }
            if (! $lockedCart->items()->exists()) {
                throw ValidationException::withMessages(['email' => 'Hãy thêm sản phẩm vào giỏ trước khi bật nhắc nhở.']);
            }

            $lockedCart->forceFill([
                'recovery_email' => $data['email'],
                'recovery_consent_at' => now(),
            ])->save();
            $lockedCart->recordActivity();
        });

        return $this->show($request);
    }

    public function removeRecoveryContact(Request $request): JsonResponse
    {
        abort_if($request->user() !== null, 403);
        $cart = $this->cart($request);
        DB::transaction(function () use ($cart): void {
            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $lockedCart->clearRecoveryContact();
        });

        return $this->show($request);
    }

    public function merge(MergeGuestCartRequest $request, MergeGuestCartAction $mergeGuestCart): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Cần đăng nhập để gộp giỏ hàng.'], 401);
        }

        $guestCart = Cart::query()->where('session_token', $data['session_token'])->first();
        $userCart = $this->cart($request);

        if ($guestCart && $guestCart->id !== $userCart->id) {
            $wasExpired = $mergeGuestCart->handle($guestCart, $userCart);
            if ($wasExpired) {
                $request->attributes->set('cart_was_expired', true);
            }
        }

        return $this->show($request);
    }

    private function cart(Request $request): Cart
    {
        if ($request->user()) {
            $cart = Cart::query()->firstOrCreate(['user_id' => $request->user()->id], ['expires_at' => now()->addDays(30)]);
            $expirationDays = 30;
        } else {
            $token = $request->header('X-Cart-Token');
            if (! $token || strlen($token) > 120) {
                $token = (string) Str::uuid();
            }

            $cart = Cart::query()->firstOrCreate(['session_token' => $token], ['expires_at' => now()->addDays(14)]);
            $request->attributes->set('cart_token', $token);
            $expirationDays = 14;
        }

        $wasExpired = (bool) $request->attributes->get('cart_was_expired', false);
        if ($cart->expires_at?->isPast()) {
            DB::transaction(function () use ($cart, $expirationDays, &$wasExpired): void {
                $lockedCart = Cart::query()->lockForUpdate()->find($cart->id);
                if (! $lockedCart?->expires_at?->isPast()) {
                    return;
                }

                $lockedCart->items()->delete();
                $lockedCart->forceFill([
                    'expires_at' => now()->addDays($expirationDays),
                    'recovery_email' => null,
                    'recovery_consent_at' => null,
                ])->save();
                $wasExpired = true;
            });
        }

        if ($wasExpired) {
            $cart->refresh();
        }

        $request->attributes->set('cart_was_expired', $wasExpired);

        return $cart;
    }

    private function present(Cart $cart, bool $wasExpired = false): array
    {
        $pricingAt = now();

        return [
            'id' => $cart->id,
            'session_token' => $cart->session_token,
            'recovery_email' => $cart->user_id === null ? $cart->recovery_email : null,
            'was_expired' => $wasExpired,
            'items' => $cart->items->map(fn (CartItem $item): array => [
                'id' => $item->id,
                'variant_id' => $item->variant_id,
                'quantity' => $item->quantity,
                'unit_price' => $item->variant?->effectivePrice($item->variant?->product, $pricingAt) ?? $item->unit_price_snapshot,
                'available_quantity' => max(0, ($item->variant?->inventory?->quantity ?? 0) - ($item->variant?->inventory?->reserved ?? 0)),
                'product' => [
                    'id' => $item->variant?->product?->id,
                    'name' => $item->variant?->product?->name,
                    'slug' => $item->variant?->product?->slug,
                    'image' => $item->variant?->product?->images?->first()?->url,
                    'image_alt' => $item->variant?->product?->images?->first()?->alt,
                    'sku' => $item->variant?->sku,
                    'size' => $item->variant?->size?->value,
                    'color' => $item->variant?->color?->value,
                    'variants' => $item->variant?->product?->variants
                        ?->filter(fn (ProductVariant $variant): bool => $variant->is_active)
                        ->map(fn (ProductVariant $variant): array => [
                            'id' => (int) $variant->id,
                            'sku' => $variant->sku,
                            'size' => $variant->size?->value,
                            'color' => $variant->color?->value,
                            'unit_price' => $variant->effectivePrice($item->variant?->product, $pricingAt),
                            'available_quantity' => max(0, ($variant->inventory?->quantity ?? 0) - ($variant->inventory?->reserved ?? 0)),
                        ])->values() ?? [],
                ],
                'line_total' => ($item->variant?->effectivePrice($item->variant?->product, $pricingAt) ?? $item->unit_price_snapshot) * $item->quantity,
            ]),
        ];
    }
}
