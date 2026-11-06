<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTask extends Model
{
    protected $fillable = ['user_id', 'assigned_by', 'title', 'description', 'priority', 'status', 'due_at', 'remind_at', 'repeat_rule', 'reminded_at', 'subject_type', 'subject_id', 'completed_at'];

    protected function casts(): array
    {
        return ['due_at' => 'datetime', 'remind_at' => 'datetime', 'reminded_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
