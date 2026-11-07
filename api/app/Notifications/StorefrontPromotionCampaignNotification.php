<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\ZaloZbsTemplateMessageChannel;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class StorefrontPromotionCampaignNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly string $href,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        if (! $notifiable instanceof User) {
            return ['mail'];
        }

        $channels = [];
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'in_app')) {
            $channels[] = 'database';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'email')
            && DB::table('newsletter_subscriptions')->whereRaw('LOWER(email) = LOWER(?)', [$notifiable->email])->whereNull('unsubscribed_at')->exists()) {
            $channels[] = 'mail';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'push')
            && filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'))
            && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'zalo')
            && filled(config('services.zalo_zbs.templates.promotion'))
            && filled($notifiable->phone)) {
            $channels[] = ZaloZbsTemplateMessageChannel::class;
        }

        return $channels;
    }

    /** @return array<string, mixed> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'audience' => 'storefront',
            'event' => 'promotion',
            'title' => $this->title,
            'message' => $this->message,
            'href' => $this->href,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').$this->href;

        return (new MailMessage)
            ->subject($this->title)
            ->greeting('Xin chào!')
            ->line($this->message)
            ->action('Xem ưu đãi', $url)
            ->line('Bạn nhận được email này vì đã đồng ý nhận thông tin ưu đãi từ cửa hàng.');
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/favicon.svg')
            ->data(['url' => rtrim((string) config('app.frontend_url', config('app.url')), '/').$this->href]);
    }

    /** @return array{template_id: string, template_data: array<string, string>, tracking_id: string} */
    public function toZaloZbs(object $notifiable): array
    {
        return [
            'template_id' => (string) config('services.zalo_zbs.templates.promotion'),
            'template_data' => [
                'title' => $this->title,
                'message' => $this->message,
                'href' => $this->href,
            ],
            'tracking_id' => 'promotion-'.substr(sha1($this->title.$this->href), 0, 16),
        ];
    }
}
