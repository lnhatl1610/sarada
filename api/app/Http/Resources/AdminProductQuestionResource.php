<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminProductQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'answer' => $this->answer,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'answered_at' => $this->answered_at,
            'customer' => $this->whenLoaded('user', fn (): array => ['name' => $this->user->name]),
            'answerer' => $this->whenLoaded('answerer', fn (): ?array => $this->answerer ? ['name' => $this->answerer->name] : null),
            'product' => $this->whenLoaded('product', fn (): array => ['id' => $this->product->id, 'name' => $this->product->name, 'slug' => $this->product->slug]),
        ];
    }
}
