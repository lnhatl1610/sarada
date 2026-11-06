<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variants = $this->relationLoaded('variants') ? $this->variants : null;
        $pricingAt = now();
        $product = $this->resource;
        $price = $variants?->map(fn ($variant): int => $variant->effectivePrice($product, $pricingAt))->min()
            ?? $this->variants_min_price
            ?? $this->base_price;
        $activeSaleVariants = $variants?->filter(fn ($variant): bool => $variant->effectivePrice($product, $pricingAt) === (int) $price
            && $variant->hasActiveSalePrice($product, $pricingAt)) ?? collect();
        $compareAtPrice = $variants !== null
            ? ($activeSaleVariants->isEmpty() ? null : (int) $activeSaleVariants->min('compare_at_price'))
            : ($this->active_sale_compare_at_price ?? ($this->sale_starts_at === null && $this->sale_ends_at === null ? $this->compare_at_price : null));

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'description' => $this->when($request->routeIs('products.show'), $this->description),
            'material' => $this->when($request->routeIs('products.show'), $this->material),
            'fit' => $this->when($request->routeIs('products.show'), $this->fit),
            'size_recommendations' => $this->when($request->routeIs('products.show') && $this->relationLoaded('sizeRecommendations'), fn () => $this->sizeRecommendations->map(fn ($item): array => [
                'size' => $item->size?->value,
                'height_min_cm' => (float) $item->height_min_cm,
                'height_max_cm' => (float) $item->height_max_cm,
                'weight_min_kg' => (float) $item->weight_min_kg,
                'weight_max_kg' => (float) $item->weight_max_kg,
            ])->values()),
            'care_instruction' => $this->when($request->routeIs('products.show'), $this->care_instruction),
            'price' => (int) $price,
            'compare_at_price' => $compareAtPrice,
            'sale_starts_at' => $this->sale_starts_at,
            'sale_ends_at' => $this->sale_ends_at,
            'rating' => [
                'average' => (float) $this->rating_avg,
                'count' => $this->rating_count,
                'distribution' => $this->when(isset($this->rating_distribution), fn () => collect(range(1, 5))
                    ->map(fn (int $stars): array => [
                        'stars' => $stars,
                        'count' => (int) data_get($this->rating_distribution, $stars, 0),
                    ])->values()),
            ],
            'review_samples' => $this->whenLoaded('approvedReviewSamples', fn () => $this->approvedReviewSamples->map(fn ($review): array => [
                'rating' => $review->rating,
                'title' => $review->title,
                'content' => $review->content,
                'created_at' => $review->created_at,
                'customer' => ['name' => $review->user?->name],
            ])->values()),
            'sold_count' => $this->sold_count,
            'featured' => $this->is_featured,
            'is_new' => $this->is_new,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ] : null),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'url' => $image->url,
                'srcset' => $this->demoProductImageSrcset($image->url),
                'alt' => $image->alt,
                'primary' => $image->is_primary,
                'sort_order' => $image->sort_order,
                'color_value_id' => $image->color_value_id,
                'is_360_frame' => $image->is_360_frame,
            ])),
            'videos' => $this->whenLoaded('videos', fn () => $this->videos->map(fn ($video) => [
                'id' => $video->id,
                'url' => $video->url,
                'caption' => $video->caption,
                'color_value_id' => $video->color_value_id,
                'sort_order' => $video->sort_order,
            ])->values()),
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(function ($variant) use ($product, $pricingAt): array {
                $availableQuantity = max(0, ($variant->inventory?->quantity ?? 0) - ($variant->inventory?->reserved ?? 0));
                $lowStockThreshold = (int) ($variant->inventory?->low_stock_threshold ?? 0);

                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'price' => $variant->effectivePrice($product, $pricingAt),
                    'compare_at_price' => $variant->hasActiveSalePrice($product, $pricingAt) ? $variant->compare_at_price : null,
                    'color' => $variant->color?->value,
                    'color_hex' => $variant->color?->color_hex,
                    'color_value_id' => $variant->color_value_id,
                    'size' => $variant->size?->value,
                    'available_quantity' => $availableQuantity,
                    'is_low_stock' => $availableQuantity > 0 && $availableQuantity <= $lowStockThreshold,
                ];
            })),
        ];
    }

    private function demoProductImageSrcset(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || ! preg_match('~^/demo-media/products/([^/]+)-photo\.webp$~', $path, $matches)) {
            return null;
        }

        $baseUrl = substr($url, 0, -strlen(basename($path)));
        $sources = [];
        foreach ([200, 360, 600, 640, 1200] as $width) {
            $filename = $matches[1].'-'.$width.'.webp';
            $candidate = public_path('demo-media/products/'.$filename);
            if (! is_file($candidate)) {
                continue;
            }

            $dimensions = getimagesize($candidate);
            $actualWidth = is_array($dimensions) ? (int) ($dimensions[0] ?? 0) : 0;
            if ($actualWidth > 0) {
                $sources[$actualWidth] = $baseUrl.$filename.' '.$actualWidth.'w';
            }
        }

        $original = public_path('demo-media/products/'.basename($path));
        $dimensions = is_file($original) ? getimagesize($original) : false;
        if (is_array($dimensions) && isset($dimensions[0])) {
            $sources[(int) $dimensions[0]] = $url.' '.$dimensions[0].'w';
        }

        ksort($sources, SORT_NUMERIC);

        return $sources === [] ? null : implode(', ', array_values($sources));
    }
}
