<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RefreshToken extends Model
{
    protected $fillable = [
        'user_id', 'token_hash', 'audience', 'access_token_id', 'device_info',
        'ip', 'expires_at', 'revoked_at', 'replaced_by_id',
    ];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replacedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'replaced_by_id');
    }

    public function replacements(): HasMany
    {
        return $this->hasMany(self::class, 'replaced_by_id');
    }
}
