<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UploadAdminFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,mp4', 'max:5120']];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn tệp cần tải lên.',
            'file.file' => 'Tệp tải lên không hợp lệ.',
            'file.mimes' => 'Tệp phải là ảnh JPG, PNG, WebP hoặc video MP4.',
            'file.max' => 'Tệp không được vượt quá 5 MB.',
        ];
    }
}
