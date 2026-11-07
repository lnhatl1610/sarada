<?php

namespace App\Http\Resources;

use App\Support\BlogReadingTime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'title' => (string) $this->title,
            'slug' => (string) $this->slug,
            'category_name' => (string) $this->category_name,
            'category_slug' => (string) $this->category_slug,
            'excerpt' => (string) $this->excerpt,
            'author_name' => $this->author_name,
            'cover_image' => $this->cover_image,
            'cover_alt' => $this->cover_alt,
            'published_at' => $this->published_at?->toIso8601String(),
            'reading_minutes' => BlogReadingTime::estimate((string) $this->content),
            'view_count' => (int) $this->view_count,
            'tags' => BlogTagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
