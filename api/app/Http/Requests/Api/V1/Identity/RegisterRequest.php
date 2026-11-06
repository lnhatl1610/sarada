<?php

namespace App\Http\Requests\Api\V1\Identity;

use App\Support\StorePasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => Str::lower(trim((string) $this->input('email')))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email'), Rule::unique('pending_email_changes', 'email')->where(fn ($query) => $query->where('expires_at', '>', now()))],
            'phone' => ['nullable', 'string', 'max:32', 'unique:users,phone'],
            'password' => ['required', ...StorePasswordPolicy::rules(), 'confirmed'],
            'terms' => ['accepted'],
            'marketing_consent' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập họ tên.',
            'name.max' => 'Họ tên không được vượt quá 160 ký tự.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email này đã được sử dụng.',
            'phone.unique' => 'Số điện thoại này đã được sử dụng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu cần ít nhất :min ký tự.',
            'password.regex' => 'Mật khẩu chưa đáp ứng chính sách hiện tại.',
            'password.uncompromised' => 'Mật khẩu này đã xuất hiện trong dữ liệu bị lộ. Hãy chọn mật khẩu khác.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
            'terms.accepted' => 'Vui lòng đồng ý với điều khoản sử dụng.',
        ];
    }

    public function attributes(): array
    {
        return ['email' => 'email', 'phone' => 'số điện thoại', 'password' => 'mật khẩu'];
    }
}
