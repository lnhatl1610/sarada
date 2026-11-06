<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListAdminReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:pending,approved,rejected'],
            'q' => ['sometimes', 'string', 'max:120'],
            'rating' => ['sometimes', 'integer', 'between:1,5'],
            'has_images' => ['sometimes', 'boolean'],
            'verified_purchase' => ['sometimes', 'boolean'],
            'fit' => ['sometimes', 'in:small,true_to_size,large'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'sort' => ['sometimes', 'in:created_at,-created_at,rating,-rating,title,-title,content,-content,product_name,-product_name,customer_name,-customer_name,images_count,-images_count,media_count,-media_count,verified_purchase,-verified_purchase,status,-status'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Trạng thái đánh giá không hợp lệ.',
            'q.max' => 'Từ khóa không được vượt quá 120 ký tự.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang tối thiểu là 1.',
            'per_page.max' => 'Số dòng mỗi trang tối đa là 100.',
        ];
    }
}
