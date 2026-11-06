<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\ZaloZbsTemplateMessageChannel;
use App\Support\StoreEmailTemplates;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewsletterWelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $couponCode)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        if (! $notifiable instanceof User) {
            return ['mail'];
        }

        $channels = [];
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'email')) {
            $channels[] = 'mail';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'promotions', 'in_app')) {
            $channels[] = 'database';
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
            'title' => 'Ưu đãi chào mừng dành cho bạn',
            'message' => 'Mã ưu đãi '.$this->couponCode.' đã sẵn sàng để áp dụng.',
            'href' => '/cart?coupon='.rawurlencode($this->couponCode),
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Ưu đãi chào mừng dành cho bạn')
            ->body('Mã ưu đãi '.$this->couponCode.' đã sẵn sàng để áp dụng.')
            ->icon('/favicon.svg')
            ->data(['url' => rtrim((string) config('app.frontend_url', config('app.url')), '/').'/cart?coupon='.rawurlencode($this->couponCode)]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render(
            'newsletter',
            'Mã ưu đãi chào mừng từ {store_name}',
            'Cảm ơn bạn đã đồng ý nhận email từ {store_name}. Mã ưu đãi chào mừng của bạn: {coupon_code}.',
            ['{coupon_code}' => $this->couponCode],
        );

        return StoreEmailTemplates::addBody(StoreEmailTemplates::applySender(new MailMessage)->subject($template['subject']), $template['body']);
    }

    /** @return array{template_id: string, template_data: array<string, string>, tracking_id: string} */
    public function toZaloZbs(object $notifiable): array
    {
        return [
            'template_id' => (string) config('services.zalo_zbs.templates.promotion'),
            'template_data' => [
                'title' => 'Ưu đãi chào mừng dành cho bạn',
                'message' => 'Mã ưu đãi '.$this->couponCode.' đã sẵn sàng để áp dụng.',
                'href' => '/cart?coupon='.rawurlencode($this->couponCode),
            ],
            'tracking_id' => 'newsletter-welcome-'.$this->couponCode,
        ];
    }
}
