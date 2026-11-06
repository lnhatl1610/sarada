<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkModerateReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'review_ids' => ['required', 'array', 'min:1', 'max:100'],
            'review_ids.*' => ['integer', 'distinct', 'exists:reviews,id'],
            'status' => ['required', 'in:approved,rejected'],
            'reason' => ['required_if:status,rejected', 'nullable', 'string', 'min:3', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'review_ids.required' => 'Vui lòng chọn ít nhất một đánh giá.',
            'review_ids.min' => 'Vui lòng chọn ít nhất một đánh giá.',
            'review_ids.max' => 'Chỉ có thể xử lý tối đa 100 đánh giá cùng lúc.',
            'review_ids.*.distinct' => 'Danh sách có đánh giá bị lặp.',
            'review_ids.*.exists' => 'Một hoặc nhiều đánh giá không còn tồn tại.',
            'status.required' => 'Vui lòng chọn kết quả kiểm duyệt.',
            'status.in' => 'Kết quả kiểm duyệt không hợp lệ.',
        ];
    }
}
