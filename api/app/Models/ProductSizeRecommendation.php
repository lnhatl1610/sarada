<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSizeRecommendation extends Model
{
    protected $fillable = ['product_id', 'size_value_id', 'height_min_cm', 'height_max_cm', 'weight_min_kg', 'weight_max_kg'];

    protected function casts(): array
    {
        return ['height_min_cm' => 'decimal:1', 'height_max_cm' => 'decimal:1', 'weight_min_kg' => 'decimal:1', 'weight_max_kg' => 'decimal:1'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class, 'size_value_id');
    }
}
