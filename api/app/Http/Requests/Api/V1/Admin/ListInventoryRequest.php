<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:120'],
            'low_stock' => ['sometimes', 'boolean'],
            'stock_status' => ['sometimes', 'in:available,low,out'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'brand_id' => ['sometimes', 'integer', 'exists:brands,id'],
            'color_value_id' => ['sometimes', 'integer', 'exists:attribute_values,id'],
            'size_value_id' => ['sometimes', 'integer', 'exists:attribute_values,id'],
            'sort' => ['sometimes', 'in:product_name,-product_name,sku,-sku,quantity,-quantity,available,-available,low_stock_threshold,-low_stock_threshold'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function attributes(): array
    {
        return [
            'q' => 'từ khóa',
            'low_stock' => 'bộ lọc sắp hết hàng',
            'stock_status' => 'trạng thái tồn kho',
            'category_id' => 'danh mục',
            'sort' => 'thứ tự sắp xếp',
            'per_page' => 'số dòng mỗi trang',
        ];
    }

    public function messages(): array
    {
        return [
            'q.max' => 'Từ khóa tìm kiếm không được dài quá 120 ký tự.',
            'low_stock.boolean' => 'Bộ lọc sắp hết hàng không hợp lệ.',
            'stock_status.in' => 'Trạng thái tồn kho không hợp lệ.',
            'category_id.integer' => 'Danh mục phải là một mã hợp lệ.',
            'category_id.exists' => 'Danh mục đã chọn không tồn tại.',
            'sort.in' => 'Thứ tự sắp xếp không hợp lệ.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang ít nhất là 1.',
            'per_page.max' => 'Số dòng mỗi trang không được vượt quá 100.',
        ];
    }
}
