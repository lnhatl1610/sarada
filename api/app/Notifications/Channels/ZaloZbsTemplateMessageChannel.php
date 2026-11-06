<?php

namespace App\Notifications\Channels;

use App\Models\User;
use App\Services\ZaloZbsAccessTokenService;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class ZaloZbsTemplateMessageChannel
{
    public function __construct(private readonly ZaloZbsAccessTokenService $tokens) {}

    public function send(object $notifiable, object $notification): void
    {
        if (! $notifiable instanceof User || ! method_exists($notification, 'toZaloZbs')) {
            return;
        }

        $phone = preg_replace('/\D+/', '', (string) $notifiable->phone) ?? '';
        if (str_starts_with($phone, '0')) {
            $phone = '84'.substr($phone, 1);
        } elseif (! str_starts_with($phone, '84')) {
            $phone = '84'.$phone;
        }

        $message = $notification->toZaloZbs($notifiable);
        $templateId = $message['template_id'] ?? null;
        $templateData = $message['template_data'] ?? null;
        if (! is_string($templateId) || $templateId === '' || ! is_array($templateData)) {
            throw new RuntimeException('Zalo ZBS notification template is not configured correctly.');
        }

        $response = Http::withHeaders(['access_token' => $this->tokens->get()])
            ->acceptJson()
            ->timeout(15)
            ->post('https://business.openapi.zalo.me/message/template', [
                'phone' => $phone,
                'template_id' => $templateId,
                'template_data' => $templateData,
                'tracking_id' => (string) ($message['tracking_id'] ?? ''),
            ]);

        $data = $response->json();
        if (! $response->successful() || ! is_array($data) || (int) ($data['error'] ?? -1) !== 0) {
            $error = is_array($data) ? (string) ($data['error'] ?? 'unknown') : 'unknown';
            throw new RuntimeException('Zalo ZBS message delivery failed (HTTP '.$response->status().', code '.$error.').');
        }
    }
}
