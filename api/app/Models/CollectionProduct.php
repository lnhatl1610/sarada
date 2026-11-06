<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class CollectionProduct extends Pivot
{
    protected $table = 'collection_product';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['collection_id', 'product_id', 'sort_order', 'lookbook_x', 'lookbook_y'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer', 'lookbook_x' => 'float', 'lookbook_y' => 'float'];
    }
}
