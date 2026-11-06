<?php

namespace App\Http\Resources;

use App\Models\Banner;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $item = $this->resource;

        if ($item instanceof Coupon) {
            return [
                'id' => $item->id,
                'code' => $item->code,
                'description' => $item->description,
                'type' => $item->type,
                'value' => (int) $item->value,
                'max_discount' => $item->max_discount,
                'min_order_value' => (int) ($item->min_order_value ?? $item->min_order_amount ?? 0),
                'usage_limit' => $item->usage_limit,
                'usage_per_user' => $item->usage_per_user,
                'used_count' => (int) $item->used_count,
                'starts_at' => $item->starts_at?->toIso8601String(),
                'ends_at' => ($item->ends_at ?? $item->expires_at)?->toIso8601String(),
                'is_active' => (bool) $item->is_active,
            ];
        }

        if ($item instanceof Banner) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'description' => $item->description,
                'alt' => $item->alt ?: $item->title,
                'image' => $item->image,
                'video_url' => $item->video_url,
                'link' => $item->link ?? $item->link_url,
                'position' => $item->position,
                'sort_order' => (int) $item->sort_order,
                'starts_at' => $item->starts_at?->toIso8601String(),
                'ends_at' => $item->ends_at?->toIso8601String(),
                'show_countdown' => (bool) $item->show_countdown,
                'is_active' => (bool) $item->is_active,
            ];
        }

        return [];
    }
}
