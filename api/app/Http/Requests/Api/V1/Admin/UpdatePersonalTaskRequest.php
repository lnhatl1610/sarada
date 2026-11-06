<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePersonalTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'min:1', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['todo', 'doing', 'done'])],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'remind_at' => ['sometimes', 'nullable', 'date'],
            'repeat_rule' => ['sometimes', 'nullable', Rule::in(['daily', 'weekly'])],
            'subject_type' => ['sometimes', 'nullable', Rule::in(['order', 'product', 'customer', 'inventory'])],
            'subject_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ];
    }
}
