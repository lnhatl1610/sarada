<?php

namespace App\Modules\Identity\Actions;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SyncRecentlyViewedProductsAction
{
    /** @param list<string> $slugs
     * @return list<string>
     */
    public function execute(User $user, array $slugs): array
    {
        $slugs = array_slice(array_values(array_unique($slugs)), 0, 12);
        $productIds = Product::query()
            ->published()
            ->whereIn('slug', $slugs)
            ->pluck('id', 'slug');

        $now = now();
        $rows = [];
        $savedSlugs = [];
        foreach ($slugs as $index => $slug) {
            $productId = $productIds->get($slug);
            if ($productId === null) {
                continue;
            }

            $rows[] = [
                'user_id' => $user->id,
                'product_id' => $productId,
                'viewed_at' => $now->copy()->subSeconds($index)->toDateTimeString(),
            ];
            $savedSlugs[] = $slug;
        }

        DB::transaction(function () use ($user, $rows): void {
            DB::table('recently_viewed_products')->where('user_id', $user->id)->delete();
            if ($rows !== []) {
                DB::table('recently_viewed_products')->insert($rows);
            }
        });

        return $savedSlugs;
    }
}
