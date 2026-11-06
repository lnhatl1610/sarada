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
            'ward_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email:filter', 'max:254'],
            'opening_hours' => ['required', 'string', 'min:3', 'max:2000'],
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
        });
    }
}
