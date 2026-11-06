<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExportJob extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'type', 'params', 'status', 'progress', 'file_path', 'file_size', 'error', 'expires_at', 'created_at', 'finished_at'];

    protected function casts(): array
    {
        return ['params' => 'array', 'expires_at' => 'datetime', 'created_at' => 'datetime', 'finished_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
