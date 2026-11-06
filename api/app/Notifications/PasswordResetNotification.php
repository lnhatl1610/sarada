<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $baseUrl = method_exists($notifiable, 'isAdmin') && $notifiable->isAdmin()
            ? config('app.admin_url', 'http://localhost:5174')
            : config('app.frontend_url', config('app.url'));
        $url = rtrim((string) $baseUrl, '/').'/reset-password/'.urlencode($this->token).'?email='.urlencode((string) $notifiable->email);
        $template = StoreEmailTemplates::render('password_reset', 'Đặt lại mật khẩu Sarada', 'Bạn vừa yêu cầu đặt lại mật khẩu tại {store_name}. Liên kết có hiệu lực trong 60 phút.', [
            '{customer_name}' => (string) $notifiable->name,
            '{reset_url}' => $url,
        ]);

        $mail = StoreEmailTemplates::applySender(new MailMessage)
            ->subject($template['subject'])
            ->greeting('Xin chào '.$notifiable->name)
            ->action('Đặt lại mật khẩu', $url);

        return StoreEmailTemplates::addBody($mail, $template['body']);
    }
}
