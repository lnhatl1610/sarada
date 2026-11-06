<?php

namespace App\Modules\Reviews\Actions;

use App\Models\Review;
use Illuminate\Support\Facades\DB;

class MarkReviewHelpfulAction
{
    /** @return array{helpful_count: int, voted: bool} */
    public function execute(int $reviewId, string $visitorId): array
    {
        return DB::transaction(function () use ($reviewId, $visitorId): array {
            $review = Review::query()->whereKey($reviewId)->where('status', 'approved')->lockForUpdate()->firstOrFail();

            DB::table('review_helpful_votes')->insertOrIgnore([
                'review_id' => $review->id,
                'visitor_id' => $visitorId,
                'created_at' => now(),
            ]);

            return [
                'helpful_count' => (int) DB::table('review_helpful_votes')->where('review_id', $review->id)->count(),
                'voted' => DB::table('review_helpful_votes')->where('review_id', $review->id)->where('visitor_id', $visitorId)->exists(),
            ];
        });
    }
}
