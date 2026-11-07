<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->resource;
        $variants = $this->relationLoaded('variants') ? $this->variants : null;
        $pricingAt = now();
        $price = $variants?->map(fn ($variant): int => $variant->effectivePrice($product, $pricingAt))->min()
            ?? (int) $product->base_price;
        $activeSaleVariants = $variants?->filter(fn ($variant): bool => $variant->effectivePrice($product, $pricingAt) === $price
            && $variant->hasActiveSalePrice($product, $pricingAt)) ?? collect();

        return [
            'id' => (int) $product->id,
            'name' => (string) $product->name,
            'slug' => (string) $product->slug,
            'short_description' => $product->short_description,
            'price' => $price,
            'compare_at_price' => $activeSaleVariants->isEmpty() ? null : (int) $activeSaleVariants->min('compare_at_price'),
            'images' => $this->whenLoaded('images', fn () => $this->images->where('is_360_frame', false)->map(fn ($image): array => [
                'url' => $image->url,
                'alt' => $image->alt,
                'color_value_id' => $image->color_value_id,
                'sort_order' => $image->sort_order,
                'primary' => $image->is_primary,
                'is_360_frame' => (bool) $image->is_360_frame,
            ])->values()),
            'variants' => $this->whenLoaded('variants', fn () => $variants->map(function ($variant) use ($product, $pricingAt): array {
                $availableQuantity = max(0, ($variant->inventory?->quantity ?? 0) - ($variant->inventory?->reserved ?? 0));
                $lowStockThreshold = (int) ($variant->inventory?->low_stock_threshold ?? 0);

                return [
                    'id' => (int) $variant->id,
                    'sku' => (string) $variant->sku,
                    'price' => $variant->effectivePrice($product, $pricingAt),
                    'compare_at_price' => $variant->hasActiveSalePrice($product, $pricingAt) ? (int) $variant->compare_at_price : null,
                    'color' => $variant->color?->value,
                    'color_hex' => $variant->color?->color_hex,
                    'color_value_id' => $variant->color_value_id,
                    'size' => $variant->size?->value,
                    'available_quantity' => $availableQuantity,
                    'is_low_stock' => $availableQuantity > 0 && $availableQuantity <= $lowStockThreshold,
                ];
            })->values()),
        ];
    }
}
