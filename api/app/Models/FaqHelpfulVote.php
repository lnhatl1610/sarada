<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaqHelpfulVote extends Model
{
    public $timestamps = false;

    protected $fillable = ['faq_id', 'visitor_id', 'helpful', 'created_at'];

    protected function casts(): array
    {
        return ['helpful' => 'boolean', 'created_at' => 'datetime'];
    }

    public function faq(): BelongsTo
    {
        return $this->belongsTo(Faq::class);
    }
}
