<?php

namespace App\Modules\Identity\Actions;

use App\Models\Product;
use App\Models\User;
use App\Models\WishlistList;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManageWishlistListAction
{
    public function create(User $user, string $name): WishlistList
    {
        return DB::transaction(function () use ($user, $name): WishlistList {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            if (! $user->wishlistLists()->where('is_default', true)->exists()) {
                $user->wishlistLists()->create(['name' => 'Yêu thích', 'is_default' => true]);
            }

            return $user->wishlistLists()->create(['name' => trim($name), 'is_default' => false]);
        });
    }

    public function rename(User $user, int $listId, string $name): WishlistList
    {
        $list = $this->ownedList($user, $listId);
        $list->update(['name' => trim($name)]);

        return $list->refresh();
    }

    public function delete(User $user, int $listId): void
    {
        DB::transaction(function () use ($user, $listId): void {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $list = $this->ownedList($user, $listId);

            if ($list->is_default) {
                $replacement = $user->wishlistLists()->where('id', '<>', $list->id)->orderBy('id')->lockForUpdate()->first();
                if ($replacement) {
                    $replacement->update(['is_default' => true]);
                } else {
                    $user->wishlistLists()->create(['name' => 'Yêu thích', 'is_default' => true]);
                }
            }

            $list->delete();
        });
    }

    public function addProduct(User $user, int $listId, int $productId): void
    {
        $list = $this->ownedList($user, $listId);
        $product = Product::query()->published()->findOrFail($productId);

        DB::table('wishlists')->insertOrIgnore([
            'user_id' => $user->id,
            'wishlist_list_id' => $list->id,
            'product_id' => $product->id,
            'created_at' => now(),
        ]);
    }

    public function removeProduct(User $user, int $listId, int $productId): void
    {
        $list = $this->ownedList($user, $listId);
        DB::table('wishlists')->where('wishlist_list_id', $list->id)->where('product_id', $productId)->delete();
    }

    public function setShareable(User $user, int $listId, bool $shareable): WishlistList
    {
        $list = $this->ownedList($user, $listId);
        $list->update(['share_token' => $shareable ? ($list->share_token ?: Str::random(48)) : null]);

        return $list->refresh();
    }

    private function ownedList(User $user, int $listId): WishlistList
    {
        return $user->wishlistLists()->whereKey($listId)->firstOrFail();
    }
}
