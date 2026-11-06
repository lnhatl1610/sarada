<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:confirmed,processing,shipping,delivered,delivery_failed,returned,completed,cancelled'],
            'note' => ['required_if:status,cancelled', 'nullable', 'string', 'max:2000'],
            'payment_collected' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái đơn hàng.',
            'status.in' => 'Trạng thái đơn hàng không hợp lệ.',
            'note.required_if' => 'Vui lòng nhập lý do khi hủy đơn hàng.',
            'note.max' => 'Lý do không được vượt quá 2000 ký tự.',
        ];
    }
}
