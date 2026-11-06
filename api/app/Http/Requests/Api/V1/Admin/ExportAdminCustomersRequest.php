<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ExportAdminCustomersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'in:active,blocked'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'email_verified' => ['sometimes', 'boolean'],
            'min_spent' => ['sometimes', 'integer', 'min:0'],
            'max_spent' => ['sometimes', 'integer', 'min:0', 'gte:min_spent'],
            'min_orders' => ['sometimes', 'integer', 'min:0'],
            'max_orders' => ['sometimes', 'integer', 'min:0', 'gte:min_orders'],
            'last_order_from' => ['sometimes', 'date'],
            'last_order_to' => ['sometimes', 'date', 'after_or_equal:last_order_from'],
            'province_code' => ['sometimes', 'string', 'max:32'],
            'gender' => ['sometimes', 'in:male,female,other'],
        ];
    }

    public function messages(): array
    {
        return [
            'q.max' => 'Từ khóa không được vượt quá 120 ký tự.',
            'status.in' => 'Trạng thái tài khoản không hợp lệ.',
            'from.date' => 'Ngày bắt đầu không hợp lệ.',
            'to.date' => 'Ngày kết thúc không hợp lệ.',
            'to.after_or_equal' => 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
        ];
    }
}
