<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingPhoneChange extends Model
{
    protected $fillable = ['user_id', 'phone', 'code_hash', 'attempts', 'expires_at', 'requested_at'];

    protected function casts(): array
    {
        return ['attempts' => 'integer', 'expires_at' => 'datetime', 'requested_at' => 'datetime'];
    }
}
