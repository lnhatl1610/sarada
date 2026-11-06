<?php

namespace App\Modules\Identity\Actions;

use App\Models\PendingPhoneChange;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

class RequestAccountPhoneChangeAction
{
    /** @return array{phone_masked: string, expires_at: string} */
    public function execute(User $user, string $phone, string $currentPassword): array
    {
        if (! config('services.twilio.stock_alerts_enabled')) {
            throw ValidationException::withMessages(['phone' => 'Cửa hàng chưa cấu hình SMS để xác minh số điện thoại.']);
        }
        if (! Hash::check($currentPassword, (string) $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Mật khẩu hiện tại không chính xác.']);
        }

        $phone = $this->canonicalPhone($phone);
        if ($user->phone === $phone && $user->phone_verified_at !== null) {
            throw ValidationException::withMessages(['phone' => 'Số điện thoại này đã được xác minh.']);
        }
        $aliases = $this->phoneAliases($phone);
        if (User::query()->whereIn('phone', $aliases)->where('id', '<>', $user->id)->exists()) {
            throw ValidationException::withMessages(['phone' => 'Số điện thoại này đã được sử dụng.']);
        }

        $pending = DB::transaction(function () use ($user, $phone): PendingPhoneChange {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $pending = PendingPhoneChange::query()->where('user_id', $user->id)->lockForUpdate()->first();
            if ($pending && $pending->requested_at->gt(now()->subMinute())) {
                throw ValidationException::withMessages(['phone' => 'Đợi một phút trước khi gửi lại mã xác minh.']);
            }

            $code = (string) random_int(100000, 999999);
            $expiresAt = now()->addMinutes(10);
            $pending ??= new PendingPhoneChange(['user_id' => $user->id]);
            $pending->fill([
                'phone' => $phone,
                'code_hash' => hash_hmac('sha256', $code, (string) config('app.key')),
                'attempts' => 0,
                'expires_at' => $expiresAt,
                'requested_at' => now(),
            ]);
            $pending->save();
            $pending->setAttribute('delivery_code', $code);

            return $pending;
        });

        $accountSid = (string) config('services.twilio.account_sid');
        $to = str_starts_with($phone, '0') ? '+84'.substr($phone, 1) : $phone;
        try {
            $response = Http::asForm()->withBasicAuth($accountSid, (string) config('services.twilio.auth_token'))
                ->connectTimeout(5)->timeout(10)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                    'To' => $to,
                    'From' => (string) config('services.twilio.from_number'),
                    'Body' => 'Mã xác minh số điện thoại Sarada: '.$pending->getAttribute('delivery_code').'. Mã có hiệu lực trong 10 phút.',
                ]);
        } catch (Throwable) {
            $this->deleteUndeliveredChallenge($pending);
            throw ValidationException::withMessages(['phone' => 'Chưa gửi được mã xác minh. Vui lòng thử lại sau.']);
        }

        if (! $response->successful()) {
            $this->deleteUndeliveredChallenge($pending);
            throw ValidationException::withMessages(['phone' => 'Chưa gửi được mã xác minh. Vui lòng thử lại sau.']);
        }

        return [
            'phone_masked' => substr($phone, 0, 3).'••••'.substr($phone, -2),
            'expires_at' => $pending->expires_at->toIso8601String(),
        ];
    }

    private function canonicalPhone(string $phone): string
    {
        return str_starts_with($phone, '+84') ? '0'.substr($phone, 3) : $phone;
    }

    /** @return list<string> */
    private function phoneAliases(string $phone): array
    {
        return str_starts_with($phone, '0') ? [$phone, '+84'.substr($phone, 1)] : [$phone];
    }

    private function deleteUndeliveredChallenge(PendingPhoneChange $pending): void
    {
        PendingPhoneChange::query()
            ->whereKey($pending->id)
            ->where('code_hash', $pending->code_hash)
            ->delete();
    }
}
