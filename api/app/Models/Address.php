<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id', 'recipient_name', 'phone', 'province_code', 'district_code',
        'ward_code', 'street', 'label', 'is_default', 'is_default_billing',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean', 'is_default_billing' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
