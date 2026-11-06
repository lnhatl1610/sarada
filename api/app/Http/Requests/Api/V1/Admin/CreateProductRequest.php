<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'material' => ['nullable', 'string', 'max:255'],
            'fit' => ['nullable', 'string', 'max:80'],
            'care_instruction' => ['nullable', 'string', 'max:500'],
            'target_gender' => ['required', 'in:men,women,unisex,kids'],
            'base_price' => ['required', 'integer', 'min:0'],
            'compare_at_price' => ['nullable', 'integer', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date'],
            'status' => ['required', 'in:draft,active,hidden'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'collection_ids' => ['sometimes', 'array', 'max:50'],
            'collection_ids.*' => ['integer', 'distinct', 'exists:collections,id'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'tags' => ['sometimes', 'array', 'max:20'],
            'tags.*' => ['required', 'string', 'max:50', 'distinct:ignore_case'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.sku' => ['required', 'string', 'max:64', 'distinct', 'unique:product_variants,sku'],
            'variants.*.barcode' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['required', 'integer', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'integer', 'min:0'],
            'variants.*.color_value_id' => [
                'nullable', 'integer',
                Rule::exists('attribute_values', 'id')->whereIn('attribute_id', Attribute::query()->where('type', 'color')->pluck('id')),
            ],
            'variants.*.size_value_id' => [
                'nullable', 'integer',
                Rule::exists('attribute_values', 'id')->whereIn('attribute_id', Attribute::query()->where('type', 'size')->pluck('id')),
            ],
            'variants.*.initial_quantity' => ['required', 'integer', 'min:0'],
            'variants.*.weight_gram' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->has('sale_starts_at') || $validator->errors()->has('sale_ends_at')) {
                return;
            }

            $start = $this->input('sale_starts_at');
            $end = $this->input('sale_ends_at');
            if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('sale_ends_at', 'Thời điểm kết thúc phải sau hoặc bằng thời điểm bắt đầu.');
            }

            foreach (is_array($this->input('variants')) ? $this->input('variants') : [] as $index => $variant) {
                if (! is_array($variant)) {
                    continue;
                }
                $compareAt = $variant['compare_at_price'] ?? null;
                if ($compareAt !== null && (int) $compareAt <= (int) ($variant['price'] ?? 0)) {
                    $validator->errors()->add("variants.{$index}.compare_at_price", 'Giá so sánh phải lớn hơn giá bán của biến thể.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên sản phẩm.',
            'name.max' => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'slug.unique' => 'Slug này đã được sử dụng.',
            'sku.required' => 'Vui lòng nhập SKU sản phẩm.',
            'sku.unique' => 'SKU sản phẩm này đã được sử dụng.',
            'category_id.required' => 'Vui lòng chọn danh mục.',
            'category_id.exists' => 'Danh mục đã chọn không tồn tại.',
            'base_price.required' => 'Vui lòng nhập giá niêm yết.',
            'base_price.integer' => 'Giá niêm yết phải là số nguyên VND.',
            'base_price.min' => 'Giá niêm yết không được âm.',
            'sale_starts_at.date' => 'Thời điểm bắt đầu khuyến mãi không hợp lệ.',
            'sale_ends_at.date' => 'Thời điểm kết thúc khuyến mãi không hợp lệ.',
            'tags.array' => 'Danh sách nhãn sản phẩm không hợp lệ.',
            'tags.max' => 'Mỗi sản phẩm có tối đa 20 nhãn.',
            'tags.*.required' => 'Tên nhãn không được để trống.',
            'tags.*.string' => 'Tên nhãn phải là văn bản.',
            'tags.*.max' => 'Mỗi nhãn không được vượt quá 50 ký tự.',
            'tags.*.distinct' => 'Các nhãn trong cùng sản phẩm không được trùng nhau.',
            'variants.required' => 'Sản phẩm cần có ít nhất một biến thể.',
            'variants.min' => 'Sản phẩm cần có ít nhất một biến thể.',
            'variants.*.sku.required' => 'Mỗi biến thể cần có SKU.',
            'variants.*.sku.distinct' => 'SKU biến thể không được trùng nhau.',
            'variants.*.sku.unique' => 'SKU biến thể đã được sử dụng.',
            'variants.*.price.required' => 'Vui lòng nhập giá biến thể.',
            'variants.*.price.integer' => 'Giá biến thể phải là số nguyên VND.',
            'variants.*.price.min' => 'Giá biến thể không được âm.',
            'variants.*.compare_at_price.integer' => 'Giá so sánh biến thể phải là số nguyên VND.',
            'variants.*.compare_at_price.min' => 'Giá so sánh biến thể không được âm.',
            'variants.*.initial_quantity.required' => 'Vui lòng nhập tồn khởi tạo.',
            'variants.*.initial_quantity.integer' => 'Tồn khởi tạo phải là số nguyên.',
            'variants.*.initial_quantity.min' => 'Tồn khởi tạo không được âm.',
        ];
    }
}
