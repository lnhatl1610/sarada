<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id', 'brand_id', 'name', 'slug', 'short_description', 'description',
        'sku', 'material', 'fit', 'care_instruction', 'target_gender', 'base_price', 'compare_at_price',
        'sale_price', 'sale_starts_at', 'sale_ends_at', 'thumbnail', 'status', 'is_featured', 'is_new', 'view_count', 'meta_title',
        'meta_description', 'rating_avg', 'rating_count', 'sold_count',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'integer',
            'compare_at_price' => 'integer',
            'sale_price' => 'integer',
            'sale_starts_at' => 'immutable_datetime',
            'sale_ends_at' => 'immutable_datetime',
            'is_featured' => 'boolean',
            'is_new' => 'boolean',
            'view_count' => 'integer',
            'rating_avg' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order')->orderBy('id');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(ProductVideo::class)->orderBy('sort_order')->orderBy('id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function sizeRecommendations(): HasMany
    {
        return $this->hasMany(ProductSizeRecommendation::class)->orderBy('size_value_id');
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class)
            ->using(CollectionProduct::class)
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'product_tag');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ProductQuestion::class);
    }

    public function approvedReviewSamples(): HasMany
    {
        return $this->reviews()
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(3);
    }

    public function wishlistedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wishlists')
            ->using(Wishlist::class)
            ->withPivot('created_at');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function saleWindowIsActive(?CarbonInterface $at = null): bool
    {
        $at ??= now();

        if ($this->sale_starts_at === null && $this->sale_ends_at === null) {
            return true;
        }

        return ($this->sale_starts_at === null || $this->sale_starts_at->lessThanOrEqualTo($at))
            && ($this->sale_ends_at === null || $this->sale_ends_at->greaterThanOrEqualTo($at));
    }
}
