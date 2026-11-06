<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreLocationInventory extends Model
{
    protected $fillable = ['store_location_id', 'variant_id', 'quantity', 'reserved', 'low_stock_threshold'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'reserved' => 'integer', 'low_stock_threshold' => 'integer'];
    }

    public function storeLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
