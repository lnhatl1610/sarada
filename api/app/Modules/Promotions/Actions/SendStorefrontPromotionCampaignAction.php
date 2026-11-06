<?php

namespace App\Modules\Promotions\Actions;

use App\Jobs\DispatchStorefrontPromotionCampaign;
use App\Models\StorefrontPromotionCampaign;
use Illuminate\Support\Facades\DB;

class SendStorefrontPromotionCampaignAction
{
    /** @param array{title: string, message: string, href: string} $data */
    public function execute(array $data, int $adminId): StorefrontPromotionCampaign
    {
        $campaign = DB::transaction(fn (): StorefrontPromotionCampaign => StorefrontPromotionCampaign::query()->create([
            ...$data,
            'status' => 'queued',
            'created_by' => $adminId,
        ]));
        DispatchStorefrontPromotionCampaign::dispatch($campaign->id);

        return $campaign;
    }
}
