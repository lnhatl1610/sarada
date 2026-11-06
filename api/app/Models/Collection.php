<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'meta_title', 'meta_description', 'banner', 'banner_alt', 'is_lookbook', 'is_active', 'starts_at', 'ends_at'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_lookbook' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->using(CollectionProduct::class)
            ->withPivot('sort_order', 'lookbook_x', 'lookbook_y')
            ->orderByPivot('sort_order');
    }
}
