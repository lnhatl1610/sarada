<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class StorefrontNotificationPreferences
{
    /** @return array<string, array<string, bool>> */
    public static function defaults(): array
    {
        return [
            'orders' => ['in_app' => true, 'email' => true, 'sms' => false, 'zalo' => false, 'push' => false],
            'promotions' => ['in_app' => true, 'email' => false, 'sms' => false, 'zalo' => false, 'push' => false],
            'price_drops' => ['in_app' => true, 'email' => true, 'sms' => false, 'zalo' => false, 'push' => false],
        ];
    }

    /** @return array<string, array<string, bool>> */
    public static function forUser(User $user): array
    {
        $saved = DB::table('user_preferences')
            ->where('user_id', $user->id)
            ->where('key', 'storefront_notifications')
            ->value('value');
        $preferences = is_string($saved) ? json_decode($saved, true) : null;

        $defaults = self::defaults();
        if ($saved === null) {
            $defaults['promotions']['email'] = DB::table('newsletter_subscriptions')
                ->whereRaw('LOWER(email) = LOWER(?)', [$user->email])
                ->exists();
        }

        return is_array($preferences) ? array_replace_recursive($defaults, $preferences) : $defaults;
    }

    public static function wants(User $user, string $event, string $channel): bool
    {
        $defaults = self::defaults();
        $preferences = self::forUser($user);

        return (bool) ($preferences[$event][$channel] ?? $defaults[$event][$channel] ?? false);
    }

    /** @return array<string, array{available: bool, reason: ?string}> */
    public static function channelAvailability(User $user): array
    {
        $vapidConfigured = filled(config('webpush.vapid.public_key')) && filled(config('webpush.vapid.private_key'));
        $hasPushSubscription = $vapidConfigured && $user->pushSubscriptions()->exists();
        $zaloConfigured = filled(config('services.zalo_zbs.app_id'))
            && filled(config('services.zalo_zbs.secret_key'))
            && (filled(config('services.zalo_zbs.refresh_token')) || DB::table('settings')->where('key', 'zalo_zbs_refresh_token')->exists())
            && collect(['order_placed', 'order_shipped', 'price_drop', 'promotion'])
                ->every(fn (string $event): bool => filled(config('services.zalo_zbs.templates.'.$event)));

        return [
            'in_app' => ['available' => true, 'reason' => null],
            'email' => ['available' => filled($user->email), 'reason' => filled($user->email) ? null : 'Thêm email vào hồ sơ trước khi bật kênh này.'],
            'sms' => [
                'available' => (bool) config('services.twilio.stock_alerts_enabled') && filled($user->phone),
                'reason' => ! config('services.twilio.stock_alerts_enabled')
                    ? 'Cửa hàng chưa cấu hình dịch vụ SMS.'
                    : (filled($user->phone) ? null : 'Thêm số điện thoại vào hồ sơ để bật SMS.'),
            ],
            'zalo' => [
                'available' => $zaloConfigured && filled($user->phone),
                'reason' => ! $zaloConfigured
                    ? 'Cửa hàng chưa cấu hình Zalo ZBS hoặc chưa khai báo đủ mẫu đã duyệt.'
                    : (filled($user->phone) ? null : 'Thêm số điện thoại vào hồ sơ để bật Zalo.'),
            ],
            'push' => [
                'available' => $hasPushSubscription,
                'reason' => ! $vapidConfigured ? 'Máy chủ chưa cấu hình VAPID.' : ($hasPushSubscription ? null : 'Đăng ký thiết bị này để bật thông báo đẩy.'),
            ],
        ];
    }
}
