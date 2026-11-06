<?php

namespace App\Modules\Identity\Actions;

use App\Models\PendingPhoneChange;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmAccountPhoneChangeAction
{
    public function execute(User $user, string $code): User
    {
        $result = DB::transaction(function () use ($user, $code): string {
            $pending = PendingPhoneChange::query()->where('user_id', $user->id)->lockForUpdate()->first();
            if (! $pending) {
                return 'missing';
            }
            if ($pending->expires_at->isPast()) {
                $pending->delete();

                return 'expired';
            }
            if ($pending->attempts >= 5) {
                $pending->delete();

                return 'locked';
            }

            $pending->increment('attempts');
            $candidate = hash_hmac('sha256', $code, (string) config('app.key'));
            if (! hash_equals($pending->code_hash, $candidate)) {
                return 'invalid';
            }

            $phone = $pending->phone;
            $aliases = str_starts_with($phone, '0') ? [$phone, '+84'.substr($phone, 1)] : [$phone];
            if (User::query()->whereIn('phone', $aliases)->where('id', '<>', $user->id)->exists()) {
                $pending->delete();

                return 'taken';
            }

            $currentUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $currentUser->forceFill(['phone' => $phone, 'phone_verified_at' => now()])->save();
            $pending->delete();

            return 'confirmed';
        });

        if ($result !== 'confirmed') {
            $message = match ($result) {
                'expired' => 'Mã xác minh đã hết hạn. Hãy yêu cầu mã mới.',
                'locked' => 'Bạn đã nhập sai quá số lần cho phép. Hãy yêu cầu mã mới.',
                'invalid' => 'Mã xác minh không chính xác.',
                'taken' => 'Số điện thoại này đã được sử dụng.',
                default => 'Không có yêu cầu xác minh đang chờ.',
            };
            throw ValidationException::withMessages(['code' => $message]);
        }

        return $user->fresh();
    }
}
