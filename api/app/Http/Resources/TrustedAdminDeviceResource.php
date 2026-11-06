<?php

namespace App\Http\Resources;

use App\Support\ClientDeviceDetails;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrustedAdminDeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            ...ClientDeviceDetails::fromUserAgent($this->device_info),
            'ip' => $this->ip,
            'last_used_at' => $this->last_used_at,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
        ];
    }
}
