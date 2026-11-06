<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,blocked'],
            'role' => ['nullable', Rule::in(Role::ASSIGNABLE_ADMIN_NAMES)],
            'last_login_from' => ['nullable', 'date'],
            'last_login_to' => ['nullable', 'date', 'after_or_equal:last_login_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'in:name,-name,email,-email,status,-status,last_login_at,-last_login_at,created_at,-created_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'q.max' => 'Từ khóa không được vượt quá 100 ký tự.',
            'status.in' => 'Trạng thái tài khoản không hợp lệ.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang tối thiểu là 1.',
            'per_page.max' => 'Số dòng mỗi trang tối đa là 100.',
            'sort.in' => 'Thứ tự sắp xếp nhân viên không hợp lệ.',
        ];
    }
}
