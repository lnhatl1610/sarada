<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RefundPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['reason' => trim((string) $this->input('reason'))]);
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Vui lòng nhập số tiền cần hoàn.',
            'amount.integer' => 'Số tiền hoàn phải là số nguyên VND.',
            'amount.min' => 'Số tiền hoàn tối thiểu là 1 VND.',
            'amount.max' => 'Số tiền hoàn vượt giới hạn cho phép.',
            'reason.required' => 'Vui lòng nhập lý do hoàn tiền.',
            'reason.min' => 'Lý do hoàn tiền cần có ít nhất 3 ký tự.',
            'reason.max' => 'Lý do hoàn tiền tối đa 1000 ký tự.',
        ];
    }
}
