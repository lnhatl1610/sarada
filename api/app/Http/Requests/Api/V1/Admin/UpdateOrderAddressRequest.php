<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'shipping_address' => ['required', 'array'],
            'shipping_address.province_code' => ['nullable', 'string', 'max:32'],
            'shipping_address.province' => ['nullable', 'string', 'max:120'],
            'shipping_address.district' => ['nullable', 'string', 'max:120'],
            'shipping_address.ward_code' => ['nullable', 'string', 'max:32'],
            'shipping_address.ward' => ['nullable', 'string', 'max:120'],
            'shipping_address.street' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Vui lòng nhập tên người nhận.',
            'customer_phone.required' => 'Vui lòng nhập số điện thoại người nhận.',
            'customer_email.email' => 'Email người nhận không đúng định dạng.',
            'shipping_address.required' => 'Vui lòng nhập địa chỉ giao hàng.',
            'shipping_address.street.required' => 'Vui lòng nhập địa chỉ chi tiết.',
        ];
    }
}
