<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    protected $fillable = ['user_id', 'session_token', 'expires_at', 'last_activity_at', 'recovery_1h_sent_at', 'recovery_24h_sent_at', 'recovery_email', 'recovery_consent_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'recovery_1h_sent_at' => 'datetime',
            'recovery_24h_sent_at' => 'datetime',
            'recovery_consent_at' => 'datetime',
        ];
    }

    public function recordActivity(): void
    {
        $this->forceFill([
            'last_activity_at' => now(),
            'recovery_1h_sent_at' => null,
            'recovery_24h_sent_at' => null,
        ])->save();
    }

    public function clearRecoveryContact(): void
    {
        $this->forceFill(['recovery_email' => null, 'recovery_consent_at' => null])->save();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
