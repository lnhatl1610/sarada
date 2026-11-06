<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['note' => ['required', 'string', 'min:3', 'max:2000']];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Vui lòng nhập ghi chú nội bộ.',
            'note.min' => 'Ghi chú cần có ít nhất 3 ký tự.',
            'note.max' => 'Ghi chú không được vượt quá 2000 ký tự.',
        ];
    }
}
