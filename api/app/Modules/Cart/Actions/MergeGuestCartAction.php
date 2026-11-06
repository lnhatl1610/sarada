<?php

namespace App\Modules\Cart\Actions;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class MergeGuestCartAction
{
    /** Returns true when the guest cart had expired and was discarded. */
    public function handle(Cart $guestCart, Cart $userCart): bool
    {
        if ($guestCart->is($userCart)) {
            return false;
        }

        return DB::transaction(function () use ($guestCart, $userCart): bool {
            $lockedCarts = Cart::query()
                ->whereIn('id', [$guestCart->id, $userCart->id])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $lockedGuestCart = $lockedCarts->get($guestCart->id);
            $lockedUserCart = $lockedCarts->get($userCart->id);

            if (! $lockedGuestCart || ! $lockedUserCart) {
                return false;
            }

            if ($lockedGuestCart->expires_at?->isPast()) {
                $lockedGuestCart->delete();

                return true;
            }

            $guestItems = CartItem::query()
                ->where('cart_id', $lockedGuestCart->id)
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get();
            $userItems = CartItem::query()
                ->where('cart_id', $lockedUserCart->id)
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get();
            $variantIds = $guestItems->pluck('variant_id')
                ->merge($userItems->pluck('variant_id'))
                ->unique()
                ->sort()
                ->values();

            $variants = ProductVariant::query()
                ->whereIn('id', $variantIds)
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->where('status', 'active'))
                ->with('product')
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $inventories = Inventory::query()
                ->whereIn('variant_id', $variants->keys())
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get()
                ->keyBy('variant_id');
            $userItemsByVariant = $userItems->keyBy('variant_id');

            foreach ($userItems as $userItem) {
                $variant = $variants->get($userItem->variant_id);
                $inventory = $inventories->get($userItem->variant_id);
                $available = max(0, ($inventory?->quantity ?? 0) - ($inventory?->reserved ?? 0));

                if (! $variant || $available === 0 || $userItem->quantity < 1) {
                    $userItem->delete();
                    $userItemsByVariant->forget($userItem->variant_id);

                    continue;
                }

                $quantity = min(20, $available, $userItem->quantity);
                if ($quantity !== $userItem->quantity) {
                    $userItem->update(['quantity' => $quantity]);
                }
            }

            foreach ($guestItems as $guestItem) {
                $variant = $variants->get($guestItem->variant_id);
                $inventory = $inventories->get($guestItem->variant_id);
                if (! $variant || ! $inventory || $guestItem->quantity < 1) {
                    continue;
                }

                $available = max(0, $inventory->quantity - $inventory->reserved);
                if ($available === 0) {
                    continue;
                }

                $userItem = $userItemsByVariant->get($guestItem->variant_id);
                $quantity = min(20, $available, ($userItem?->quantity ?? 0) + $guestItem->quantity);
                $values = [
                    'quantity' => $quantity,
                    'unit_price_snapshot' => $variant->effectivePrice($variant->product),
                ];

                if ($userItem) {
                    $userItem->update($values);
                } else {
                    $userItem = CartItem::query()->create([
                        'cart_id' => $lockedUserCart->id,
                        'variant_id' => $variant->id,
                        ...$values,
                    ]);
                    $userItemsByVariant->put($variant->id, $userItem);
                }
            }

            if ($guestItems->isNotEmpty()) {
                $lockedUserCart->recordActivity();
            }

            $lockedGuestCart->delete();

            return false;
        });
    }
}
