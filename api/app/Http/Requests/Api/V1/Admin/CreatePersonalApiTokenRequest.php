<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePersonalApiTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route permission middleware is authoritative.
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:120'],
            'permissions' => ['required', 'array', 'min:1', 'max:20'],
            'permissions.*' => ['required', 'string', 'distinct', Rule::exists('permissions', 'name')->where('guard_name', 'api')],
            'expires_in' => ['required', Rule::in([7, 30, 90, 'never'])],
        ];

        return $rules;
    }
}
