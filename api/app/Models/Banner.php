<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = ['title', 'description', 'alt', 'image', 'video_url', 'link', 'link_url', 'position', 'sort_order', 'starts_at', 'ends_at', 'show_countdown', 'is_active'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'show_countdown' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
