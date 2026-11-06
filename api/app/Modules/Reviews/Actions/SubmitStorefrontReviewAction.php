<?php

namespace App\Modules\Reviews\Actions;

use App\Models\OrderItem;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class SubmitStorefrontReviewAction
{
    /** @param array<int, UploadedFile> $images @param array<int, UploadedFile> $videos */
    public function __invoke(User $user, array $data, array $images = [], array $videos = []): Review
    {
        $storedPaths = [];

        try {
            return DB::transaction(function () use ($user, $data, $images, $videos, &$storedPaths): Review {
                $item = OrderItem::query()->with('order')->whereKey($data['order_item_id'])
                    ->whereHas('order', fn ($query) => $query->where('user_id', $user->id)->whereIn('status', ['delivered', 'completed']))
                    ->lockForUpdate()->first();
                if (! $item) {
                    throw ValidationException::withMessages(['order_item_id' => 'Chỉ có thể đánh giá sản phẩm trong đơn hàng đã giao thành công của bạn.']);
                }
                if (Review::query()->where('user_id', $user->id)->where('order_item_id', $item->id)->exists()) {
                    throw ValidationException::withMessages(['order_item_id' => 'Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng.']);
                }

                $review = Review::query()->create([
                    'order_item_id' => $item->id,
                    'rating' => $data['rating'],
                    'title' => $data['title'] ?? null,
                    'content' => $data['content'] ?? null,
                    'fit' => $data['fit'] ?? null,
                    'product_id' => $item->product_id,
                    'user_id' => $user->id,
                    'status' => 'pending',
                ]);

                foreach ($images as $image) {
                    $path = $image->storePublicly("reviews/{$review->id}", 'public');
                    if ($path === false) {
                        throw new \RuntimeException('Không thể lưu ảnh đánh giá.');
                    }
                    $storedPaths[] = $path;
                    $review->images()->create(['url' => Storage::disk('public')->url($path), 'media_type' => 'image']);
                }

                foreach ($videos as $video) {
                    $path = $video->storePublicly("reviews/{$review->id}", 'public');
                    if ($path === false) {
                        throw new \RuntimeException('Không thể lưu video đánh giá.');
                    }
                    $storedPaths[] = $path;
                    $review->images()->create(['url' => Storage::disk('public')->url($path), 'media_type' => 'video']);
                }

                return $review->load(['user:id,name', 'product:id,name']);
            });
        } catch (Throwable $exception) {
            if ($storedPaths !== []) {
                Storage::disk('public')->delete($storedPaths);
            }

            throw $exception;
        }
    }
}
