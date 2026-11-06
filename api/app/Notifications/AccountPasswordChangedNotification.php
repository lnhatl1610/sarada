<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountPasswordChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly bool $otherSessionsRevoked)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = StoreEmailTemplates::applySender(new MailMessage)
            ->subject('Mật khẩu tài khoản đã được thay đổi')
            ->greeting('Thông báo bảo mật')
            ->line('Mật khẩu tài khoản của bạn vừa được thay đổi.');

        $message->line($this->otherSessionsRevoked
            ? 'Các thiết bị khác đã được đăng xuất khỏi tài khoản.'
            : 'Các thiết bị khác vẫn được đăng nhập. Nếu bạn không thực hiện thay đổi này, hãy đăng xuất các thiết bị đó và liên hệ cửa hàng để được hỗ trợ.');

        return $message;
    }
}
