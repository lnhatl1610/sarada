<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\BulkModerateReviewsRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminReviewsRequest;
use App\Http\Requests\Api\V1\Admin\ModerateReviewRequest;
use App\Http\Requests\Api\V1\Admin\SaveReviewResponseRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(ListAdminReviewsRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $query = Review::query()
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search
                ->where('title', 'like', '%'.$filters['q'].'%')
                ->orWhere('content', 'like', '%'.$filters['q'].'%')
                ->orWhereHas('product', fn ($product) => $product->where('name', 'like', '%'.$filters['q'].'%'))
                ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%'.$filters['q'].'%'))))
            ->when(isset($filters['rating']), fn ($query) => $query->where('rating', $filters['rating']))
            ->when(isset($filters['has_images']), fn ($query) => $filters['has_images'] ? $query->whereHas('images', fn ($media) => $media->where('media_type', 'image')) : $query->whereDoesntHave('images', fn ($media) => $media->where('media_type', 'image')))
            ->when(isset($filters['verified_purchase']), fn ($query) => $filters['verified_purchase'] ? $query->whereNotNull('order_item_id') : $query->whereNull('order_item_id'))
            ->when(isset($filters['fit']), fn ($query) => $query->where('fit', $filters['fit']))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate('created_at', '<=', $filters['to']));
        $statusCounts = array_replace(['pending' => 0, 'approved' => 0, 'rejected' => 0], (clone $query)
            ->select('status')->selectRaw('COUNT(*) as review_count')->groupBy('status')->pluck('review_count', 'status')
            ->map(static fn ($count): int => (int) $count)->all());
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $direction = $descending ? 'desc' : 'asc';
        $reviews = (clone $query)->with(['user:id,name,email', 'product:id,name,slug'])->withCount([
            'images' => fn ($media) => $media->where('media_type', 'image'),
            'images as media_count',
            'helpfulVotes',
        ])
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->when($field === 'product_name', fn ($query) => $query->orderBy(
                DB::table('products')->select('name')->whereColumn('products.id', 'reviews.product_id'), $direction,
            ))
            ->when($field === 'customer_name', fn ($query) => $query->orderBy(
                DB::table('users')->select('name')->whereColumn('users.id', 'reviews.user_id'), $direction,
            ))
            ->orderBy(match ($field) {
                'rating' => 'reviews.rating',
                'title' => 'reviews.title',
                'content' => 'reviews.content',
                'images_count' => 'images_count',
                'media_count' => 'media_count',
                'verified_purchase' => 'reviews.order_item_id',
                'status' => 'reviews.status',
                default => 'reviews.created_at',
            }, $direction)
            ->orderByDesc('reviews.id')
            ->paginate($filters['per_page'] ?? 30);

        return ReviewResource::collection($reviews)->additional(['status_counts' => $statusCounts]);
    }

    public function show(Review $review): JsonResponse
    {
        return response()->json(['data' => new ReviewResource($review->load(['user:id,name,email', 'product:id,name,slug', 'images', 'orderItem.order'])->loadCount(['images as media_count', 'helpfulVotes']))]);
    }

    public function bulkModerate(BulkModerateReviewsRequest $request): JsonResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($data, $request): void {
            foreach ($data['review_ids'] as $reviewId) {
                $review = Review::query()->whereKey($reviewId)->lockForUpdate()->firstOrFail();
                $previousStatus = $review->status;
                $review->update([
                    'status' => $data['status'],
                    'moderation_reason' => $data['status'] === 'rejected' ? $data['reason'] : null,
                    'store_response' => $data['status'] === 'rejected' ? null : $review->store_response,
                ]);
                $this->recordApproval($request, (int) $review->id, $previousStatus, $data['status']);
                $this->recalculateProduct($review->product()->lockForUpdate()->firstOrFail());
            }
        });

        return response()->json(['data' => ['updated_ids' => $data['review_ids'], 'count' => count($data['review_ids'])]]);
    }

    public function moderate(ModerateReviewRequest $request, Review $review): JsonResponse
    {
        $review = DB::transaction(function () use ($request, $review): Review {
            $lockedReview = Review::query()->whereKey($review->id)->lockForUpdate()->firstOrFail();
            $data = $request->validated();
            $previousStatus = $lockedReview->status;
            $lockedReview->update([
                'status' => $data['status'],
                'moderation_reason' => $data['status'] === 'rejected' ? $data['reason'] : null,
                'store_response' => $data['status'] === 'rejected' ? null : $lockedReview->store_response,
            ]);
            $this->recordApproval($request, (int) $lockedReview->id, $previousStatus, $data['status']);
            $product = $lockedReview->product()->lockForUpdate()->firstOrFail();
            $this->recalculateProduct($product);

            return $lockedReview->load(['user:id,name,email', 'product:id,name,slug', 'images', 'orderItem.order'])->loadCount('helpfulVotes');
        });

        return response()->json(['data' => new ReviewResource($review)]);
    }

    public function saveResponse(SaveReviewResponseRequest $request, Review $review): JsonResponse
    {
        $data = $request->validated();
        $review = DB::transaction(function () use ($request, $review, $data): Review {
            $lockedReview = Review::query()->whereKey($review->id)->lockForUpdate()->firstOrFail();
            if ($lockedReview->status !== 'approved') {
                throw ValidationException::withMessages(['review' => 'Chỉ có thể phản hồi đánh giá đã được duyệt.']);
            }

            $lockedReview->update(['store_response' => $data['response']]);
            DB::table('activity_logs')->insert([
                'user_id' => $request->user()->id,
                'module' => 'reviews',
                'action' => 'UPDATE',
                'path' => 'api/v1/admin/reviews/'.$lockedReview->id.'/response',
                'changes' => json_encode(['review_id' => $lockedReview->id, 'store_response_updated' => true], JSON_THROW_ON_ERROR),
                'ip' => $request->ip(),
                'created_at' => now(),
            ]);

            return $lockedReview->load(['user:id,name,email', 'product:id,name,slug', 'images', 'orderItem.order'])->loadCount('helpfulVotes');
        });

        return response()->json(['data' => new ReviewResource($review)]);
    }

    public function destroy(Review $review): JsonResponse
    {
        $storedPaths = $review->images->map(function ($image): ?string {
            $baseUrl = Storage::disk('public')->url('');

            return str_starts_with($image->url, $baseUrl) ? substr($image->url, strlen($baseUrl)) : null;
        })->filter(fn (?string $path): bool => $path !== null && str_starts_with($path, 'reviews/'))->all();

        DB::transaction(function () use ($review): void {
            $lockedReview = Review::query()->whereKey($review->id)->lockForUpdate()->firstOrFail();
            $product = $lockedReview->product()->lockForUpdate()->firstOrFail();
            $lockedReview->delete();
            $this->recalculateProduct($product);
        });
        Storage::disk('public')->delete($storedPaths);

        return response()->json(['message' => 'Đã xóa đánh giá.']);
    }

    private function recalculateProduct(Product $product): void
    {
        $aggregate = $product->reviews()->where('status', 'approved')
            ->selectRaw('COUNT(*) as review_count, COALESCE(AVG(rating), 0) as review_average')->first();
        $product->forceFill(['rating_count' => (int) $aggregate->review_count, 'rating_avg' => $aggregate->review_average])->save();
    }

    private function recordApproval(Request $request, int $reviewId, string $previousStatus, string $status): void
    {
        if ($previousStatus === 'approved' || $status !== 'approved') {
            return;
        }

        DB::table('activity_logs')->insert([
            'user_id' => $request->user()->id,
            'module' => 'reviews',
            'action' => 'UPDATE',
            'path' => 'api/v1/admin/reviews/'.$reviewId.'/status',
            'changes' => json_encode(['review_id' => $reviewId, 'status' => 'approved'], JSON_THROW_ON_ERROR),
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);
    }
}
