<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ImportInventoryCsvRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'preview' => ['sometimes', 'in:0,1,true,false'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn tệp CSV.',
            'file.file' => 'Tệp tải lên không hợp lệ.',
            'file.mimes' => 'Tệp phải có định dạng CSV hoặc TXT.',
            'file.max' => 'Tệp không được vượt quá 2 MB.',
        ];
    }
}
