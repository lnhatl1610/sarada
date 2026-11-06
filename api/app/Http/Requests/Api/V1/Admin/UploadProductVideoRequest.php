<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadProductVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimetypes:video/mp4,video/webm', 'mimes:mp4,webm', 'max:5120'],
            'caption' => ['nullable', 'string', 'max:255'],
            'color_value_id' => ['nullable', 'integer', Rule::exists('attribute_values', 'id')->where('attribute_id', Attribute::query()->where('type', 'color')->value('id'))],
        ];
    }
}
