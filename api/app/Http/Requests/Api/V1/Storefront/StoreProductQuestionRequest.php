<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['question' => ['required', 'string', 'min:8', 'max:2000']];
    }

    public function messages(): array
    {
        return ['question.required' => 'Vui lòng nhập câu hỏi.', 'question.min' => 'Câu hỏi cần có ít nhất 8 ký tự.', 'question.max' => 'Câu hỏi không được quá 2.000 ký tự.'];
    }
}
