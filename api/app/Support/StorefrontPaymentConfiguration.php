<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class StorefrontPaymentConfiguration
{
    /** @return array<string, string> */
    public function bankTransferSettings(): array
    {
        return DB::table('settings')->whereIn('key', [
            'payment_bank_transfer_enabled',
            'payment_bank_bin',
            'payment_bank_name',
            'payment_bank_account',
            'payment_bank_holder',
            'payment_bank_note',
        ])->pluck('value', 'key')->map(fn ($value): string => (string) $value)->all();
    }

    /** @param array<string, mixed>|null $settings */
    public function bankTransferAvailable(?array $settings = null): bool
    {
        $settings ??= $this->bankTransferSettings();
        $enabled = filter_var($settings['payment_bank_transfer_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);

        foreach (['payment_bank_bin', 'payment_bank_name', 'payment_bank_account', 'payment_bank_holder'] as $required) {
            if (trim((string) ($settings[$required] ?? '')) === '') {
                return false;
            }
        }

        return $enabled && preg_match('/^\d{6}$/', (string) $settings['payment_bank_bin']) === 1;
    }

    public function paymentToken(string $orderCode): string
    {
        return hash_hmac('sha256', 'bank-transfer-payment:'.$orderCode, (string) config('app.key'));
    }
}
