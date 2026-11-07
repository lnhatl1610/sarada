<?php

namespace App\Modules\Marketing\Actions;

use App\Models\NewsletterSubscription;
use App\Notifications\NewsletterUnsubscribeConfirmationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class RequestNewsletterUnsubscribeAction
{
    public function execute(string $email, string $reason): void
    {
        $token = bin2hex(random_bytes(32));
        $recipient = DB::transaction(function () use ($email, $reason, $token): ?string {
            $subscription = NewsletterSubscription::query()
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if (! $subscription || $subscription->unsubscribed_at !== null) {
                return null;
            }

            $subscription->forceFill([
                'unsubscribe_token_hash' => hash('sha256', $token),
                'unsubscribe_token_expires_at' => now()->addMinutes(30),
                'pending_unsubscribe_reason' => $reason,
            ])->save();

            return $subscription->email;
        });

        if ($recipient !== null) {
            Notification::route('mail', $recipient)->notify(new NewsletterUnsubscribeConfirmationNotification($token));
        }
    }
}
