<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\ZaloZbsTemplateMessageChannel;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class StorefrontOrderUpdateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $event,
        private readonly string $title,
        private readonly string $message,
        private readonly string $orderCode,
        private readonly ?string $trackingCode = null,
    ) {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        if (! $notifiable instanceof User) {
            return [];
        }

        $channels = [];
        if (StorefrontNotificationPreferences::wants($notifiable, 'orders', 'in_app')) {
            $channels[] = 'database';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'orders', 'push')
            && filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'))
            && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'orders', 'zalo')
            && filled(config('services.zalo_zbs.templates.'.$this->event))
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
            'event' => $this->event,
            'title' => $this->title,
            'message' => $this->message,
            'href' => '/account/orders/'.$this->orderCode,
            'order_code' => $this->orderCode,
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/favicon.svg')
            ->data(['url' => $this->href()]);
    }

    /** @return array{template_id: string, template_data: array<string, string>, tracking_id: string} */
    public function toZaloZbs(object $notifiable): array
    {
        $data = [
            'customer_name' => (string) ($notifiable->name ?? ''),
            'order_code' => $this->orderCode,
            'message' => $this->message,
        ];
        if ($this->event === 'order_shipped') {
            $data['tracking_code'] = $this->trackingCode ?? '';
        }

        return [
            'template_id' => (string) config('services.zalo_zbs.templates.'.$this->event),
            'template_data' => $data,
            'tracking_id' => $this->event.'-'.$this->orderCode,
        ];
    }

    private function href(): string
    {
        return '/account/orders/'.$this->orderCode;
    }
}
