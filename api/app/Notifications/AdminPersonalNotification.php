<?php

namespace App\Notifications;

use App\Models\User;
use App\Support\AdminDndStatus;
use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class AdminPersonalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $event,
        public readonly string $title,
        public readonly string $detail,
        public readonly string $href,
        public readonly string $priority,
        private readonly bool $inApp,
        private readonly bool $email,
    ) {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        $channels = [];
        if ($this->inApp) {
            $channels[] = 'database';
        }
        if ($this->email) {
            $isSecurity = str_starts_with($this->event, 'security_');
            if (! ($notifiable instanceof User) || ! AdminDndStatus::isActive($notifiable)
                || $isSecurity
                || ($this->priority === 'urgent' && AdminDndStatus::allowsUrgent($notifiable))) {
                $channels[] = 'mail';
            }
        }
        if ($notifiable instanceof User) {
            $saved = DB::table('user_preferences')
                ->where('user_id', $notifiable->id)
                ->where('key', 'admin_notifications')
                ->value('value');
            $preferences = is_string($saved) ? json_decode($saved, true) : null;

            if (($preferences[$this->event]['push'] ?? false) === true && $notifiable->pushSubscriptions()->exists()) {
                $channels[] = WebPushChannel::class;
            }

        }

        return $channels;
    }

    /** @return array{event: string, title: string, detail: string, href: string, priority: string} */
    public function toDatabase(object $notifiable): array
    {
        return [
            'event' => $this->event,
            'title' => $this->title,
            'detail' => $this->detail,
            'href' => $this->href,
            'priority' => $this->priority,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $adminUrl = rtrim((string) config('app.admin_url', config('app.url')), '/');

        return StoreEmailTemplates::applySender(new MailMessage)
            ->subject($this->title)
            ->greeting('Xin chào '.$notifiable->name)
            ->line($this->detail)
            ->action('Mở trang quản trị', $adminUrl.$this->href);
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->detail)
            ->icon('/favicon.svg')
            ->data(['url' => $this->href]);
    }
}
