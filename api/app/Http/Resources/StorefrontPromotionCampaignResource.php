<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontPromotionCampaignResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'href' => $this->href,
            'status' => $this->status,
            'recipient_count' => (int) $this->recipient_count,
            'queued_count' => (int) $this->queued_count,
            'failed_count' => (int) $this->failed_count,
            'skipped_count' => (int) $this->skipped_count,
            'created_at' => $this->created_at?->toIso8601String(),
            'dispatched_at' => $this->dispatched_at?->toIso8601String(),
        ];
    }
}
