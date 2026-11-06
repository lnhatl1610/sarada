<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListCatalogOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $sorts = match ($this->route('kind')) {
            'categories' => ['name', '-name', 'product_count', '-product_count', 'is_active', '-is_active'],
            'brands' => ['name', '-name', 'slug', '-slug', 'product_count', '-product_count', 'is_active', '-is_active'],
            'colors' => ['value', '-value', 'sort_order', '-sort_order', 'usage_count', '-usage_count'],
            'collections' => ['name', '-name', 'slug', '-slug', 'product_count', '-product_count', 'starts_at', '-starts_at', 'ends_at', '-ends_at', 'is_active', '-is_active'],
            default => [],
        };

        $rules = [
            'q' => ['sometimes', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];

        if ($this->route('kind') === 'categories') {
            $rules += [
                'parent_id' => ['sometimes', 'integer', Rule::exists('categories', 'id')],
                'root_only' => ['sometimes', 'boolean'],
                'has_products' => ['sometimes', 'boolean'],
            ];
        }

        if ($this->route('kind') === 'collections') {
            $rules += [
                'status' => ['sometimes', Rule::in(['running', 'upcoming', 'expired', 'disabled'])],
                'date_from' => ['sometimes', 'date'],
                'date_to' => ['sometimes', 'date', function (string $attribute, mixed $value, \Closure $fail): void {
                    $from = $this->input('date_from');
                    if (is_string($from) && strtotime((string) $value) < strtotime($from)) {
                        $fail('Ngày kết thúc không được trước ngày bắt đầu.');
                    }
                }],
            ];
        }

        if ($sorts !== []) {
            $rules['sort'] = ['sometimes', 'in:'.implode(',', $sorts)];
        }

        return $rules;
    }
}
