<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

class OrderDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return Arr::only($this->resource, [
            'id', 'code', 'customer_id', 'customer_name', 'customer_email', 'customer_phone',
            'invoice_requested', 'invoice_tax_code', 'invoice_company_name', 'invoice_address',
            'shipping_address', 'subtotal', 'discount_total', 'membership_points_used', 'membership_discount_total', 'shipping_fee', 'grand_total',
            'status', 'payment_status', 'payment_method', 'coupon_code', 'note', 'placed_at', 'delivered_at',
            'created_at', 'items', 'payments', 'shipments', 'history', 'change_requests',
        ]);
    }
}
