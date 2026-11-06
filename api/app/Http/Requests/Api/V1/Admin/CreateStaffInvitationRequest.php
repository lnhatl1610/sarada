<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStaffInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email'), Rule::unique('pending_email_changes', 'email')->where(fn ($query) => $query->where('expires_at', '>', now()))],
            'role' => ['required', Rule::in(Role::ASSIGNABLE_ADMIN_NAMES)],
            'expires_in_hours' => ['required', 'integer', Rule::in([24, 48, 168])],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
