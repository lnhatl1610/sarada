<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WishlistList extends Model
{
    protected $fillable = ['user_id', 'name', 'is_default', 'share_token'];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'wishlists', 'wishlist_list_id', 'product_id')
            ->using(Wishlist::class)
            ->withPivot(['user_id', 'created_at']);
    }
}
