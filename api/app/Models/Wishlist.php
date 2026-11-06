<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class Wishlist extends Pivot
{
    protected $table = 'wishlists';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['user_id', 'product_id', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
