<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductVariant extends Model
{
    protected $fillable = ['product_id', 'sku', 'barcode', 'price', 'compare_at_price', 'color_value_id', 'size_value_id', 'weight_gram', 'is_active'];

    protected function casts(): array
    {
        return ['price' => 'integer', 'compare_at_price' => 'integer', 'is_active' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class, 'variant_id');
    }

    public function storeInventories(): HasMany
    {
        return $this->hasMany(StoreLocationInventory::class, 'variant_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class, 'color_value_id');
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class, 'size_value_id');
    }

    public function hasActiveSalePrice(?Product $product = null, ?CarbonInterface $at = null): bool
    {
        return $this->compare_at_price !== null
            && $this->compare_at_price > $this->price
            && (($product ?? $this->product)?->saleWindowIsActive($at) ?? true);
    }

    public function effectivePrice(?Product $product = null, ?CarbonInterface $at = null): int
    {
        if ($this->compare_at_price !== null && $this->compare_at_price > $this->price) {
            return $this->hasActiveSalePrice($product, $at) ? (int) $this->price : (int) $this->compare_at_price;
        }

        return (int) $this->price;
    }
}
