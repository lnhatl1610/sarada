<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewsletterUnsubscribeConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $token)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $confirmationUrl = $frontendUrl.'/newsletter/unsubscribe/confirm#token='.rawurlencode($this->token);

        return (new MailMessage)
            ->subject('Xác nhận hủy nhận email từ Sarada')
            ->greeting('Bạn đã yêu cầu hủy nhận email từ Sarada.')
            ->line('Chọn nút bên dưới để xác nhận. Liên kết chỉ dùng được một lần và hết hạn sau 30 phút.')
            ->action('Xác nhận hủy đăng ký', $confirmationUrl)
            ->line('Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email. Đăng ký hiện tại sẽ được giữ nguyên.');
    }
}
