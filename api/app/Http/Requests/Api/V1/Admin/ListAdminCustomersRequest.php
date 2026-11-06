<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListAdminCustomersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'in:active,blocked'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'min_spent' => ['sometimes', 'integer', 'min:0'],
            'max_spent' => ['sometimes', 'integer', 'min:0', 'gte:min_spent'],
            'min_orders' => ['sometimes', 'integer', 'min:0'],
            'max_orders' => ['sometimes', 'integer', 'min:0', 'gte:min_orders'],
            'last_order_from' => ['sometimes', 'date'],
            'last_order_to' => ['sometimes', 'date', 'after_or_equal:last_order_from'],
            'province_code' => ['sometimes', 'string', 'max:32'],
            'gender' => ['sometimes', 'in:male,female,other'],
            'email_verified' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'in:name,-name,email,-email,orders_count,-orders_count,delivered_total,-delivered_total,status,-status,created_at,-created_at,last_order_at,-last_order_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'q.max' => 'Từ khóa không được vượt quá 120 ký tự.',
            'status.in' => 'Trạng thái tài khoản không hợp lệ.',
            'from.date' => 'Ngày bắt đầu không hợp lệ.',
            'to.date' => 'Ngày kết thúc không hợp lệ.',
            'to.after_or_equal' => 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
            'min_spent.integer' => 'Chi tiêu tối thiểu phải là số nguyên VND.',
            'min_spent.min' => 'Chi tiêu tối thiểu không được âm.',
            'max_spent.integer' => 'Chi tiêu tối đa phải là số nguyên VND.',
            'max_spent.min' => 'Chi tiêu tối đa không được âm.',
            'max_spent.gte' => 'Chi tiêu tối đa phải bằng hoặc lớn hơn mức tối thiểu.',
            'min_orders.integer' => 'Số đơn tối thiểu phải là số nguyên.',
            'min_orders.min' => 'Số đơn tối thiểu không được âm.',
            'max_orders.integer' => 'Số đơn tối đa phải là số nguyên.',
            'max_orders.min' => 'Số đơn tối đa không được âm.',
            'max_orders.gte' => 'Số đơn tối đa phải bằng hoặc lớn hơn số đơn tối thiểu.',
            'last_order_from.date' => 'Ngày mua gần nhất bắt đầu không hợp lệ.',
            'last_order_to.date' => 'Ngày mua gần nhất kết thúc không hợp lệ.',
            'last_order_to.after_or_equal' => 'Ngày mua gần nhất kết thúc phải bằng hoặc sau ngày bắt đầu.',
            'province_code.max' => 'Mã tỉnh/thành không được vượt quá 32 ký tự.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang tối thiểu là 1.',
            'per_page.max' => 'Số dòng mỗi trang tối đa là 100.',
            'sort.in' => 'Thứ tự sắp xếp khách hàng không hợp lệ.',
        ];
    }
}
