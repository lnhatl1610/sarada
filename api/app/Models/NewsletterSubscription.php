<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscription extends Model
{
    protected $fillable = [
        'email',
        'consented_at',
        'unsubscribed_at',
        'unsubscribe_reason',
        'unsubscribe_token_hash',
        'unsubscribe_token_expires_at',
        'pending_unsubscribe_reason',
    ];

    protected function casts(): array
    {
        return [
            'consented_at' => 'immutable_datetime',
            'unsubscribed_at' => 'immutable_datetime',
            'unsubscribe_token_expires_at' => 'immutable_datetime',
        ];
    }
}
