<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    protected $fillable = ['province_code', 'province_name', 'fee', 'free_shipping_threshold', 'is_active'];

    protected function casts(): array
    {
        return [
            'fee' => 'integer',
            'free_shipping_threshold' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
