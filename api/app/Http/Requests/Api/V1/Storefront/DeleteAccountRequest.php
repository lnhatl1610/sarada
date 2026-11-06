<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['password' => ['required', 'current_password']];
    }

    public function messages(): array
    {
        return ['password.required' => 'Vui lòng nhập mật khẩu để xác nhận.', 'password.current_password' => 'Mật khẩu không chính xác.'];
    }
}
