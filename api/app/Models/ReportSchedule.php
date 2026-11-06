<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportSchedule extends Model
{
    protected $fillable = [
        'user_id', 'name', 'report', 'params', 'frequency', 'format', 'recipients', 'timezone',
        'send_time', 'weekday', 'month_day', 'next_run_at', 'last_run_at', 'last_error', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'params' => 'array',
            'recipients' => 'array',
            'next_run_at' => 'immutable_datetime',
            'last_run_at' => 'immutable_datetime',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
