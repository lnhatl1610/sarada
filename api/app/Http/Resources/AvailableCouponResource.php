<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableCouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this['id'],
            'code' => (string) $this['code'],
            'description' => $this['description'],
            'type' => (string) $this['type'],
            'value' => (int) $this['value'],
            'max_discount' => $this['max_discount'],
            'min_order_value' => (int) $this['min_order_value'],
            'ends_at' => $this['ends_at'],
            'eligible' => (bool) $this['eligible'],
            'unavailable_reason' => $this['unavailable_reason'],
        ];
    }
}
