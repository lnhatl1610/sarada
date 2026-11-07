<?php

namespace App\Jobs;

use App\Models\StorefrontPromotionCampaign;
use App\Models\StorefrontPromotionCampaignRecipient;
use App\Models\User;
use App\Notifications\StorefrontPromotionCampaignNotification;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Throwable;

class DispatchStorefrontPromotionCampaign implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public int $uniqueFor = 7200;

    public function __construct(public readonly int $campaignId)
    {
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->campaignId;
    }

    public function handle(): void
    {
        $campaign = StorefrontPromotionCampaign::query()->find($this->campaignId);
        if (! $campaign || $campaign->dispatched_at) {
            return;
        }

        $campaign->update(['status' => 'sending']);
        $this->seedCustomerRecipients($campaign);
        $this->seedNewsletterRecipients($campaign);

        StorefrontPromotionCampaignRecipient::query()
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->orderBy('id')
            ->chunkById(100, function ($recipients) use ($campaign): void {
                foreach ($recipients as $recipient) {
                    $this->queueRecipient($campaign, $recipient);
                }
            });

        $campaign->refresh();
        $campaign->update([
            'status' => $campaign->failed_count > 0 ? 'sent_with_errors' : 'sent',
            'dispatched_at' => now(),
        ]);
        $campaign->recipients()->delete();
    }

    public function failed(?Throwable $exception): void
    {
        $campaign = StorefrontPromotionCampaign::query()->find($this->campaignId);
        if (! $campaign || $campaign->dispatched_at) {
            return;
        }

        $pending = $campaign->recipients()->where('status', 'pending')->count();
        $campaign->recipients()->where('status', 'pending')->update([
            'status' => 'failed',
            'last_error' => 'Không thể xử lý phần còn lại của chiến dịch.',
            'email' => null,
            'updated_at' => now(),
        ]);
        $campaign->update([
            'status' => 'failed',
            'failed_count' => $campaign->failed_count + $pending,
            'dispatched_at' => now(),
        ]);
        $campaign->recipients()->delete();
    }

    private function seedCustomerRecipients(StorefrontPromotionCampaign $campaign): void
    {
        User::query()->where('status', 'active')
            ->whereHas('roles', fn ($query) => $query->where('roles.name', 'customer'))
            ->select(['id', 'email'])
            ->whereNotNull('email')
            ->orderBy('id')
            ->chunkById(200, function ($users) use ($campaign): void {
                $now = now();
                DB::table('storefront_promotion_campaign_recipients')->insertOrIgnore($users->map(fn (User $user): array => [
                    'campaign_id' => $campaign->id,
                    'user_id' => $user->id,
                    'email' => null,
                    'email_hash' => $this->emailHash((string) $user->email),
                    'status' => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all());
            });
    }

    private function seedNewsletterRecipients(StorefrontPromotionCampaign $campaign): void
    {
        DB::table('newsletter_subscriptions')->whereNull('unsubscribed_at')->select(['id', 'email'])->orderBy('id')->chunkById(500, function ($subscribers) use ($campaign): void {
            $now = now();
            DB::table('storefront_promotion_campaign_recipients')->insertOrIgnore($subscribers->map(fn (object $subscriber): array => [
                'campaign_id' => $campaign->id,
                'user_id' => null,
                'email' => mb_strtolower(trim((string) $subscriber->email)),
                'email_hash' => $this->emailHash((string) $subscriber->email),
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ])->all());
        });

        $campaign->update(['recipient_count' => $campaign->recipients()->count()]);
    }

    private function queueRecipient(StorefrontPromotionCampaign $campaign, StorefrontPromotionCampaignRecipient $recipient): void
    {
        try {
            $user = $recipient->user_id ? User::query()->where('status', 'active')->find($recipient->user_id) : null;
            $notification = new StorefrontPromotionCampaignNotification($campaign->title, $campaign->message, $campaign->href);
            $smsAvailable = $user
                && StorefrontNotificationPreferences::wants($user, 'promotions', 'sms')
                && StorefrontNotificationPreferences::channelAvailability($user)['sms']['available'];

            if ($user) {
                if ($notification->via($user) === [] && ! $smsAvailable) {
                    $recipient->update(['status' => 'skipped', 'attempts' => $recipient->attempts + 1, 'email' => null]);
                    $campaign->increment('skipped_count');

                    return;
                }
                $user->notify($notification);
                if ($smsAvailable) {
                    SendStorefrontNotificationSms::dispatch($user->id, 'promotions', $campaign->message, $campaign->href);
                }
            } elseif ($recipient->email && DB::table('newsletter_subscriptions')->whereRaw('LOWER(email) = LOWER(?)', [$recipient->email])->whereNull('unsubscribed_at')->exists()) {
                Notification::route('mail', $recipient->email)->notify($notification);
            } else {
                $recipient->update(['status' => 'skipped', 'attempts' => $recipient->attempts + 1, 'email' => null]);
                $campaign->increment('skipped_count');

                return;
            }

            $recipient->update(['status' => 'queued', 'attempts' => $recipient->attempts + 1, 'queued_at' => now(), 'email' => null]);
            $campaign->increment('queued_count');
        } catch (Throwable) {
            $recipient->update([
                'status' => 'failed',
                'attempts' => $recipient->attempts + 1,
                'last_error' => 'Không thể đưa thông báo này vào hàng đợi.',
                'email' => null,
            ]);
            $campaign->increment('failed_count');
        }
    }

    private function emailHash(string $email): string
    {
        return hash_hmac('sha256', mb_strtolower(trim($email)), (string) config('app.key'));
    }
}
