<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListProductQuestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAdminPermission('reviews.moderate') ?? false;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:160'],
            'status' => ['sometimes', 'in:pending,answered,hidden'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,20,50,100'],
        ];
    }
}
