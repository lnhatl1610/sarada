<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'images' => $this->whenLoaded('images', fn () => $this->images->take(1)->map(fn ($image) => ['url' => $image->url, 'alt' => $image->alt])->values()),
        ];
    }
}
