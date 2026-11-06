<?php

namespace App\Notifications;

use App\Models\Role;
use App\Models\StaffInvitation;
use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StaffInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly StaffInvitation $invitation, private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.admin_url', 'http://localhost:5174'), '/').'/accept-invite/'.urlencode($this->token);

        $template = StoreEmailTemplates::render('invitation', 'Lời mời tham gia {store_name}', 'Bạn được mời tham gia {store_name} với vai trò {role}. Liên kết hết hạn lúc {expires_at}.', [
            '{role}' => Role::DEFINITIONS[$this->invitation->role->name]['label'] ?? $this->invitation->role->name,
            '{expires_at}' => $this->invitation->expires_at->format('d/m/Y H:i'),
            '{invite_url}' => $url,
        ]);
        $mail = StoreEmailTemplates::applySender(new MailMessage)
            ->subject($template['subject'])
            ->greeting('Xin chào')
            ->line($template['body']);
        if ($this->invitation->message) {
            $mail->line($this->invitation->message);
        }

        return $mail->action('Nhận lời mời', $url);
    }
}
