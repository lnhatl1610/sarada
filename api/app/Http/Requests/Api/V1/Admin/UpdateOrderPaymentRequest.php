<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'payment_status' => ['required', 'in:paid'],
            'note' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_status.required' => 'Vui lòng chọn trạng thái thanh toán.',
            'payment_status.in' => 'Chỉ hỗ trợ ghi nhận đã thu tiền COD.',
            'note.required' => 'Vui lòng ghi lý do cập nhật thanh toán.',
            'note.min' => 'Ghi chú cần có ít nhất 3 ký tự.',
            'note.max' => 'Ghi chú không được vượt quá 1000 ký tự.',
        ];
    }
}
