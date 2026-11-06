<?php

namespace App\Modules\AdminAccess\Actions;

use App\Models\User;
use App\Support\AdminSecurityAlerts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ResetStaffTwoFactorAction
{
    public function execute(User $actor, User $target, string $reason, Request $request): void
    {
        DB::transaction(function () use ($actor, $target, $reason, $request): void {
            $lockedTarget = User::query()->lockForUpdate()->findOrFail($target->id);
            if (! $lockedTarget->two_factor_enabled_at) {
                throw ValidationException::withMessages(['two_factor' => 'Tài khoản này chưa bật xác thực hai bước.']);
            }

            $lockedTarget->forceFill([
                'two_factor_secret' => null,
                'two_factor_secret_pending' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_enabled_at' => null,
            ])->save();

            $lockedTarget->tokens()->delete();
            DB::table('refresh_tokens')->where('user_id', $lockedTarget->id)->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'updated_at' => now()]);
            DB::table('activity_logs')->insert([
                'user_id' => $actor->id,
                'module' => 'staff_security',
                'action' => 'TWO_FACTOR_RESET',
                'path' => substr($request->path(), 0, 500),
                'changes' => json_encode([
                    'target_user_id' => $lockedTarget->id,
                    'target_email' => $lockedTarget->email,
                    'reason' => $reason,
                    'changed_fields' => ['two_factor_enabled_at', 'two_factor_secret', 'two_factor_recovery_codes', 'sessions'],
                    'two_factor_before' => true,
                    'two_factor_after' => false,
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'ip' => $request->ip(),
                'created_at' => now(),
            ]);
        });
        AdminSecurityAlerts::send($target, 'credentials_changed', 'Xác thực hai bước đã được đặt lại', 'Chủ cửa hàng vừa đặt lại xác thực hai bước cho tài khoản của bạn. Hãy đăng nhập lại và thiết lập 2FA mới.', true);
    }
}
