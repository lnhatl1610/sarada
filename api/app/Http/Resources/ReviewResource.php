<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'order_item_id' => $this->order_item_id,
            'rating' => $this->rating,
            'title' => $this->title,
            'content' => $this->content,
            'fit' => $this->fit,
            'purchased_variant' => $this->whenLoaded('orderItem', fn (): ?string => $this->orderItem?->variant_name),
            'purchased_size' => $this->whenLoaded('orderItem', function (): ?string {
                $variant = $this->orderItem?->relationLoaded('variant') ? $this->orderItem->variant : null;

                return $variant?->relationLoaded('size') ? $variant->size?->value : null;
            }),
            'status' => $this->status,
            'moderation_reason' => $this->moderation_reason,
            'store_response' => $this->status === 'approved' ? $this->store_response : null,
            'helpful_count' => (int) ($this->helpful_votes_count ?? 0),
            'verified_purchase' => $this->order_item_id !== null,
            'image_count' => $this->when(isset($this->images_count), (int) $this->images_count),
            'media_count' => $this->when(isset($this->media_count), (int) $this->media_count),
            'created_at' => $this->created_at,
            'customer' => $this->whenLoaded('user', fn (): array => [
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'product' => $this->whenLoaded('product', fn (): array => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'images' => $this->whenLoaded('images', fn (): array => $this->images->map(function ($image): array {
                $imagePath = (string) parse_url((string) $image->url, PHP_URL_PATH);
                $isDemoReviewImage = str_contains($imagePath, '/reviews/demo-');

                return [
                    'id' => $image->id,
                    'url' => $image->url,
                    'media_type' => $image->media_type ?? 'image',
                    'alt' => ($image->media_type ?? 'image') === 'video'
                        ? 'Video khách hàng đính kèm đánh giá'.($this->product?->name ? ' sản phẩm '.$this->product->name : '')
                        : ($isDemoReviewImage
                        ? 'Ảnh AI demo: ảnh minh họa cho dữ liệu đánh giá thử nghiệm, không phải ảnh khách hàng gửi.'
                        : 'Ảnh khách hàng gửi kèm đánh giá'.($this->product?->name ? ' sản phẩm '.$this->product->name : '')),
                ];
            })->all()),
            'order' => $this->whenLoaded('orderItem', fn (): ?array => $this->orderItem?->relationLoaded('order') && $this->orderItem->order ? [
                'id' => $this->orderItem->order->id,
                'code' => $this->orderItem->order->code,
            ] : null),
        ];
    }
}
