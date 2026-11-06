<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportJob extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'source_filename',
        'status',
        'total_rows',
        'successful_rows',
        'failed_rows',
        'error_rows',
        'error_message',
    ];

    protected function casts(): array
    {
        return ['error_rows' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
