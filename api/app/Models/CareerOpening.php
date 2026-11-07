<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerOpening extends Model
{
    protected $fillable = ['title', 'department', 'location', 'employment_type', 'summary', 'description', 'requirements', 'benefits', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
