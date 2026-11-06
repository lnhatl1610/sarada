<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:160'],
            'content' => ['nullable', 'string', 'max:5000', 'required_without:title'],
            'fit' => ['nullable', 'in:small,true_to_size,large'],
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048', 'dimensions:max_width=4000,max_height=4000'],
            'videos' => ['sometimes', 'array', 'max:1'],
            'videos.*' => ['file', 'mimetypes:video/mp4,video/webm', 'mimes:mp4,webm', 'max:5120'],
        ];
    }
}
