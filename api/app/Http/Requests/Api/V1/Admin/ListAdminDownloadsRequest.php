<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListAdminDownloadsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(['queued', 'running', 'ready', 'failed', 'expired'])],
            'type' => ['sometimes', Rule::in(['personal_data', 'scheduled_report', 'admin_customers', 'admin_products', 'admin_orders', 'admin_inventory', 'admin_activity', 'admin_report'])],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
