<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CartRecoveryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly int $reminderHours, private readonly string $cartUrl)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render(
            'cart_recovery',
            'Giỏ hàng của bạn vẫn đang chờ',
            'Bạn đã lưu một số sản phẩm trong giỏ hàng tại {store_name}. Nếu vẫn quan tâm, hãy quay lại để kiểm tra giá và tình trạng còn hàng mới nhất.',
            ['{reminder_hours}' => (string) $this->reminderHours],
        );

        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)
                ->subject($template['subject'])
                ->action('Quay lại giỏ hàng', $this->cartUrl),
            $template['body'],
        );
    }
}
