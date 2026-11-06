<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Role;
use App\Support\StorePasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.',
            'phone.unique' => 'Số điện thoại này đã được sử dụng.',
            'password.uncompromised' => 'Mật khẩu này đã xuất hiện trong dữ liệu bị lộ. Hãy chọn mật khẩu khác.',
        ];
    }

    public function rules(): array
    {
        $id = $this->route('staff');
        $required = $id ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'min:2', 'max:160'],
            'email' => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($id), Rule::unique('pending_email_changes', 'email')->where(fn ($query) => $query->where('expires_at', '>', now()))],
            'phone' => ['sometimes', 'nullable', 'regex:/^(0|\+84)\d{9}$/', Rule::unique('users', 'phone')->ignore($id)],
            'password' => [$id ? 'sometimes' : 'required', ...StorePasswordPolicy::rules(10)],
            'role' => [$required, Rule::in(Role::ASSIGNABLE_ADMIN_NAMES)],
            'status' => ['sometimes', Rule::in(['active', 'blocked'])],
        ];
    }
}
