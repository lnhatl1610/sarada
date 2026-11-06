<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'url', 'alt', 'sort_order', 'is_primary', 'color_value_id', 'is_360_frame'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean', 'is_360_frame' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
