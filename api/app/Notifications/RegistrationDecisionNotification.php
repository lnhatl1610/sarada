<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationDecisionNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly bool $approved) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        if ($this->approved) {
            return (new MailMessage)
                ->subject('Tài khoản Sarada đã được duyệt')
                ->greeting('Xin chào '.$notifiable->name)
                ->line('Tài khoản của bạn đã được duyệt. Bạn có thể đăng nhập và sử dụng cửa hàng.')
                ->action('Đăng nhập', rtrim((string) config('app.frontend_url'), '/').'/login');
        }

        return (new MailMessage)
            ->subject('Cập nhật yêu cầu đăng ký Sarada')
            ->greeting('Xin chào '.$notifiable->name)
            ->line('Hiện tại cửa hàng chưa thể duyệt yêu cầu đăng ký của bạn. Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.');
    }
}
