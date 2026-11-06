<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AdminPushTestNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use NotificationChannels\WebPush\PushSubscription;

class AdminPushSubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => [
                'public_key' => config('webpush.vapid.public_key'),
                'configured' => filled(config('webpush.vapid.public_key')) && filled(config('webpush.vapid.private_key')),
                'subscriptions' => $user->pushSubscriptions()->orderByDesc('created_at')->get()->map(fn (PushSubscription $subscription): array => [
                    'id' => $subscription->getKey(),
                    'endpoint' => $subscription->endpoint,
                    'device_name' => $subscription->device_name,
                    'created_at' => $subscription->created_at,
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = Validator::make($request->all(), [
            'endpoint' => ['required', 'string', 'url', 'max:1024', 'starts_with:https://'],
            'keys' => ['required', 'array:p256dh,auth'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'content_encoding' => ['nullable', 'string', 'in:aes128gcm,aesgcm'],
        ])->validate();

        $subscription = $user->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
            $validated['content_encoding'] ?? 'aes128gcm',
        );
        $subscription->device_name = $validated['device_name'] ?? 'Trình duyệt hiện tại';
        $subscription->save();

        return response()->json(['data' => ['id' => $subscription->getKey()]], 201);
    }

    public function destroy(Request $request, int $subscription): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ownedSubscription = $user->pushSubscriptions()->whereKey($subscription)->firstOrFail();
        $ownedSubscription->delete();

        return response()->json(['message' => 'Đã hủy đăng ký thông báo trên thiết bị.']);
    }

    public function test(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(filled(config('webpush.vapid.public_key')) && filled(config('webpush.vapid.private_key')), 503, 'Chưa cấu hình khóa VAPID cho thông báo đẩy.');
        abort_if($user->pushSubscriptions()->doesntExist(), 422, 'Hãy bật thông báo đẩy trên thiết bị này trước khi gửi thử.');

        $user->notify(new AdminPushTestNotification);

        return response()->json(['message' => 'Đã đưa thông báo thử vào hàng đợi.']);
    }
}
