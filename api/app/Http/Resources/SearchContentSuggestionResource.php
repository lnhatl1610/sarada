<?php

namespace App\Http\Resources;

use App\Models\BlogPost;
use App\Support\PageContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class SearchContentSuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isBlogPost = $this->resource instanceof BlogPost || ($this->resource->type ?? null) === 'article';
        $content = $isBlogPost ? (string) ($this->resource->excerpt ?? $this->resource->content) : (string) $this->resource->content;
        $plainContent = $isBlogPost
            ? $content
            : trim(html_entity_decode(strip_tags(PageContentSanitizer::sanitize($content))));

        return [
            'id' => (int) $this->resource->id,
            'title' => (string) $this->resource->title,
            'slug' => (string) $this->resource->slug,
            'description' => $this->resource->meta_description ?: Str::limit($plainContent, 140),
            'type' => $isBlogPost ? 'article' : 'page',
            'href' => $this->resource->href ?? (($isBlogPost ? '/blog/' : '/pages/').$this->resource->slug),
        ];
    }
}
