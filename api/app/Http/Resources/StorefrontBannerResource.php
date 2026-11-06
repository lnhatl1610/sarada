<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontBannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'image' => $this->image,
            'video_url' => $this->video_url,
            'alt' => $this->alt ?: $this->title,
            'placement' => $this->position,
            'link' => $this->link_url ?: $this->link,
            'sort_order' => $this->sort_order,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'show_countdown' => (bool) $this->show_countdown,
        ];
    }
}
