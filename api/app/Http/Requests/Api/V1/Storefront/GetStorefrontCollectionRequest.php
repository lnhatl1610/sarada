<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class GetStorefrontCollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'include_products' => ['sometimes', 'boolean'],
            'include_lookbook_products' => ['sometimes', 'boolean'],
        ];
    }
}
