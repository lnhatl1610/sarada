<?php

namespace App\Modules\Marketing\Actions;

use App\Models\NewsletterSubscription;
use App\Models\User;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Support\Facades\DB;

class ConfirmNewsletterUnsubscribeAction
{
    public function execute(string $token): bool
    {
        return DB::transaction(function () use ($token): bool {
            $subscription = NewsletterSubscription::query()
                ->where('unsubscribe_token_hash', hash('sha256', $token))
                ->lockForUpdate()
                ->first();

            if (! $subscription || ! $subscription->unsubscribe_token_expires_at?->isFuture() || $subscription->unsubscribed_at !== null) {
                return false;
            }

            $subscription->forceFill([
                'unsubscribed_at' => now(),
                'unsubscribe_reason' => $subscription->pending_unsubscribe_reason,
                'unsubscribe_token_hash' => null,
                'unsubscribe_token_expires_at' => null,
                'pending_unsubscribe_reason' => null,
            ])->save();

            $user = User::query()->whereRaw('LOWER(email) = LOWER(?)', [$subscription->email])->first();
            if ($user) {
                $preferences = StorefrontNotificationPreferences::forUser($user);
                $preferences['promotions']['email'] = false;
                DB::table('user_preferences')->updateOrInsert(
                    ['user_id' => $user->id, 'key' => 'storefront_notifications'],
                    ['value' => json_encode($preferences, JSON_THROW_ON_ERROR), 'updated_at' => now(), 'created_at' => now()],
                );
            }

            return true;
        });
    }
}
