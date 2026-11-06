<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonalTaskResource extends JsonResource
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
            'user_id' => $this->user_id,
            'assignee_name' => $this->assignee?->name,
            'assigned_by' => $this->assigned_by,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,
            'due_at' => $this->due_at?->toIso8601String(),
            'remind_at' => $this->remind_at?->toIso8601String(),
            'repeat_rule' => $this->repeat_rule,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
