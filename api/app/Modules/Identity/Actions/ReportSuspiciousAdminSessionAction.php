<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use App\Support\AdminSecurityAlerts;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ReportSuspiciousAdminSessionAction
{
    public function execute(User $user, int $sessionId, ?int $currentSessionId): void
    {
        if (! $user->isAdmin()) {
            throw new AccessDeniedHttpException('Chỉ tài khoản quản trị mới có thể báo cáo phiên đăng nhập.');
        }

        DB::transaction(function () use ($user, $sessionId, $currentSessionId): void {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $token = DB::table('personal_access_tokens')->where('id', $sessionId)
                ->where('tokenable_type', User::class)->where('tokenable_id', $user->id)
                ->where('token_type', 'session')->lockForUpdate()->first();

            abort_if(! $token, 404);
            abort_if((int) $token->id === (int) $currentSessionId, 422, 'Không thể báo cáo phiên hiện tại.');

            DB::table('personal_access_tokens')->where('id', $token->id)->delete();
            DB::table('refresh_tokens')->where('access_token_id', $token->id)->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'updated_at' => now()]);
            $lockedUser->forceFill(['must_change_password' => true])->save();
        });

        AdminSecurityAlerts::send(
            $user,
            'suspicious_session',
            'Đã báo cáo phiên đăng nhập lạ',
            'Phiên đã bị thu hồi. Hãy đổi mật khẩu ngay và bật xác thực hai yếu tố để bảo vệ tài khoản.',
            true,
        );
    }
}
