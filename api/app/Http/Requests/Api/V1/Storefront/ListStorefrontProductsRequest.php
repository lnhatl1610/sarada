<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ListStorefrontProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', 'string', 'max:160'],
            'target_gender' => ['sometimes', 'in:men,women,unisex,kids'],
            'brand' => ['sometimes', 'string', 'max:160'],
            'collection' => ['sometimes', 'string', 'max:160'],
            'price_min' => ['sometimes', 'integer', 'min:0'],
            'price_max' => ['sometimes', 'integer', 'min:0', 'gte:price_min'],
            'size' => ['sometimes', 'string', 'max:100'],
            'color' => ['sometimes', 'string', 'max:100'],
            'material' => ['sometimes', 'string', 'max:255'],
            'fit' => ['sometimes', 'string', 'max:80'],
            'in_stock' => ['sometimes', 'boolean'],
            'rating_min' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'discount_min' => ['sometimes', 'integer', 'in:10,20,30,50'],
            'q' => ['sometimes', 'string', 'max:120'],
            'sort' => ['sometimes', 'in:relevance,newest,price_asc,price_desc,bestseller,rating_desc,discount_desc'],
            'new' => ['sometimes', 'boolean'],
            'best_seller' => ['sometimes', 'boolean'],
            'sale' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:48'],
        ];
    }

    public function messages(): array
    {
        return [
            'price_max.gte' => 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.',
        ];
    }
}
