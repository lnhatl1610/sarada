<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AnswerProductQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAdminPermission('reviews.moderate') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:answered,hidden,pending'],
            'answer' => ['required_if:status,answered', 'nullable', 'string', 'min:2', 'max:4000'],
        ];
    }
}
