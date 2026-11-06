<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    protected $fillable = ['variant_id', 'quantity', 'reserved', 'low_stock_threshold'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'reserved' => 'integer', 'low_stock_threshold' => 'integer'];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
