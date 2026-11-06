<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class GetPersonalizedProductRecommendationsAction
{
    /** @return list<int> */
    public function execute(User $user, int $limit = 12): array
    {
        $views = DB::table('recently_viewed_products')
            ->join('products', 'products.id', '=', 'recently_viewed_products.product_id')
            ->where('recently_viewed_products.user_id', $user->id)
            ->where('products.status', 'active')
            ->orderByDesc('recently_viewed_products.viewed_at')
            ->limit(12)
            ->get(['products.id', 'products.category_id', 'products.brand_id']);

        $purchases = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.user_id', $user->id)
            ->where('orders.payment_status', 'paid')
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->where('products.status', 'active')
            ->orderByDesc('orders.placed_at')
            ->orderByDesc('order_items.id')
            ->limit(24)
            ->get(['products.id', 'products.category_id', 'products.brand_id']);

        $sourceIds = [];
        $categoryWeights = [];
        $brandWeights = [];
        foreach ($purchases as $product) {
            $sourceIds[] = (int) $product->id;
            $this->addWeight($categoryWeights, $product->category_id, 5);
            $this->addWeight($brandWeights, $product->brand_id, 3);
        }
        foreach ($views as $index => $product) {
            $sourceIds[] = (int) $product->id;
            $weight = max(1, 6 - $index);
            $this->addWeight($categoryWeights, $product->category_id, $weight);
            $this->addWeight($brandWeights, $product->brand_id, max(1, (int) ceil($weight / 2)));
        }

        if ($sourceIds === [] || ($categoryWeights === [] && $brandWeights === [])) {
            return [];
        }

        arsort($categoryWeights);
        arsort($brandWeights);
        $categories = array_slice($categoryWeights, 0, 8, true);
        $brands = array_slice($brandWeights, 0, 8, true);
        $parts = [];
        $bindings = [];
        foreach ([['products.category_id', $categories], ['products.brand_id', $brands]] as [$column, $weights]) {
            if ($weights === []) {
                $parts[] = '0';

                continue;
            }

            $case = 'CASE '.$column;
            foreach ($weights as $id => $weight) {
                $case .= ' WHEN ? THEN ?';
                $bindings[] = (int) $id;
                $bindings[] = (int) $weight;
            }
            $parts[] = $case.' ELSE 0 END';
        }

        return DB::table('products')
            ->where('products.status', 'active')
            ->whereNotIn('products.id', array_values(array_unique($sourceIds)))
            ->where(function ($query) use ($categories, $brands): void {
                if ($categories !== []) {
                    $query->whereIn('products.category_id', array_keys($categories));
                }
                if ($brands !== []) {
                    $method = $categories === [] ? 'whereIn' : 'orWhereIn';
                    $query->{$method}('products.brand_id', array_keys($brands));
                }
            })
            ->whereExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('product_variants')
                    ->join('inventories', 'inventories.variant_id', '=', 'product_variants.id')
                    ->whereColumn('product_variants.product_id', 'products.id')
                    ->where('product_variants.is_active', true)
                    ->whereColumn('inventories.quantity', '>', 'inventories.reserved');
            })
            ->select('products.id')
            ->selectRaw(implode(' + ', $parts).' as personalization_score', $bindings)
            ->orderByDesc('personalization_score')
            ->orderByDesc('products.sold_count')
            ->orderByDesc('products.id')
            ->limit($limit)
            ->pluck('products.id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();
    }

    /** @param array<int, int> $weights */
    private function addWeight(array &$weights, mixed $id, int $weight): void
    {
        if ($id !== null) {
            $key = (int) $id;
            $weights[$key] = ($weights[$key] ?? 0) + $weight;
        }
    }
}
