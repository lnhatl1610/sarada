<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_primary' => ['sometimes', 'boolean'],
            'color_value_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('attribute_values', 'id')->whereIn(
                    'attribute_id',
                    Attribute::query()->where('type', 'color')->pluck('id'),
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn ảnh cần tải lên.',
            'file.mimes' => 'Ảnh phải có định dạng JPG, PNG hoặc WebP.',
            'file.max' => 'Ảnh không được vượt quá 5 MB.',
        ];
    }
}
