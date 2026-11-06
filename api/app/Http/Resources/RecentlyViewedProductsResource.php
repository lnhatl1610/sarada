<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecentlyViewedProductsResource extends JsonResource
{
    /** @return array{slugs: list<string>} */
    public function toArray(Request $request): array
    {
        return ['slugs' => $this->resource];
    }

    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->header('Cache-Control', 'private, no-store');
    }
}
