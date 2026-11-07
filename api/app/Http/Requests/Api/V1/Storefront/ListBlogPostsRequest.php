<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ListBlogPostsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('q'))) {
            $query = trim($this->input('q'));
            $this->merge(['q' => $query === '' ? null : $query]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', 'nullable', 'string', 'max:120'],
            'tag' => ['sometimes', 'nullable', 'string', 'max:60', 'alpha_dash:ascii'],
            'q' => ['sometimes', 'nullable', 'string', 'max:120'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:24'],
        ];
    }
}
