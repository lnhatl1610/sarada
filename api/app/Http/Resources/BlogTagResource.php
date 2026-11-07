<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogTagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
        ];
    }
}
