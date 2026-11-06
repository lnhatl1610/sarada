<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontProductQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'answer' => $this->answer,
            'customer_name' => $this->whenLoaded('user', fn (): string => (string) $this->user->name),
            'answered_by' => $this->whenLoaded('answerer', fn (): ?string => $this->answerer?->name),
            'created_at' => $this->created_at,
            'answered_at' => $this->answered_at,
        ];
    }
}
