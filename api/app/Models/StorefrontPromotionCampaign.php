<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'message', 'href', 'status', 'recipient_count', 'queued_count', 'failed_count', 'created_by', 'dispatched_at'])]
class StorefrontPromotionCampaign extends Model
{
    protected function casts(): array
    {
        return ['dispatched_at' => 'immutable_datetime'];
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(StorefrontPromotionCampaignRecipient::class, 'campaign_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
