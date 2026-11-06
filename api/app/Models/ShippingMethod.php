<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingMethod extends Model
{
    protected $fillable = ['name', 'fee', 'est_days', 'province_code', 'ward_codes', 'is_active'];

    protected function casts(): array
    {
        return [
            'fee' => 'integer',
            'is_active' => 'boolean',
            'ward_codes' => 'array',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
