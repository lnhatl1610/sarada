<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateManualOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('status', 'active')->whereNull('deleted_at')],
            'customer_name' => ['required', 'string', 'max:160'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'shipping_address' => ['required', 'array'],
            'shipping_address.province_code' => ['required', 'string', 'max:32'],
            'shipping_address.province' => ['nullable', 'string', 'max:120'],
            'shipping_address.district_code' => ['nullable', 'string', 'max:32'],
            'shipping_address.ward_code' => ['required', 'string', 'max:32'],
            'shipping_address.ward' => ['nullable', 'string', 'max:120'],
            'shipping_address.street' => ['required', 'string', 'max:255'],
            'shipping_address.recipient_name' => ['required', 'string', 'max:160'],
            'shipping_address.phone' => ['required', 'string', 'max:32'],
            'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.variant_id' => ['required', 'integer', 'distinct', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
