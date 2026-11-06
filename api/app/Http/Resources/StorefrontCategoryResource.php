<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => $this->image,
            'image_alt' => $this->image_alt ?: 'Hình minh họa danh mục '.$this->name,
            'description' => $this->description,
            'sort_order' => (int) $this->sort_order,
            'product_count' => (int) ($this->product_count ?? 0),
            'is_active' => (bool) $this->is_active,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'children' => StorefrontCategoryResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
