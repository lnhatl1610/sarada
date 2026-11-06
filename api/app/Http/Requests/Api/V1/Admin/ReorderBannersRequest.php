<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderBannersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'position' => ['required', Rule::in(['home_hero', 'home_mid', 'hero', 'hero-mobile', 'campaign', 'category', 'popup'])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', Rule::exists('banners', 'id')->where('position', $this->input('position'))],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Vui lòng gửi thứ tự banner.',
            'ids.min' => 'Cần ít nhất một banner để sắp xếp.',
            'position.required' => 'Vui lòng chọn vị trí banner cần sắp xếp.',
            'position.in' => 'Vị trí banner không hợp lệ.',
            'ids.max' => 'Mỗi nhóm chỉ hỗ trợ sắp xếp tối đa 100 banner một lần.',
            'ids.*.distinct' => 'Danh sách có banner bị lặp.',
            'ids.*.exists' => 'Một hoặc nhiều banner không còn tồn tại.',
        ];
    }
}
