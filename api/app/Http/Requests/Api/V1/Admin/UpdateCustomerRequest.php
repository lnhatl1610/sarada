<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:160'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('customer')), Rule::unique('pending_email_changes', 'email')->where(fn ($query) => $query->where('expires_at', '>', now()))],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female', 'other'])],
            'birthday' => ['sometimes', 'nullable', 'date', 'before:today'],
            'status' => ['sometimes', Rule::in(['active', 'blocked'])],
        ];
    }
}
