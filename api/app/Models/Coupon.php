<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'description', 'type', 'value', 'max_discount', 'min_order_amount', 'min_order_value',
        'usage_limit', 'usage_per_user', 'used_count', 'starts_at', 'expires_at', 'ends_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'max_discount' => 'integer',
            'min_order_amount' => 'integer',
            'min_order_value' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
