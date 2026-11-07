<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveCareerOpeningRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:2', 'max:180'],
            'department' => ['required', 'string', 'min:2', 'max:120'],
            'location' => ['required', 'string', 'min:2', 'max:150'],
            'employment_type' => ['required', 'in:full_time,part_time'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:800'],
            'description' => ['required', 'string', 'min:10', 'max:20000'],
            'requirements' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'benefits' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
