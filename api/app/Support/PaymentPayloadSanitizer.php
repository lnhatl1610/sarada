<?php

namespace App\Support;

class PaymentPayloadSanitizer
{
    public static function sanitize(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return null;
        }

        $redacted = function (mixed $value) use (&$redacted): mixed {
            if (! is_array($value)) {
                return $value;
            }

            $output = [];
            foreach ($value as $key => $child) {
                if (preg_match('/password|token|secret|authorization|card.?number|cvv|signature/i', (string) $key)) {
                    $output[$key] = '[redacted]';
                } else {
                    $output[$key] = $redacted($child);
                }
            }

            return $output;
        };

        return json_encode($redacted($decoded), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: null;
    }

    /** @return array<mixed>|null */
    public static function sanitizedArray(?string $raw): ?array
    {
        $sanitized = self::sanitize($raw);

        return $sanitized === null ? null : json_decode($sanitized, true);
    }
}
