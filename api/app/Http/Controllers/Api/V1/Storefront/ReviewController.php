<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListProductReviewsRequest;
use App\Http\Requests\Api\V1\Storefront\StoreReviewHelpfulVoteRequest;
use App\Http\Requests\Api\V1\Storefront\StoreReviewRequest;
use App\Http\Resources\StorefrontReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Modules\Reviews\Actions\MarkReviewHelpfulAction;
use App\Modules\Reviews\Actions\SubmitStorefrontReviewAction;
use App\Support\AdminNotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function index(ListProductReviewsRequest $request, string $slug): AnonymousResourceCollection
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();
        $sort = $request->validated('sort', 'latest');
        $rating = $request->validated('rating');
        $size = $request->validated('size');
        $reviews = $product->reviews()
            ->where('status', 'approved')
            ->when($rating !== null, fn ($query) => $query->where('rating', $rating))
            ->when($request->boolean('with_images'), fn ($query) => $query->whereHas('images', fn ($media) => $media->where('media_type', 'image')))
            ->when($size !== null, fn ($query) => $query->whereHas('orderItem.variant.size', fn ($sizeQuery) => $sizeQuery->where('value', $size)))
            ->with(['user:id,name', 'product:id,name', 'images', 'orderItem:id,variant_id,variant_name', 'orderItem.variant:id,size_value_id', 'orderItem.variant.size:id,value'])
            ->withCount(['images' => fn ($query) => $query->where('media_type', 'image'), 'helpfulVotes']);

        match ($sort) {
            'rating_desc' => $reviews->orderByDesc('rating')->orderByDesc('created_at'),
            'rating_asc' => $reviews->orderBy('rating')->orderByDesc('created_at'),
            default => $reviews->orderByDesc('created_at'),
        };

        $sizes = DB::table('reviews')
            ->join('order_items', 'order_items.id', '=', 'reviews.order_item_id')
            ->join('product_variants', 'product_variants.id', '=', 'order_items.variant_id')
            ->join('attribute_values as sizes', 'sizes.id', '=', 'product_variants.size_value_id')
            ->where('reviews.product_id', $product->id)
            ->where('reviews.status', 'approved')
            ->whereNotNull('sizes.value')
            ->distinct()
            ->orderBy('sizes.value')
            ->pluck('sizes.value')
            ->all();

        return StorefrontReviewResource::collection($reviews->orderByDesc('id')->paginate(10))
            ->additional(['filters' => ['sizes' => $sizes]]);
    }

    public function store(StoreReviewRequest $request, SubmitStorefrontReviewAction $submitReview): JsonResponse
    {
        $data = $request->validated();
        $images = $data['images'] ?? [];
        $videos = $data['videos'] ?? [];
        unset($data['images'], $data['videos']);
        $review = $submitReview($request->user(), $data, $images, $videos);

        AdminNotificationDispatcher::send(
            'review_pending',
            'reviews.moderate',
            'Có đánh giá mới cần duyệt',
            $review->user->name.' vừa đánh giá '.$review->product->name.'.',
            '/?page=reviews&reviews_status=pending',
        );

        return response()->json(['data' => new StorefrontReviewResource($review)], 201);
    }

    public function helpful(StoreReviewHelpfulVoteRequest $request, Review $review, MarkReviewHelpfulAction $action): JsonResponse
    {
        $data = $action->execute((int) $review->id, $request->validated('visitor_id'));

        return response()->json(['data' => $data]);
    }
}
