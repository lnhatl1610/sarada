<?php

namespace App\Http\Requests\Api\V1\Admin;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DashboardSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $today = Carbon::today($this->userTimezone())->toDateString();

        return [
            'days' => ['sometimes', 'integer', 'in:7,30,90'],
            'from' => ['required_with:to', 'date', 'before_or_equal:'.$today],
            'to' => ['required_with:from', 'date', 'after_or_equal:from', 'before_or_equal:'.$today],
        ];
    }

    private function userTimezone(): string
    {
        $timezone = $this->user()?->timezone;
        if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
            return $timezone;
        }

        $applicationTimezone = (string) config('app.timezone', 'UTC');

        return in_array($applicationTimezone, timezone_identifiers_list(), true) ? $applicationTimezone : 'UTC';
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('from') || $validator->errors()->has('to')) {
                return;
            }

            if ($this->filled('from') && $this->filled('days')) {
                $validator->errors()->add('days', 'Chọn số ngày hoặc khoảng ngày, không gửi cả hai.');

                return;
            }

            if ($this->filled('from') && Carbon::parse($this->input('from'))->startOfDay()->diffInDays(Carbon::parse($this->input('to'))->startOfDay()) + 1 > 366) {
                $validator->errors()->add('to', 'Khoảng ngày tùy chọn không được vượt quá 366 ngày.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'days.integer' => 'Khoảng thời gian phải là số ngày hợp lệ.',
            'days.in' => 'Khoảng thời gian chỉ nhận 7, 30 hoặc 90 ngày.',
            'from.required_with' => 'Cần chọn ngày bắt đầu và ngày kết thúc cùng lúc.',
            'from.before_or_equal' => 'Ngày bắt đầu không được ở tương lai.',
            'from.date' => 'Ngày bắt đầu không hợp lệ.',
            'to.required_with' => 'Cần chọn ngày bắt đầu và ngày kết thúc cùng lúc.',
            'to.date' => 'Ngày kết thúc không hợp lệ.',
            'to.after_or_equal' => 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
            'to.before_or_equal' => 'Ngày kết thúc không được ở tương lai.',
        ];
    }
}
