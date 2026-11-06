<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\StorefrontPromotionCampaignRequest;
use App\Http\Resources\StorefrontPromotionCampaignResource;
use App\Models\StorefrontPromotionCampaign;
use App\Modules\Promotions\Actions\SendStorefrontPromotionCampaignAction;
use Illuminate\Http\JsonResponse;

class StorefrontPromotionCampaignController extends Controller
{
    public function index(ListOperationsRequest $request): JsonResponse
    {
        $campaigns = StorefrontPromotionCampaign::query()
            ->latest('id')
            ->paginate($request->validated('per_page', 20));

        return response()->json([
            'data' => StorefrontPromotionCampaignResource::collection($campaigns->items()),
            'meta' => [
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
                'per_page' => $campaigns->perPage(),
                'total' => $campaigns->total(),
            ],
        ]);
    }

    public function store(StorefrontPromotionCampaignRequest $request, SendStorefrontPromotionCampaignAction $action): JsonResponse
    {
        $campaign = $action->execute($request->validated(), (int) $request->user()->id);

        return response()->json([
            'data' => new StorefrontPromotionCampaignResource($campaign),
            'message' => 'Chiến dịch đã được đưa vào hàng đợi gửi.',
        ], 202);
    }
}
