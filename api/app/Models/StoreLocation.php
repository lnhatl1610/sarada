<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreLocation extends Model
{
    protected $fillable = [
        'name', 'address', 'province_code', 'province_name', 'ward_name', 'phone', 'email',
        'opening_hours', 'latitude', 'longitude', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(StoreLocationInventory::class);
    }
}
