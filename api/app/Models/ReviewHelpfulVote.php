<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewHelpfulVote extends Model
{
    public $timestamps = false;

    protected $fillable = ['review_id', 'visitor_id'];

    protected function casts(): array
    {
        return ['created_at' => 'immutable_datetime'];
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }
}
