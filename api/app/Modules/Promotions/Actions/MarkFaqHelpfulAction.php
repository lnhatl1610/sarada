<?php

namespace App\Modules\Promotions\Actions;

use App\Models\Faq;
use Illuminate\Support\Facades\DB;

class MarkFaqHelpfulAction
{
    /** @return array{helpful: bool, accepted: bool} */
    public function execute(Faq $faq, string $visitorId, bool $helpful): array
    {
        $accepted = DB::table('faq_helpful_votes')->insertOrIgnore([
            'faq_id' => $faq->id,
            'visitor_id' => $visitorId,
            'helpful' => $helpful,
            'created_at' => now(),
        ]) === 1;

        $vote = $faq->helpfulVotes()->where('visitor_id', $visitorId)->first(['helpful']);

        return [
            'helpful' => (bool) ($vote?->helpful ?? $helpful),
            'accepted' => $accepted,
        ];
    }
}
