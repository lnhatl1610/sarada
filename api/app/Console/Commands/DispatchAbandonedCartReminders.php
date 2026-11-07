<?php

namespace App\Console\Commands;

use App\Models\Cart;
use App\Notifications\CartRecoveryNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class DispatchAbandonedCartReminders extends Command
{
    protected $signature = 'storefront:dispatch-cart-recovery';

    protected $description = 'Queue opted-in customer cart reminders after one and 24 hours of inactivity';

    public function handle(): int
    {
        $eligible = Cart::query()
            ->whereNotNull('last_activity_at')
            ->where('last_activity_at', '<=', now()->subHour())
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->whereHas('items')
            ->where(function ($query): void {
                $query->where(function ($customer): void {
                    $customer->whereNotNull('user_id')->whereHas('user', function ($user): void {
                        $user->where('status', 'active')->whereExists(function ($subscriptions): void {
                            $subscriptions->selectRaw('1')
                                ->from('newsletter_subscriptions')
                                ->whereRaw('LOWER(newsletter_subscriptions.email) = LOWER(users.email)')
                                ->whereNull('newsletter_subscriptions.unsubscribed_at');
                        });
                    });
                })->orWhere(function ($guest): void {
                    $guest->whereNull('user_id')->whereNotNull('recovery_email')->whereNotNull('recovery_consent_at');
                });
            })
            ->where(function ($query): void {
                $query->whereNull('recovery_1h_sent_at')
                    ->orWhereNull('recovery_24h_sent_at');
            })
            ->orderBy('id');

        $queued = 0;
        $eligible->chunkById(100, function ($carts) use (&$queued): void {
            foreach ($carts as $cart) {
                foreach ([1, 24] as $hours) {
                    $email = $this->claimReminder((int) $cart->id, $hours);
                    if ($email === null) {
                        continue;
                    }

                    $url = rtrim((string) config('app.frontend_url'), '/').'/cart';
                    Notification::route('mail', $email)->notify(new CartRecoveryNotification($hours, $url));
                    $queued++;
                }
            }
        });

        $this->info("Queued {$queued} cart recovery reminder(s).");

        return self::SUCCESS;
    }

    private function claimReminder(int $cartId, int $hours): ?string
    {
        return DB::transaction(function () use ($cartId, $hours): ?string {
            $cart = Cart::query()->with('user')->lockForUpdate()->find($cartId);
            $sentColumn = $hours === 1 ? 'recovery_1h_sent_at' : 'recovery_24h_sent_at';

            if (! $cart || $cart->{$sentColumn} !== null || $cart->expires_at?->isPast() || ! $cart->last_activity_at?->lte(now()->subHours($hours)) || ! $cart->items()->exists()) {
                return null;
            }

            if ($cart->user_id !== null) {
                $user = $cart->user;
                if (! $user || $user->status !== 'active' || ! DB::table('newsletter_subscriptions')->whereRaw('LOWER(email) = LOWER(?)', [$user->email])->whereNull('unsubscribed_at')->exists()) {
                    return null;
                }

                $email = $user->email;
            } else {
                if (! $cart->recovery_email || ! $cart->recovery_consent_at) {
                    return null;
                }

                $email = $cart->recovery_email;
            }

            $cart->forceFill([$sentColumn => now()])->save();

            return $email;
        });
    }
}
