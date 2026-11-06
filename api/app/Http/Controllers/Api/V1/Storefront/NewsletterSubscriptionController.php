<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StoreNewsletterSubscriptionRequest;
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
}
