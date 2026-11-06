<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    protected $fillable = [
        'variant_id', 'store_location_id', 'type', 'quantity_change', 'stock_after', 'reference_type',
        'reference_id', 'note', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
            'stock_after' => 'integer',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function storeLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class);
    }
}
