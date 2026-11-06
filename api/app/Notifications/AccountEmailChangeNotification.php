<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountEmailChangeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $confirmationUrl, private readonly string $expiresAt)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return StoreEmailTemplates::applySender(new MailMessage)
            ->subject('Xác nhận email đăng nhập mới')
            ->greeting('Xin chào')
            ->line('Bạn vừa yêu cầu đổi email đăng nhập cho tài khoản Sarada.')
            ->line('Email hiện tại vẫn được giữ nguyên cho đến khi bạn xác nhận địa chỉ mới.')
            ->action('Xác nhận email mới', $this->confirmationUrl)
            ->line('Liên kết hết hạn lúc '.$this->expiresAt.'. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.');
    }
}
