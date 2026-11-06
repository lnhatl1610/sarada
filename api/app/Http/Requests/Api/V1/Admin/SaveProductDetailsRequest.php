<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class SaveProductDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product)],
            'sku' => ['sometimes', 'nullable', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product)],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['sometimes', 'nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string'],
            'material' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fit' => ['sometimes', 'nullable', 'string', 'max:80'],
            'care_instruction' => ['sometimes', 'nullable', 'string', 'max:500'],
            'target_gender' => ['sometimes', Rule::in(['men', 'women', 'unisex', 'kids'])],
            'base_price' => ['sometimes', 'integer', 'min:0'],
            'compare_at_price' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'sale_starts_at' => ['sometimes', 'nullable', 'date'],
            'sale_ends_at' => ['sometimes', 'nullable', 'date'],
            'thumbnail' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'hidden'])],
            'is_featured' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'tags' => ['sometimes', 'array', 'max:20'],
            'tags.*' => ['required', 'string', 'max:50', 'distinct:ignore_case'],
            'collection_ids' => ['sometimes', 'array'],
            'collection_ids.*' => ['integer', 'distinct', 'exists:collections,id'],
            'variants' => ['sometimes', 'array', 'max:100'],
            'variants.*.id' => ['nullable', 'integer', 'distinct', 'exists:product_variants,id'],
            'variants.*.sku' => ['required', 'string', 'max:100'],
            'variants.*.barcode' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['required', 'integer', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'integer', 'min:0'],
            'variants.*.color_value_id' => ['nullable', 'integer', Rule::exists('attribute_values', 'id')->where('attribute_id', Attribute::query()->where('type', 'color')->value('id'))],
            'variants.*.size_value_id' => ['nullable', 'integer', Rule::exists('attribute_values', 'id')->where('attribute_id', Attribute::query()->where('type', 'size')->value('id'))],
            'variants.*.weight_gram' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_active' => ['required', 'boolean'],
            'variants.*.initial_quantity' => ['sometimes', 'integer', 'min:0'],
            'images' => ['sometimes', 'array', 'max:100'],
            'images.*.id' => ['required', 'integer', 'distinct'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['required', 'integer', 'min:0'],
            'images.*.is_primary' => ['required', 'boolean'],
            'images.*.color_value_id' => [
                'nullable', 'integer',
                Rule::exists('attribute_values', 'id')->whereIn(
                    'attribute_id',
                    Attribute::query()->where('type', 'color')->pluck('id'),
                ),
            ],
            'images.*.is_360_frame' => ['sometimes', 'boolean'],
            'delete_image_ids' => ['sometimes', 'array', 'max:100'],
            'delete_image_ids.*' => ['integer', 'distinct'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->has('sale_starts_at') || $validator->errors()->has('sale_ends_at')) {
                return;
            }

            $product = $this->route('product');
            $current = is_numeric($product)
                ? Product::query()->select(['id', 'sale_starts_at', 'sale_ends_at'])->find($product)
                : null;
            $start = $this->exists('sale_starts_at') ? $this->input('sale_starts_at') : $current?->sale_starts_at;
            $end = $this->exists('sale_ends_at') ? $this->input('sale_ends_at') : $current?->sale_ends_at;

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
            'status.in' => 'Trạng thái sản phẩm phải là bản nháp, đang bán hoặc ẩn.',
            'sale_starts_at.date' => 'Thời điểm bắt đầu khuyến mãi không hợp lệ.',
            'sale_ends_at.date' => 'Thời điểm kết thúc khuyến mãi không hợp lệ.',
            'tags.array' => 'Danh sách nhãn sản phẩm không hợp lệ.',
            'tags.max' => 'Mỗi sản phẩm có tối đa 20 nhãn.',
            'tags.*.required' => 'Tên nhãn không được để trống.',
            'tags.*.string' => 'Tên nhãn phải là văn bản.',
            'tags.*.max' => 'Mỗi nhãn không được vượt quá 50 ký tự.',
            'tags.*.distinct' => 'Các nhãn trong cùng sản phẩm không được trùng nhau.',
            'images.array' => 'Danh sách ảnh sản phẩm không hợp lệ.',
            'images.max' => 'Sản phẩm có tối đa 100 ảnh.',
            'images.*.id.required' => 'Thiếu mã ảnh sản phẩm.',
            'images.*.id.distinct' => 'Mỗi ảnh chỉ được xuất hiện một lần trong danh sách.',
            'images.*.sort_order.required' => 'Thiếu thứ tự của ảnh sản phẩm.',
            'images.*.is_primary.required' => 'Thiếu trạng thái ảnh chính.',
            'images.*.is_primary.boolean' => 'Trạng thái ảnh chính không hợp lệ.',
            'delete_image_ids.array' => 'Danh sách ảnh cần xóa không hợp lệ.',
            'delete_image_ids.*.distinct' => 'Mỗi ảnh chỉ được xóa một lần.',
        ];
    }
}
