<?php

namespace App\Modules\Marketing\Actions;

use App\Jobs\SendStorefrontNotificationSms;
use App\Models\Coupon;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\NewsletterWelcomeNotification;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class SubscribeToNewsletterAction
{
    public function execute(string $email, ?User $user = null): bool
    {
        $now = now();

        $inserted = DB::table('newsletter_subscriptions')->insertOrIgnore([
            'email' => $email,
            'consented_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($inserted !== 1) {
            return false;
        }

        $code = trim((string) Setting::query()->where('key', 'newsletter_welcome_coupon_code')->value('value'));
        if ($code === '') {
            return false;
        }

        $now = now();
        $coupon = Coupon::query()->where('code', $code)->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($query) => $query->where(fn ($ends) => $ends->whereNotNull('ends_at')->where('ends_at', '>=', $now))
                ->orWhere(fn ($expires) => $expires->whereNull('ends_at')->where(fn ($fallback) => $fallback->whereNull('expires_at')->orWhere('expires_at', '>=', $now))))
            ->first();

        if ($coupon) {
            $notification = new NewsletterWelcomeNotification($coupon->code);
            if ($user) {
                $preferences = StorefrontNotificationPreferences::forUser($user);
                $preferences['promotions']['email'] = true;
                DB::table('user_preferences')->upsert([[
                    'user_id' => $user->id,
                    'key' => 'storefront_notifications',
                    'value' => json_encode($preferences, JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]], ['user_id', 'key'], ['value', 'updated_at']);

                $user->notify($notification);
                if (StorefrontNotificationPreferences::wants($user, 'promotions', 'sms')) {
                    SendStorefrontNotificationSms::dispatch(
                        $user->id,
                        'promotions',
                        'Mã ưu đãi chào mừng của bạn: '.$coupon->code.'.',
                        '/cart?coupon='.rawurlencode($coupon->code),
                    );
                }
            } else {
                Notification::route('mail', $email)->notify($notification);
            }

            return true;
        }

        return false;
    }
}
