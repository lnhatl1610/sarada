<?php

namespace App\Http\Resources;

use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $item = $this->resource;
        if ($item instanceof AttributeValue) {
            return ['id' => $item->id, 'name' => $item->value, 'value' => $item->value, 'group' => $item->attribute?->name, 'color_hex' => $item->color_hex, 'sort_order' => $item->sort_order, 'usage_count' => (int) ($item->usage_count ?? 0)];
        }

        $data = ['id' => $item->id, 'name' => $item->name, 'slug' => $item->slug, 'is_active' => (bool) $item->is_active, 'product_count' => (int) ($item->products_count ?? 0)];
        if ($item instanceof Category) {
            return $data + ['parent_id' => $item->parent_id, 'parent_name' => $item->parent?->name, 'image' => $item->image, 'image_alt' => $item->image_alt ?: 'Ảnh danh mục '.$item->name, 'description' => $item->description, 'meta_title' => $item->meta_title, 'meta_description' => $item->meta_description, 'sort_order' => $item->sort_order];
        }
        if ($item instanceof Brand) {
            return $data + ['logo' => $item->logo, 'banner' => $item->banner, 'banner_alt' => $item->banner_alt ?: 'Bìa thương hiệu '.$item->name, 'description' => $item->description, 'meta_title' => $item->meta_title, 'meta_description' => $item->meta_description];
        }
        if ($item instanceof Collection) {
            $status = ! $item->is_active ? 'disabled'
                : ($item->starts_at && $item->starts_at->isFuture() ? 'upcoming'
                    : ($item->ends_at && $item->ends_at->isPast() ? 'expired' : 'running'));

            return $data + ['status' => $status, 'description' => $item->description, 'meta_title' => $item->meta_title, 'meta_description' => $item->meta_description, 'banner' => $item->banner, 'banner_alt' => $item->banner_alt ?: 'Bìa bộ sưu tập '.$item->name, 'is_lookbook' => (bool) $item->is_lookbook, 'starts_at' => $item->starts_at?->toIso8601String(), 'ends_at' => $item->ends_at?->toIso8601String()];
        }

        return $data;
    }
}
