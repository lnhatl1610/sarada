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

class ProductPriceDropNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $productName,
        private readonly int $previousPrice,
        private readonly int $currentPrice,
        private readonly string $productUrl,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        if (! $notifiable instanceof User) {
            return ['mail'];
        }

        $channels = [];
        if (StorefrontNotificationPreferences::wants($notifiable, 'price_drops', 'in_app')) {
            $channels[] = 'database';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'price_drops', 'email')) {
            $channels[] = 'mail';
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'price_drops', 'push')
            && filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'))
            && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }
        if (StorefrontNotificationPreferences::wants($notifiable, 'price_drops', 'zalo')
            && filled(config('services.zalo_zbs.templates.price_drop'))
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
            'event' => 'price_drop',
            'title' => 'Sản phẩm bạn theo dõi vừa giảm giá',
            'message' => $this->productName.' hiện có giá '.number_format($this->currentPrice, 0, ',', '.').'₫.',
            'href' => $this->relativeProductUrl(),
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Sản phẩm bạn theo dõi vừa giảm giá')
            ->body($this->productName.' hiện có giá '.number_format($this->currentPrice, 0, ',', '.').'₫.')
            ->icon('/favicon.svg')
            ->data(['url' => $this->productUrl]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render(
            'price_drop',
            'Sản phẩm {product_name} vừa giảm giá',
            '{product_name} hiện có giá {current_price}₫, thấp hơn mức {previous_price}₫ khi bạn đăng ký theo dõi.',
            [
                '{product_name}' => $this->productName,
                '{previous_price}' => number_format($this->previousPrice, 0, ',', '.'),
                '{current_price}' => number_format($this->currentPrice, 0, ',', '.'),
            ],
        );

        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)
                ->subject($template['subject'])
                ->action('Xem sản phẩm', $this->productUrl),
            $template['body'],
        );
    }

    /** @return array{template_id: string, template_data: array<string, string>, tracking_id: string} */
    public function toZaloZbs(object $notifiable): array
    {
        return [
            'template_id' => (string) config('services.zalo_zbs.templates.price_drop'),
            'template_data' => [
                'product_name' => $this->productName,
                'previous_price' => number_format($this->previousPrice, 0, ',', '.'),
                'current_price' => number_format($this->currentPrice, 0, ',', '.'),
            ],
            'tracking_id' => 'price-drop-'.$this->productName,
        ];
    }

    private function relativeProductUrl(): string
    {
        $path = parse_url($this->productUrl, PHP_URL_PATH);

        return is_string($path) && str_starts_with($path, '/products/') ? $path : '/products';
    }
}
