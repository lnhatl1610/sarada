<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ConfirmSudoModeRequest;
use App\Models\User;
use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use App\Modules\Identity\Services\SudoModeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SudoModeController extends Controller
{
    public function __construct(
        private readonly ResolveAccessTokenSessionAction $resolveSession,
        private readonly SudoModeService $sudoMode,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $resolved = $this->resolveSession->execute($request);
        abort_unless($resolved && $resolved['audience'] === 'admin' && ! ($resolved['api_token'] ?? false), 403);
        $expiresAt = $this->sudoMode->expiresAt($request->user(), (int) $resolved['session']->getKey());

        return response()->json(['data' => [
            'active' => $expiresAt !== null,
            'expires_at' => $expiresAt?->toISOString(),
            'requires_two_factor' => $request->user()->two_factor_enabled_at !== null,
        ]]);
    }

    public function store(ConfirmSudoModeRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! Hash::check($request->validated('current_password'), $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Mật khẩu hiện tại không đúng.']);
        }
        if ($user->two_factor_enabled_at && ! app('pragmarx.google2fa')->verifyKey($user->two_factor_secret, (string) $request->validated('two_factor_code'))) {
            throw ValidationException::withMessages(['two_factor_code' => 'Mã xác thực hai bước không hợp lệ.']);
        }

        $resolved = $this->resolveSession->execute($request);
        abort_unless($resolved && $resolved['audience'] === 'admin' && ! ($resolved['api_token'] ?? false), 403);
        $expiresAt = $this->sudoMode->activate($user, (int) $resolved['session']->getKey());

        return response()->json(['data' => ['active' => true, 'expires_at' => $expiresAt->toISOString()]]);
    }
}
