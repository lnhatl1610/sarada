<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderShipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'carrier' => ['nullable', 'string', 'max:50'],
            'tracking_code' => ['nullable', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'string', 'max:2048', 'url:https'],
            'status' => ['required', 'in:pending,picked_up,in_transit,delivered,failed,returned'],
        ];
    }

    public function messages(): array
    {
        return [
            'carrier.max' => 'Tên đơn vị vận chuyển không được vượt quá 50 ký tự.',
            'tracking_code.max' => 'Mã vận đơn không được vượt quá 100 ký tự.',
            'tracking_url.url' => 'Liên kết tra cứu phải là URL HTTPS hợp lệ.',
            'tracking_url.max' => 'Liên kết tra cứu không được vượt quá 2048 ký tự.',
            'status.required' => 'Vui lòng chọn trạng thái vận chuyển.',
            'status.in' => 'Trạng thái vận chuyển không hợp lệ.',
        ];
    }
}
