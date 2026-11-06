<?php

namespace App\Actions\Catalog;

use App\Models\Product;

class SyncProductSalePrice
{
    public function handle(Product $product): void
    {
        $salePrice = $product->variants()
            ->where('is_active', true)
            ->whereNotNull('compare_at_price')
            ->whereColumn('compare_at_price', '>', 'price')
            ->min('price');

        $product->update(['sale_price' => $salePrice]);
    }
}
