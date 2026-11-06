<?php

namespace App\Http\Requests\Api\V1\Identity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StorefrontLoginRequest extends FormRequest
{
    private bool $hasConflictingCredentials = false;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->hasConflictingCredentials = $this->filled('identifier') && $this->filled('email');
        $identifier = trim((string) ($this->filled('identifier') ? $this->input('identifier') : $this->input('email', '')));
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $identifier = Str::lower($identifier);
        }

        $this->merge(['identifier' => $identifier]);
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'remember_me' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->hasConflictingCredentials) {
                $validator->errors()->add('identifier', 'Chỉ nhập email hoặc số điện thoại trong một ô.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'Vui lòng nhập email hoặc số điện thoại.',
            'identifier.max' => 'Thông tin đăng nhập không được vượt quá 255 ký tự.',
            'email.email' => 'Email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ];
    }
}
