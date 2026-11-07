<?php

namespace App\Http\Resources;

use App\Models\BlogPost;
use App\Support\BlogReadingTime;
use App\Support\PageContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var BlogPost $post */
        $post = $this->resource;

        return [
            'id' => (int) $post->id,
            'title' => (string) $post->title,
            'slug' => (string) $post->slug,
            'category_name' => (string) $post->category_name,
            'category_slug' => (string) $post->category_slug,
            'excerpt' => (string) $post->excerpt,
            'cover_image' => $post->cover_image,
            'cover_alt' => $post->cover_alt,
            'content' => PageContentSanitizer::sanitize((string) $post->content),
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            'author_bio' => $post->author_bio,
            'is_published' => (bool) $post->is_published,
            'published_at' => $post->published_at?->toIso8601String(),
            'reading_minutes' => BlogReadingTime::estimate((string) $post->content),
            'tags' => BlogTagResource::collection($post->relationLoaded('tags') ? $post->getRelation('tags') : collect()),
            'products' => BlogProductResource::collection($this->whenLoaded('products')),
            'related_posts' => BlogPostCardResource::collection($post->relationLoaded('related_posts') ? $post->getRelation('related_posts') : collect()),
            'newer_post' => $post->relationLoaded('newer_post') && $post->getRelation('newer_post') ? new BlogPostCardResource($post->getRelation('newer_post')) : null,
            'older_post' => $post->relationLoaded('older_post') && $post->getRelation('older_post') ? new BlogPostCardResource($post->getRelation('older_post')) : null,
            'created_at' => $post->created_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
        ];
    }
}
