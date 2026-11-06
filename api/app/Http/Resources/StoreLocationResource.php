<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreLocationResource extends JsonResource
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
            'name' => $this->name,
            'address' => $this->address,
            'province_code' => $this->province_code,
            'province_name' => $this->province_name,
            'ward_name' => $this->ward_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'opening_hours' => $this->opening_hours,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
