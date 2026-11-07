<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ConfirmNewsletterUnsubscribeRequest;
use App\Http\Requests\Api\V1\Storefront\StoreNewsletterSubscriptionRequest;
use App\Http\Requests\Api\V1\Storefront\StoreNewsletterUnsubscribeRequestRequest;
use App\Modules\Marketing\Actions\ConfirmNewsletterUnsubscribeAction;
use App\Modules\Marketing\Actions\RequestNewsletterUnsubscribeAction;
use App\Modules\Marketing\Actions\SubscribeToNewsletterAction;
use Illuminate\Http\JsonResponse;
use Throwable;

class NewsletterSubscriptionController extends Controller
{
    public function store(StoreNewsletterSubscriptionRequest $request, SubscribeToNewsletterAction $action): JsonResponse
    {
        $email = $request->validated('email');
        $user = null;
        try {
            $candidate = $request->user('api');
            if ($candidate && mb_strtolower((string) $candidate->email) === mb_strtolower($email)) {
                $user = $candidate;
            }
        } catch (Throwable) {
            // Newsletter signup remains available when there is no valid optional account token.
        }
        $welcomeCouponQueued = $action->execute($email, $user);

        return response()->json([
            'data' => [
                'message' => $welcomeCouponQueued
                    ? 'Bạn đã đăng ký nhận tin thành công. Mã chào mừng sẽ được gửi tới email của bạn.'
                    : 'Bạn đã đăng ký nhận tin thành công.',
            ],
        ], 202);
    }

    public function requestUnsubscribe(StoreNewsletterUnsubscribeRequestRequest $request, RequestNewsletterUnsubscribeAction $action): JsonResponse
    {
        $action->execute($request->validated('email'), $request->validated('reason'));

        return response()->json([
            'data' => ['message' => 'Nếu email đang nhận tin, Sarada sẽ gửi hướng dẫn xác nhận hủy đăng ký. Vui lòng kiểm tra hộp thư.'],
        ], 202);
    }

    public function confirmUnsubscribe(ConfirmNewsletterUnsubscribeRequest $request, ConfirmNewsletterUnsubscribeAction $action): JsonResponse
    {
        if (! $action->execute($request->validated('token'))) {
            return response()->json([
                'message' => 'Liên kết hủy đăng ký không còn hiệu lực. Hãy yêu cầu một liên kết mới.',
                'code' => 'NEWSLETTER_UNSUBSCRIBE_LINK_INVALID',
            ], 422);
        }

        return response()->json([
            'data' => ['message' => 'Đã hủy đăng ký nhận email từ Sarada.'],
        ]);
    }
}
