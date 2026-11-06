<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListAdminProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'in:draft,active,hidden,archived'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'category_ids' => ['sometimes', 'array', 'max:50'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],
            'brand_id' => ['sometimes', 'integer', 'exists:brands,id'],
            'brand_ids' => ['sometimes', 'array', 'max:50'],
            'brand_ids.*' => ['integer', 'distinct', 'exists:brands,id'],
            'collection_ids' => ['sometimes', 'array', 'max:50'],
            'collection_ids.*' => ['integer', 'distinct', 'exists:collections,id'],
            'exclude_collection_id' => ['sometimes', 'integer', 'exists:collections,id'],
            'target_gender' => ['sometimes', 'in:men,women,unisex,kids'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'in_stock' => ['sometimes', 'boolean'],
            'stock_status' => ['sometimes', 'in:in_stock,low_stock,out_of_stock'],
            'has_sale' => ['sometimes', 'boolean'],
            'has_image' => ['sometimes', 'boolean'],
            'created_from' => ['sometimes', 'date_format:Y-m-d'],
            'created_to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:created_from'],
            'min_price' => ['sometimes', 'integer', 'min:0'],
            'max_price' => ['sometimes', 'integer', 'min:0', 'gte:min_price'],
            'sort' => ['sometimes', 'in:created_at,-created_at,updated_at,-updated_at,name,-name,price,-price'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'q.max' => 'Từ khóa tìm kiếm không được vượt quá 120 ký tự.',
            'category_id.exists' => 'Danh mục đã chọn không tồn tại.',
            'category_ids.max' => 'Chỉ được lọc tối đa 50 danh mục cùng lúc.',
            'category_ids.*.exists' => 'Một hoặc nhiều danh mục đã chọn không tồn tại.',
            'brand_id.exists' => 'Thương hiệu đã chọn không tồn tại.',
            'brand_ids.max' => 'Chỉ được lọc tối đa 50 thương hiệu cùng lúc.',
            'brand_ids.*.exists' => 'Một hoặc nhiều thương hiệu đã chọn không tồn tại.',
            'collection_ids.max' => 'Chỉ được lọc tối đa 50 bộ sưu tập cùng lúc.',
            'collection_ids.*.exists' => 'Một hoặc nhiều bộ sưu tập đã chọn không tồn tại.',
            'stock_status.in' => 'Trạng thái tồn kho không hợp lệ.',
            'created_to.after_or_equal' => 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
            'max_price.gte' => 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.',
            'sort.in' => 'Trường sắp xếp không được hỗ trợ.',
            'per_page.max' => 'Mỗi trang chỉ được yêu cầu tối đa 100 sản phẩm.',
        ];
    }
}
