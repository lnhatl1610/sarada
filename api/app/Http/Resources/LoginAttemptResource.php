<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class LoginAttemptResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'result' => $this->result,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'location' => $this->location,
            'reported_at' => $this->reported_at ? Carbon::parse($this->reported_at)->toIso8601String() : null,
            'created_at' => $this->created_at ? Carbon::parse($this->created_at)->toIso8601String() : null,
        ];
    }
}
