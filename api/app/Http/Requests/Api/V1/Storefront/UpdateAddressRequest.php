<?php

namespace App\Http\Requests\Api\V1\Storefront;

use App\Support\VietnamAddressCatalog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:160'],
            'phone' => ['required', 'regex:/^(0|\+84)\d{9}$/'],
            'province_code' => ['required', 'string', 'max:32'],
            'district_code' => ['nullable', 'string', 'max:32'],
            'ward_code' => ['required', 'string', 'max:32'],
            'street' => ['required', 'string', 'max:255'],
            'label' => ['sometimes', 'string', 'in:home,company,other'],
            'is_default' => ['sometimes', 'boolean'],
            'is_default_billing' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('district_code')) {
                return;
            }

            $catalog = app(VietnamAddressCatalog::class);
            $provinceCode = (string) $this->input('province_code', '');
            $wardCode = (string) $this->input('ward_code', '');

            if (! $catalog->province($provinceCode)) {
                $validator->errors()->add('province_code', 'Vui lòng chọn tỉnh/thành phố hợp lệ.');

                return;
            }

            if (! $catalog->ward($provinceCode, $wardCode)) {
                $validator->errors()->add('ward_code', 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.');
            }
        });
    }

    public function messages(): array
    {
        return ['recipient_name.required' => 'Vui lòng nhập tên người nhận.', 'phone.required' => 'Vui lòng nhập số điện thoại.', 'phone.regex' => 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.', 'province_code.required' => 'Vui lòng chọn tỉnh/thành phố.', 'ward_code.required' => 'Vui lòng chọn xã/phường.', 'street.required' => 'Vui lòng nhập địa chỉ cụ thể.'];
    }
}
