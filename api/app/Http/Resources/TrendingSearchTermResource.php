<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrendingSearchTermResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'term' => (string) $this->term,
            'search_count' => (int) $this->search_count,
        ];
    }
}
