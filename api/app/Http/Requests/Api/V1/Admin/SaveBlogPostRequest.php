<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\PageContentSanitizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveBlogPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $postId = $this->route('post');

        return [
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['required', 'string', 'max:180', 'alpha_dash:ascii', Rule::unique('blog_posts', 'slug')->ignore($postId)],
            'category_name' => ['required', 'string', 'max:100'],
            'excerpt' => ['required', 'string', 'max:500'],
            'author_name' => ['nullable', 'string', 'max:120', 'required_with:author_bio'],
            'author_bio' => ['nullable', 'string', 'max:500'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'cover_alt' => ['nullable', 'string', 'max:180', 'required_with:cover_image'],
            'content' => ['required', 'string', 'max:200000'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_published' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'product_ids' => ['sometimes', 'array', 'max:12'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'tags' => ['sometimes', 'array', 'max:8'],
            'tags.*' => ['required', 'string', 'max:50', 'regex:/[\pL\pN]/u', 'distinct:ignore_case'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('content') && is_string($this->input('content'))) {
            $this->merge(['content' => PageContentSanitizer::sanitize($this->input('content'))]);
        }
    }
}
