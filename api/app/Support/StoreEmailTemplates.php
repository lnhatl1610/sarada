<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Notifications\Messages\MailMessage;

class StoreEmailTemplates
{
    /** @return array{subject: string, body: string} */
    public static function render(string $type, string $defaultSubject, string $defaultBody, array $values): array
    {
        $settings = Setting::query()->whereIn('key', ["email_{$type}_subject", "email_{$type}_body", 'store_name'])->pluck('value', 'key');
        $values = ['{store_name}' => (string) ($settings['store_name'] ?? 'Sarada')] + $values;

        return [
            'subject' => strtr((string) ($settings["email_{$type}_subject"] ?? $defaultSubject), $values),
            'body' => strtr((string) ($settings["email_{$type}_body"] ?? $defaultBody), $values),
        ];
    }

    public static function applySender(MailMessage $mail): MailMessage
    {
        $settings = Setting::query()->whereIn('key', ['mail_from_name', 'mail_from_address'])->pluck('value', 'key');
        $address = trim((string) ($settings['mail_from_address'] ?? ''));
        if ($address === '') {
            return $mail;
        }

        return $mail->from($address, trim((string) ($settings['mail_from_name'] ?? '')) ?: null);
    }

    public static function addBody(MailMessage $mail, string $body): MailMessage
    {
        foreach (preg_split('/\R/u', trim($body)) ?: [] as $line) {
            if (trim($line) !== '') {
                $mail->line($line);
            }
        }

        return $mail;
    }
}
