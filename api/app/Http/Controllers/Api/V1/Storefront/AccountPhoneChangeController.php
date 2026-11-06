<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ConfirmAccountPhoneChangeRequest;
use App\Http\Requests\Api\V1\Storefront\RequestAccountPhoneChangeRequest;
use App\Http\Resources\AccountResource;
use App\Modules\Identity\Actions\ConfirmAccountPhoneChangeAction;
use App\Modules\Identity\Actions\RequestAccountPhoneChangeAction;
use Illuminate\Http\JsonResponse;

class AccountPhoneChangeController extends Controller
{
    public function request(RequestAccountPhoneChangeRequest $request, RequestAccountPhoneChangeAction $action): JsonResponse
    {
        $data = $request->validated();
        $challenge = $action->execute($request->user(), $data['phone'], $data['current_password']);

        return response()->json(['data' => $challenge, 'message' => 'Đã gửi mã xác minh đến số điện thoại mới.'], 202);
    }

    public function confirm(ConfirmAccountPhoneChangeRequest $request, ConfirmAccountPhoneChangeAction $action): JsonResponse
    {
        $user = $action->execute($request->user(), $request->validated('code'));

        return (new AccountResource($user->load(['roles', 'pendingEmailChange', 'creator:id,name'])))->response();
    }
}
