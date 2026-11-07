<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreFaqHelpfulVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('visitor_id'))) {
            $this->merge(['visitor_id' => Str::lower(trim($this->input('visitor_id')))]);
        }
    }

    public function rules(): array
    {
        return [
            'visitor_id' => ['required', 'uuid'],
            'helpful' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'visitor_id.required' => 'Không xác định được phiên bình chọn. Hãy tải lại trang và thử lại.',
            'helpful.required' => 'Vui lòng chọn phản hồi cho câu trả lời.',
            'helpful.boolean' => 'Phản hồi không hợp lệ.',
        ];
    }
}
