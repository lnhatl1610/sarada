<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangeAdminPasswordAction
{
    public function execute(User $user, ?string $currentPassword, string $newPassword, ?int $currentAccessTokenId = null, bool $logoutOtherDevices = true, bool $recentlyAuthenticated = false): void
    {
        DB::transaction(function () use ($user, $currentPassword, $newPassword, $currentAccessTokenId, $logoutOtherDevices, $recentlyAuthenticated): void {
            $lockedUser = User::query()->whereKey($user->getKey())->lockForUpdate()->firstOrFail();

            if (($currentPassword !== null && ! Hash::check($currentPassword, $lockedUser->password)) || ($currentPassword === null && ! $recentlyAuthenticated)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Mật khẩu hiện tại không chính xác.'],
                ]);
            }

            if (Hash::check($newPassword, $lockedUser->password)) {
                throw ValidationException::withMessages([
                    'password' => ['Mật khẩu mới phải khác mật khẩu hiện tại.'],
                ]);
            }

            $lockedUser->forceFill(['password' => $newPassword, 'password_changed_at' => now(), 'must_change_password' => false])->save();

            if ($logoutOtherDevices) {
                $tokens = DB::table('personal_access_tokens')
                    ->where('tokenable_type', User::class)
                    ->where('tokenable_id', $lockedUser->id);

                if ($currentAccessTokenId !== null) {
                    $tokens->where('id', '!=', $currentAccessTokenId);
                }

                $tokens->delete();

                $refreshTokens = DB::table('refresh_tokens')
                    ->where('user_id', $lockedUser->id)
                    ->whereNull('revoked_at');

                if ($currentAccessTokenId !== null) {
                    $refreshTokens->where(function ($query) use ($currentAccessTokenId): void {
                        $query->whereNull('access_token_id')->orWhere('access_token_id', '!=', $currentAccessTokenId);
                    });
                }

                $refreshTokens->update(['revoked_at' => now(), 'updated_at' => now()]);
            }

        });
    }
}
