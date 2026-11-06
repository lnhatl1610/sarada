<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['q' => ['required', 'string', 'min:2', 'max:120']];
    }

    public function messages(): array
    {
        return [
            'q.required' => 'Vui lòng nhập từ khóa tìm kiếm.',
            'q.min' => 'Từ khóa cần có ít nhất 2 ký tự.',
            'q.max' => 'Từ khóa không được vượt quá 120 ký tự.',
        ];
    }
}
