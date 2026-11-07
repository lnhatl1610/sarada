<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faq extends Model
{
    protected $fillable = ['category', 'question', 'answer', 'category_order', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['category_order' => 'integer', 'sort_order' => 'integer', 'is_active' => 'boolean'];
    }

    public function helpfulVotes(): HasMany
    {
        return $this->hasMany(FaqHelpfulVote::class);
    }
}
