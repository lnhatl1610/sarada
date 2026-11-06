<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\PageContentSanitizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $pageId = $this->route('page');

        return [
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['required', 'string', 'max:180', 'alpha_dash:ascii', Rule::unique('pages', 'slug')->ignore($pageId)],
            'content' => ['required', 'string', 'max:200000'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_published' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('content') || ! is_string($this->input('content'))) {
            return;
        }

        $content = PageContentSanitizer::sanitize($this->input('content'));
        if (trim(html_entity_decode(strip_tags($content), ENT_QUOTES | ENT_HTML5, 'UTF-8')) === '') {
            $content = '';
        }

        $this->merge(['content' => $content]);
    }
}
