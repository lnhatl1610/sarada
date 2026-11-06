<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductStockAlert extends Model
{
    protected $fillable = ['variant_id', 'user_id', 'email', 'phone', 'queued_at'];

    protected function casts(): array
    {
        return ['queued_at' => 'datetime'];
    }
}
