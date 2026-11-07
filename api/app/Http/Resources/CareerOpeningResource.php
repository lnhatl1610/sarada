<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CareerOpeningResource extends JsonResource
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
            'title' => $this->title,
            'department' => $this->department,
            'location' => $this->location,
            'employment_type' => $this->employment_type,
            'summary' => $this->summary,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'benefits' => $this->benefits,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'updated_at' => $this->updated_at,
        ];
    }
}
