<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BlogPost extends Model
{
    protected $fillable = [
        'title', 'slug', 'category_name', 'category_slug', 'excerpt', 'author_name', 'author_bio', 'cover_image', 'cover_alt',
        'content', 'meta_title', 'meta_description', 'is_published', 'published_at',
    ];

    protected function casts(): array
    {
        return ['is_published' => 'boolean', 'published_at' => 'immutable_datetime', 'view_count' => 'integer'];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'blog_post_product')->withPivot('sort_order')->orderByPivot('sort_order');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tag');
    }

    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('is_published', true)->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
