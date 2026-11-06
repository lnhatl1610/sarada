<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StoreContactMessageRequest;
use App\Modules\Marketing\Actions\SendStoreContactMessageAction;
use Illuminate\Http\JsonResponse;

class StoreContactMessageController extends Controller
{
    public function store(StoreContactMessageRequest $request, SendStoreContactMessageAction $action): JsonResponse
    {
        if (! $action->execute($request->validated())) {
            return response()->json([
                'message' => 'Hiện chưa thể gửi yêu cầu liên hệ. Vui lòng thử lại sau hoặc dùng thông tin liên hệ của cửa hàng.',
                'code' => 'CONTACT_UNAVAILABLE',
            ], 503);
        }

        return response()->json(['data' => ['message' => 'Cửa hàng đã nhận được yêu cầu. Chúng tôi sẽ phản hồi qua email bạn cung cấp.']], 202);
    }
}
