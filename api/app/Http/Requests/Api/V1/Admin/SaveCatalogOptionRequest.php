<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCatalogOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $kind = $this->route('kind');
        $id = $this->route('option');
        $required = $id === null ? 'required' : 'sometimes';
        $slugTable = match ($kind) {
            'categories' => 'categories',
            'brands' => 'brands',
            'collections' => 'collections',
            default => null,
        };

        if ($slugTable !== null) {
            return [
                'name' => [$required, 'string', 'max:255'],
                'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique($slugTable, 'slug')->ignore($id)],
                'is_active' => ['sometimes', 'boolean'],
                ...($kind === 'categories' ? [
                    'parent_id' => ['sometimes', 'nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
                    'image' => ['sometimes', 'nullable', 'string', 'max:500'],
                    'image_alt' => ['sometimes', 'nullable', 'required_with:image', 'string', 'max:255'],
                    'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
                    'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
                    'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
                    'sort_order' => ['sometimes', 'integer', 'min:0'],
                ] : []),
                ...($kind === 'brands' ? ['logo' => ['sometimes', 'nullable', 'string', 'max:500']] : []),
                ...($kind === 'brands' ? [
                    'banner' => ['sometimes', 'nullable', 'string', 'max:500'],
                    'banner_alt' => ['sometimes', 'nullable', 'required_with:banner', 'string', 'max:255'],
                    'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
                    'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
                    'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
                ] : []),
                ...($kind === 'collections' ? [
                    'is_lookbook' => ['sometimes', 'boolean'],
                    'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
                    'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
                    'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
                    'banner' => ['nullable', 'required_if:is_lookbook,true', 'string', 'max:500'],
                    'banner_alt' => ['sometimes', 'nullable', 'required_with:banner', 'string', 'max:255'],
                    'starts_at' => ['sometimes', 'nullable', 'date'],
                    'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
                ] : []),
            ];
        }

        $attributeType = $kind === 'colors' ? 'color' : 'size';
        $groupName = $kind === 'sizes' ? $this->input('group') : null;
        $attributeId = is_string($groupName) && $groupName !== ''
            ? Attribute::query()->where('name', $groupName)->where('type', $attributeType)->value('id')
            : ($id !== null ? AttributeValue::query()->whereKey($id)->value('attribute_id') : Attribute::query()->where('type', $attributeType)->value('id'));

        return [
            'value' => [$required, 'string', 'max:100', Rule::unique('attribute_values', 'value')->where('attribute_id', $attributeId)->ignore($id)],
            'group' => $kind === 'sizes' ? ['sometimes', 'required', 'string', 'max:255'] : ['prohibited'],
            'color_hex' => ['sometimes', 'nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
