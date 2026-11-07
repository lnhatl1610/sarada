<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ListRecentStorefrontReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ];
    }
}
