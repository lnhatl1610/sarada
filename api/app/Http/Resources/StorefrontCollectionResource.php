<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontCollectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'banner' => $this->banner,
            'banner_alt' => $this->banner_alt ?: 'Bìa bộ sưu tập '.$this->name,
            'is_lookbook' => (bool) $this->is_lookbook,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'products' => $this->when(! $request->boolean('include_lookbook_products'), fn () => ProductResource::collection($this->whenLoaded('products'))),
            'lookbook_products' => $this->when($this->is_lookbook && $this->relationLoaded('products'), fn () => $this->products
                ->map(fn ($product): array => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'x' => min(100, max(0, (float) $product->pivot->lookbook_x)),
                    'y' => min(100, max(0, (float) $product->pivot->lookbook_y)),
                ])
                ->values()),
        ];
    }
}
