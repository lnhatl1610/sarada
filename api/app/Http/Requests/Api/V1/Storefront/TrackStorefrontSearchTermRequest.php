<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class TrackStorefrontSearchTermRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $term = $this->input('q');
        if (is_string($term)) {
            $this->merge(['q' => preg_replace('/\s+/u', ' ', trim($term))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return ['q' => ['required', 'string', 'min:2', 'max:120']];
    }
}
