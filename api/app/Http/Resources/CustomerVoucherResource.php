<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerVoucherResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this['id'],
            'code' => (string) $this['code'],
            'description' => $this['description'],
            'type' => (string) $this['type'],
            'value' => (int) $this['value'],
            'max_discount' => $this['max_discount'] === null ? null : (int) $this['max_discount'],
            'min_order_value' => (int) $this['min_order_value'],
            'starts_at' => $this['starts_at'],
            'ends_at' => $this['ends_at'],
            'usage_count' => (int) $this['usage_count'],
            'usage_per_user' => $this['usage_per_user'] === null ? null : (int) $this['usage_per_user'],
            'status' => (string) $this['status'],
            'unavailable_reason' => $this['unavailable_reason'],
        ];
    }
}
