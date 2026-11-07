<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\VietnamAddressCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveStoreLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'address' => ['required', 'string', 'min:5', 'max:500'],
            'province_code' => ['required', 'string', 'max:32'],
            'province_name' => ['required', 'string', 'max:150'],
            'ward_code' => ['nullable', 'string', 'max:32'],
            'ward_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email:filter', 'max:254'],
            'opening_hours' => ['required', 'string', 'min:3', 'max:2000'],
            'opening_schedule' => ['sometimes', 'nullable', 'array', 'max:7'],
            'opening_schedule.*.day' => ['required', 'integer', 'between:0,6', 'distinct'],
            'opening_schedule.*.opens_at' => ['required', 'date_format:H:i'],
            'opening_schedule.*.closes_at' => ['required', 'date_format:H:i'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $provinceCode = $this->input('province_code');
        if (is_string($provinceCode)) {
            $province = app(VietnamAddressCatalog::class)->province($provinceCode);
            if ($province) {
                $this->merge(['province_name' => $province['name']]);
                $wardCode = $this->input('ward_code');
                if (is_string($wardCode) && $wardCode !== '') {
                    $ward = app(VietnamAddressCatalog::class)->ward($provinceCode, $wardCode);
                    if ($ward) {
                        $this->merge(['ward_name' => $ward['name']]);
                    }
                }
            }
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $provinceCode = (string) $this->input('province_code', '');
            if ($provinceCode !== '' && app(VietnamAddressCatalog::class)->province($provinceCode) === null) {
                $validator->errors()->add('province_code', 'Tỉnh/thành không hợp lệ.');
            }

            $wardCode = $this->input('ward_code');
            if (filled($wardCode) && ! app(VietnamAddressCatalog::class)->ward($provinceCode, (string) $wardCode)) {
                $validator->errors()->add('ward_code', 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.');
            }

            foreach ((array) $this->input('opening_schedule', []) as $index => $schedule) {
                if (! is_array($schedule)) {
                    continue;
                }

                $opensAt = $schedule['opens_at'] ?? null;
                $closesAt = $schedule['closes_at'] ?? null;
                if (is_string($opensAt) && is_string($closesAt)
                    && preg_match('/^\d{2}:\d{2}$/', $opensAt)
                    && preg_match('/^\d{2}:\d{2}$/', $closesAt)
                    && $closesAt <= $opensAt) {
                    $validator->errors()->add("opening_schedule.{$index}.closes_at", 'Giờ đóng cửa phải sau giờ mở cửa.');
                }
            }
        });
    }
}
