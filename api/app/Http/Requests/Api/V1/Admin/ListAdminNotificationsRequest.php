<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListAdminNotificationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', Rule::in([10, 25, 50])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'unread' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['all', 'unread', 'archived'])],
            'event' => ['sometimes', 'string', 'max:80'],
            'priority' => ['sometimes', Rule::in(['normal', 'important', 'urgent'])],
            'q' => ['sometimes', 'string', 'max:120'],
        ];
    }
}
