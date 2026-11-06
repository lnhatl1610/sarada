<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListAdminOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:pending,confirmed,processing,shipping,delivery_failed,delivered,returned,completed,cancelled'],
            'queue' => ['sometimes', 'in:overdue,cancel_return'],
            'payment_status' => ['sometimes', 'in:unpaid,paid,failed,refunded'],
            'payment_method' => ['sometimes', 'string', 'max:32'],
            'shipping_method_id' => ['sometimes', 'integer', 'exists:shipping_methods,id'],
            'shipping_method_ids' => ['sometimes', 'string', 'regex:/^\d+(,\d+)*$/'],
            'has_coupon' => ['sometimes', 'boolean'],
            'coupon_code' => ['sometimes', 'string', 'max:64'],
            'province_code' => ['sometimes', 'string', 'max:32'],
            'province_codes' => ['sometimes', 'string', 'regex:/^[A-Za-z0-9_-]+(,[A-Za-z0-9_-]+)*$/', 'max:640'],
            'has_note' => ['sometimes', 'boolean'],
            'q' => ['sometimes', 'string', 'max:120'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'min_total' => ['sometimes', 'integer', 'min:0'],
            'max_total' => ['sometimes', 'integer', 'min:0', 'gte:min_total'],
            'sort' => ['sometimes', 'in:placed_at,-placed_at,grand_total,-grand_total'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function attributes(): array
    {
        return [
            'status' => 'trạng thái đơn hàng',
            'queue' => 'hàng đợi đơn hàng',
            'payment_status' => 'trạng thái thanh toán',
            'payment_method' => 'phương thức thanh toán',
            'shipping_method_id' => 'phương thức vận chuyển',
            'shipping_method_ids' => 'các phương thức vận chuyển',
            'has_coupon' => 'bộ lọc mã giảm giá',
            'coupon_code' => 'mã giảm giá',
            'province_code' => 'mã tỉnh/thành',
            'province_codes' => 'các mã tỉnh/thành',
            'has_note' => 'bộ lọc ghi chú',
            'q' => 'từ khóa',
            'from' => 'ngày bắt đầu',
            'to' => 'ngày kết thúc',
            'min_total' => 'tổng tiền tối thiểu',
            'max_total' => 'tổng tiền tối đa',
            'sort' => 'thứ tự sắp xếp',
            'per_page' => 'số dòng mỗi trang',
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Trạng thái đơn hàng không hợp lệ.',
            'queue.in' => 'Hàng đợi đơn hàng không hợp lệ.',
            'payment_status.in' => 'Trạng thái thanh toán không hợp lệ.',
            'payment_method.string' => 'Phương thức thanh toán không hợp lệ.',
            'shipping_method_id.integer' => 'Phương thức vận chuyển không hợp lệ.',
            'shipping_method_id.exists' => 'Phương thức vận chuyển đã chọn không tồn tại.',
            'shipping_method_ids.regex' => 'Danh sách phương thức vận chuyển không hợp lệ.',
            'has_coupon.boolean' => 'Bộ lọc mã giảm giá không hợp lệ.',
            'coupon_code.max' => 'Mã giảm giá không được dài quá 64 ký tự.',
            'province_codes.regex' => 'Danh sách tỉnh/thành không hợp lệ.',
            'province_codes.max' => 'Danh sách tỉnh/thành quá dài.',
            'has_note.boolean' => 'Bộ lọc ghi chú không hợp lệ.',
            'q.max' => 'Từ khóa không được dài quá 120 ký tự.',
            'from.date' => 'Ngày bắt đầu không hợp lệ.',
            'to.date' => 'Ngày kết thúc không hợp lệ.',
            'to.after_or_equal' => 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
            'min_total.integer' => 'Tổng tiền tối thiểu phải là số nguyên.',
            'min_total.min' => 'Tổng tiền tối thiểu không được âm.',
            'max_total.integer' => 'Tổng tiền tối đa phải là số nguyên.',
            'max_total.min' => 'Tổng tiền tối đa không được âm.',
            'max_total.gte' => 'Tổng tiền tối đa phải lớn hơn hoặc bằng tổng tiền tối thiểu.',
            'sort.in' => 'Thứ tự sắp xếp không hợp lệ.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang ít nhất là 1.',
            'per_page.max' => 'Số dòng mỗi trang không được vượt quá 100.',
        ];
    }
}
