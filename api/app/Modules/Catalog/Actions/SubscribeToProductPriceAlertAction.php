<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Product;
use App\Models\ProductPriceAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscribeToProductPriceAlertAction
{
    public function execute(int $userId, int $productId): ProductPriceAlert
    {
        return DB::transaction(function () use ($userId, $productId): ProductPriceAlert {
            $product = Product::query()->published()->with(['variants' => fn ($query) => $query->where('is_active', true)])->findOrFail($productId);
            $pricingAt = now();
            $referencePrice = $product->variants->map(fn ($variant): int => $variant->effectivePrice($product, $pricingAt))->min();

            if ($referencePrice === null) {
                throw ValidationException::withMessages(['product' => 'Sản phẩm hiện chưa có biến thể đang bán để theo dõi giá.']);
            }

            $alert = ProductPriceAlert::query()->where('user_id', $userId)->where('product_id', $product->id)->lockForUpdate()->first();
            if (! $alert) {
                $alert = new ProductPriceAlert(['user_id' => $userId, 'product_id' => $product->id]);
            }

            $alert->forceFill([
                'reference_price' => $referencePrice,
                'is_active' => true,
                'notified_at' => null,
            ])->save();

            return $alert->refresh();
        });
    }
}
