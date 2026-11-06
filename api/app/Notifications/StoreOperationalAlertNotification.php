<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StoreOperationalAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $subject, private readonly string $body)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)->subject($this->subject)->greeting('Thông báo từ cửa hàng'),
            $this->body,
        );
    }
}
