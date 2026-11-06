<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['campaign_id', 'user_id', 'email', 'email_hash', 'status', 'attempts', 'last_error', 'queued_at'])]
class StorefrontPromotionCampaignRecipient extends Model
{
    protected function casts(): array
    {
        return ['queued_at' => 'immutable_datetime'];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(StorefrontPromotionCampaign::class, 'campaign_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
