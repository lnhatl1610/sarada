<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscription extends Model
{
    protected $fillable = ['email', 'consented_at'];

    protected function casts(): array
    {
        return ['consented_at' => 'immutable_datetime'];
    }
}
