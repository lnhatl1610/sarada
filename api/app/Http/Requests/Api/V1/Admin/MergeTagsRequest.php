<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MergeTagsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'target_id' => ['required', 'integer', Rule::exists('tags', 'id')],
            'source_ids' => ['required', 'array', 'min:1', 'max:100'],
            'source_ids.*' => ['required', 'integer', 'distinct', Rule::exists('tags', 'id')],
        ];
    }
}
