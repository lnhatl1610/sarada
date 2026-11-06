<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class UploadAccountAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']];
    }

    public function messages(): array
    {
        return ['avatar.required' => 'Vui lòng chọn ảnh đại diện.', 'avatar.image' => 'Tệp tải lên phải là ảnh.', 'avatar.mimes' => 'Ảnh phải có định dạng JPG, PNG hoặc WebP.', 'avatar.max' => 'Ảnh không được vượt quá 2 MB.'];
    }
}
