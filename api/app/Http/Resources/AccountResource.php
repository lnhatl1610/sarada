<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'creator_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'phone' => $this->phone,
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'avatar' => $this->avatar,
            'gender' => $this->gender,
            'birthday' => $this->birthday?->toDateString(),
            'height_cm' => $this->height_cm === null ? null : (float) $this->height_cm,
            'weight_kg' => $this->weight_kg === null ? null : (float) $this->weight_kg,
            'bust_cm' => $this->bust_cm === null ? null : (float) $this->bust_cm,
            'waist_cm' => $this->waist_cm === null ? null : (float) $this->waist_cm,
            'hip_cm' => $this->hip_cm === null ? null : (float) $this->hip_cm,
            'job_title' => $this->job_title,
            'department' => $this->department,
            'staff_code' => $this->staff_code,
            'bio' => $this->bio,
            'signature' => $this->signature,
            'timezone' => $this->timezone,
            'presence_status' => $this->presence_status,
            'presence_until' => $this->presence_until?->toIso8601String(),
            'password_changed_at' => $this->password_changed_at?->toIso8601String(),
            'email_verified' => $this->email_verified_at !== null,
            'pending_email' => $this->whenLoaded('pendingEmailChange', fn () => $this->pendingEmailChange?->email),
            'role' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->first()),
        ];
    }
}
