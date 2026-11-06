<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountEmailChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
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
            ->subject('Email đăng nhập đã được thay đổi')
            ->greeting('Thông báo bảo mật')
            ->line('Email đăng nhập tài khoản của bạn vừa được xác nhận và thay đổi.')
            ->line('Nếu bạn không thực hiện thay đổi này, hãy liên hệ cửa hàng để được hỗ trợ.');
    }
}
