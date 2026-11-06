<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPriceAlert extends Model
{
    protected $fillable = ['user_id', 'product_id', 'reference_price', 'is_active', 'notified_at'];

    protected function casts(): array
    {
        return ['reference_price' => 'integer', 'is_active' => 'boolean', 'notified_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
