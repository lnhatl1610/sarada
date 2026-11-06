<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProductBackInStockNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $productName,
        private readonly string $variantLabel,
        private readonly string $productUrl,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render(
            'back_in_stock',
            '{product_name} đã có hàng trở lại',
            'Sản phẩm {product_name} ({variant}) mà bạn quan tâm hiện đã có hàng. Số lượng có thể thay đổi nhanh chóng.',
            ['{product_name}' => $this->productName, '{variant}' => $this->variantLabel],
        );

        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)
                ->subject($template['subject'])
                ->action('Xem sản phẩm', $this->productUrl),
            $template['body'],
        );
    }
}
