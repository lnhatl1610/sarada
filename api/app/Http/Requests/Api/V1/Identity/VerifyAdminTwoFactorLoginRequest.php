<?php

namespace App\Http\Requests\Api\V1\Identity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class VerifyAdminTwoFactorLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'challenge_token' => ['required', 'string', 'size:128'],
            'code' => ['required_without:recovery_code', 'digits:6'],
            'recovery_code' => ['required_without:code', 'string', 'size:14'],
        ];
    }

    protected function passedValidation(): void
    {
        if ($this->filled('code') === $this->filled('recovery_code')) {
            throw ValidationException::withMessages(['code' => 'Nhập mã xác thực hoặc mã khôi phục.']);
        }
    }
}
