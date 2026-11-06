<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class StorefrontReviewResource extends ReviewResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        if (isset($data['customer']) && is_array($data['customer'])) {
            unset($data['customer']['email']);
        }

        return $data;
    }
}
