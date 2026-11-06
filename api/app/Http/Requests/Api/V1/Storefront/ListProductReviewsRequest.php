<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ListProductReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'sort' => ['sometimes', 'string', 'in:latest,rating_desc,rating_asc'],
            'rating' => ['sometimes', 'integer', 'between:1,5'],
            'with_images' => ['sometimes', 'in:true,false,1,0'],
            'size' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
