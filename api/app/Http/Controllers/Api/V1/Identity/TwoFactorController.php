<?php

namespace App\Http\Controllers\Api\V1\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ConfirmTwoFactorRequest;
use App\Http\Requests\Api\V1\Storefront\ManageTwoFactorRequest;
use App\Http\Requests\Api\V1\Storefront\StartTwoFactorRequest;
use App\Models\Setting;
use App\Models\User;
use App\Support\AdminSecurityAlerts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $this->assertAdmin($request->user());

        return response()->json(['data' => [
            'enabled' => $request->user()->two_factor_enabled_at !== null,
            'enabled_at' => $request->user()->two_factor_enabled_at,
            'recovery_codes_remaining' => count($request->user()->two_factor_recovery_codes ?? []),
        ]]);
    }

    public function start(StartTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->assertAdmin($user);
        if ($user->two_factor_enabled_at) {
            throw ValidationException::withMessages(['two_factor' => 'Xác thực hai bước đã được bật.']);
        }

        $service = app('pragmarx.google2fa');
        $service->setQRCodeBackend('svg');
        $secret = $service->generateSecretKey();
        $user->forceFill(['two_factor_secret_pending' => $secret])->save();

        return response()->json(['data' => [
            'qr_code' => 'data:image/svg+xml;base64,'.base64_encode($service->getQRCodeInline(config('app.name'), $user->email, $secret)),
            'manual_entry_key' => $secret,
        ]]);
    }

    public function confirm(ConfirmTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->assertAdmin($user);
        $secret = $user->two_factor_secret_pending;
        if (! $secret || ! app('pragmarx.google2fa')->verifyKey($secret, $request->validated('code'))) {
            throw ValidationException::withMessages(['code' => 'Mã xác thực không hợp lệ hoặc đã hết hạn.']);
        }

        $codes = $this->newRecoveryCodes();
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_secret_pending' => null,
            'two_factor_recovery_codes' => array_map(fn (string $code): string => Hash::make($code), $codes),
            'two_factor_enabled_at' => now(),
        ])->save();
        AdminSecurityAlerts::send($user, 'credentials_changed', 'Xác thực hai bước đã bật', 'Xác thực hai bước cho tài khoản quản trị vừa được bật.', true);

        return response()->json(['data' => ['recovery_codes' => $codes], 'message' => 'Đã bật xác thực hai bước. Hãy lưu các mã khôi phục ở nơi an toàn.']);
    }

    public function regenerate(ManageTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->assertAdmin($user);
        $this->assertValidCode($user, $request->validated('code'));
        $codes = $this->newRecoveryCodes();
        DB::transaction(function () use ($user, $codes): void {
            $user->forceFill(['two_factor_recovery_codes' => array_map(fn (string $code): string => Hash::make($code), $codes)])->save();
        });

        return response()->json(['data' => ['recovery_codes' => $codes], 'message' => 'Đã tạo bộ mã khôi phục mới.']);
    }

    public function disable(ManageTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->assertAdmin($user);
        $requiredRoles = json_decode((string) (Setting::query()->where('key', 'two_factor_required_roles')->value('value') ?? '[]'), true) ?: [];
        if ($requiredRoles && $user->roles()->whereIn('name', $requiredRoles)->exists()) {
            throw ValidationException::withMessages(['two_factor' => 'Vai trò hiện tại bắt buộc bật xác thực hai bước. Hãy nhờ chủ cửa hàng thay đổi chính sách trước.']);
        }
        $this->assertValidCode($user, $request->validated('code'));
        DB::transaction(function () use ($user): void {
            $user->forceFill([
                'two_factor_secret' => null,
                'two_factor_secret_pending' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_enabled_at' => null,
            ])->save();
        });
        AdminSecurityAlerts::send($user, 'credentials_changed', 'Xác thực hai bước đã tắt', 'Xác thực hai bước cho tài khoản quản trị vừa được tắt.', true);

        return response()->json(['message' => 'Đã tắt xác thực hai bước.']);
    }

    private function assertValidCode(User $user, string $code): void
    {
        if (! $user->two_factor_enabled_at || ! $user->two_factor_secret || ! app('pragmarx.google2fa')->verifyKey($user->two_factor_secret, $code)) {
            throw ValidationException::withMessages(['code' => 'Mã xác thực không hợp lệ.']);
        }
    }

    /** @return list<string> */
    private function newRecoveryCodes(): array
    {
        return array_map(fn () => strtoupper(substr(bin2hex(random_bytes(7)), 0, 14)), range(1, 8));
    }

    private function assertAdmin(?User $user): void
    {
        abort_unless($user && $user->isAdmin(), 403, 'Chỉ tài khoản nhân viên mới có thể quản lý xác thực hai bước.');
    }
}
