<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ManageTwoFactorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => $this->attributes->get('sudo_mode_active') === true ? ['nullable', 'string'] : ['required', 'current_password'],
            'code' => ['required', 'digits:6'],
        ];
    }
}
