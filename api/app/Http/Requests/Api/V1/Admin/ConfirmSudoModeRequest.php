<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfirmSudoModeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'max:255'],
            'two_factor_code' => [Rule::requiredIf(fn (): bool => $this->user()->two_factor_enabled_at !== null), 'nullable', 'digits:6'],
        ];
    }
}
