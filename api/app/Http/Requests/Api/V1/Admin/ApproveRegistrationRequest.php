<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['role' => ['required', Rule::in(['customer', ...Role::ASSIGNABLE_ADMIN_NAMES])]];
    }
}
