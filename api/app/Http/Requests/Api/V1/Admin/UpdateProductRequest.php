<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($productId)],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['sometimes', 'nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string'],
            'fit' => ['sometimes', 'nullable', 'string', 'max:80'],
            'base_price' => ['sometimes', 'integer', 'min:0'],
            'compare_at_price' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:draft,active,hidden,archived'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique' => 'Đường dẫn sản phẩm đã được sử dụng.',
            'category_id.exists' => 'Danh mục không tồn tại.',
            'brand_id.exists' => 'Thương hiệu không tồn tại.',
            'base_price.integer' => 'Giá sản phẩm phải là số nguyên VND.',
            'base_price.min' => 'Giá sản phẩm không được âm.',
            'compare_at_price.integer' => 'Giá so sánh phải là số nguyên VND.',
            'compare_at_price.min' => 'Giá so sánh không được âm.',
            'status.in' => 'Trạng thái sản phẩm không hợp lệ.',
        ];
    }
}
