<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;

/** @mixin DatabaseNotification */
class AdminNotificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->data['event'],
            'title' => $this->data['title'],
            'detail' => $this->data['detail'],
            'priority' => in_array($this->data['priority'] ?? null, ['normal', 'important', 'urgent'], true) ? $this->data['priority'] : 'normal',
            'href' => $this->data['href'],
            'read_at' => $this->read_at?->toIso8601String(),
            'archived_at' => $this->archived_at ? Carbon::parse($this->archived_at)->toIso8601String() : null,
            'snoozed_until' => $this->snoozed_until ? Carbon::parse($this->snoozed_until)->toIso8601String() : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
