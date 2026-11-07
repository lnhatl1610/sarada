<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\UpdateStorefrontNotificationPreferencesRequest;
use App\Models\User;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StorefrontNotificationPreferencesController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['data' => [
            'preferences' => StorefrontNotificationPreferences::forUser($user),
            'channels' => StorefrontNotificationPreferences::channelAvailability($user),
        ]]);
    }

    public function update(UpdateStorefrontNotificationPreferencesRequest $request): JsonResponse
    {
        $preferences = $request->validated('preferences');
        $user = $request->user();
        $availability = StorefrontNotificationPreferences::channelAvailability($user);
        foreach ($preferences as &$eventPreferences) {
            foreach ($availability as $channel => $channelStatus) {
                if (! $channelStatus['available']) {
                    $eventPreferences[$channel] = false;
                }
            }
        }
        unset($eventPreferences);
        DB::transaction(function () use ($preferences, $user): void {
            DB::table('user_preferences')->upsert([[
                'user_id' => $user->id,
                'key' => 'storefront_notifications',
                'value' => json_encode($preferences, JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ]], ['user_id', 'key'], ['value', 'updated_at']);

            $email = mb_strtolower(trim((string) $user->email));
            if ($preferences['promotions']['email'] && $email !== '') {
                $now = now();
                DB::table('newsletter_subscriptions')->insertOrIgnore([
                    'email' => $email,
                    'consented_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                DB::table('newsletter_subscriptions')->where('email', $email)->whereNotNull('unsubscribed_at')->update([
                    'consented_at' => $now,
                    'unsubscribed_at' => null,
                    'unsubscribe_reason' => null,
                    'unsubscribe_token_hash' => null,
                    'unsubscribe_token_expires_at' => null,
                    'pending_unsubscribe_reason' => null,
                    'updated_at' => $now,
                ]);
                DB::table('newsletter_subscriptions')->where('email', $email)->whereNull('unsubscribed_at')->whereNotNull('unsubscribe_token_hash')->update([
                    'unsubscribe_token_hash' => null,
                    'unsubscribe_token_expires_at' => null,
                    'pending_unsubscribe_reason' => null,
                    'updated_at' => $now,
                ]);
            } else {
                DB::table('newsletter_subscriptions')->whereRaw('LOWER(email) = LOWER(?)', [$email])->delete();
            }
        });

        return response()->json(['data' => [
            'preferences' => StorefrontNotificationPreferences::forUser($user),
            'channels' => StorefrontNotificationPreferences::channelAvailability($user),
        ], 'message' => 'Đã lưu cài đặt nhận tin.']);
    }
}
