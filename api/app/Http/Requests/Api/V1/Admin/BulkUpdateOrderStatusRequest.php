<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_ids' => ['required', 'array', 'min:1', 'max:100'],
            'order_ids.*' => ['integer', 'distinct', 'exists:orders,id'],
            'status' => ['required', 'in:confirmed,processing,shipping,delivered,delivery_failed,returned,completed,cancelled'],
            'note' => ['required_if:status,cancelled', 'nullable', 'string', 'max:2000'],
            'payment_collected' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_ids.required' => 'Vui lòng chọn ít nhất một đơn hàng.',
            'order_ids.min' => 'Vui lòng chọn ít nhất một đơn hàng.',
            'order_ids.max' => 'Chỉ có thể cập nhật tối đa 100 đơn cùng lúc.',
            'order_ids.*.distinct' => 'Danh sách có đơn hàng bị lặp.',
            'order_ids.*.exists' => 'Một hoặc nhiều đơn hàng không còn tồn tại.',
            'status.required' => 'Vui lòng chọn trạng thái đơn hàng.',
            'status.in' => 'Trạng thái đơn hàng không hợp lệ.',
            'note.required_if' => 'Vui lòng nhập lý do khi hủy đơn hàng.',
        ];
    }
}
