<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreatePersonalApiTokenRequest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class PersonalApiTokenController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokens = PersonalAccessToken::query()->where('tokenable_type', $user->getMorphClass())
            ->where('tokenable_id', $user->id)->where('token_type', 'api')->latest('created_at')->get()
            ->map(fn (PersonalAccessToken $token): array => $this->tokenData($token));

        return response()->json(['data' => [
            'tokens' => $tokens,
            'permissions' => $this->userPermissions($user),
            'requires_two_factor' => $user->two_factor_enabled_at !== null,
            'allow_non_expiring' => $this->allowsNonExpiringTokens(),
        ]]);
    }

    public function store(CreatePersonalApiTokenRequest $request): JsonResponse
    {
        $user = $request->user();
        $existingCount = PersonalAccessToken::query()->where('tokenable_type', $user->getMorphClass())
            ->where('tokenable_id', $user->id)->where('token_type', 'api')->count();
        if ($existingCount >= 10) {
            throw ValidationException::withMessages(['name' => 'Mỗi tài khoản chỉ được có tối đa 10 API token.']);
        }

        $data = $request->validated();
        $allowedPermissions = $this->userPermissions($user);
        $requestedPermissions = array_values(array_unique($data['permissions']));
        if (array_diff($requestedPermissions, $allowedPermissions) !== []) {
            throw ValidationException::withMessages(['permissions' => 'Token chỉ được cấp các quyền mà tài khoản của bạn đang có.']);
        }
        if ($data['expires_in'] === 'never' && ! $this->allowsNonExpiringTokens()) {
            throw ValidationException::withMessages(['expires_in' => 'Quản trị viên chưa cho phép tạo token không hết hạn.']);
        }

        $expiresAt = $data['expires_in'] === 'never' ? null : now()->addDays((int) $data['expires_in']);
        $issued = $user->createToken(trim($data['name']), ['audience:admin', ...$requestedPermissions], $expiresAt);
        $issued->accessToken->forceFill(['token_type' => 'api'])->save();

        return response()->json(['data' => [
            'id' => $issued->accessToken->id,
            'name' => $issued->accessToken->name,
            'permissions' => $requestedPermissions,
            'created_at' => $issued->accessToken->created_at,
            'expires_at' => $issued->accessToken->expires_at,
            'token' => $issued->plainTextToken,
        ], 'message' => 'Token chỉ hiển thị lần này. Hãy sao chép và lưu vào nơi an toàn.'], 201);
    }

    public function destroy(Request $request, int $token): JsonResponse
    {
        $user = $request->user();
        $deleted = PersonalAccessToken::query()->whereKey($token)->where('tokenable_type', $user->getMorphClass())
            ->where('tokenable_id', $user->id)->where('token_type', 'api')->delete();
        abort_unless($deleted, 404);

        return response()->json(['message' => 'Đã thu hồi API token.']);
    }

    /** @return list<string> */
    private function userPermissions(User $user): array
    {
        return array_values(array_filter($user->adminPermissionNames(), fn (string $permission): bool => $permission !== 'api_tokens.manage'));
    }

    /** @return array<string, mixed> */
    private function tokenData(PersonalAccessToken $token): array
    {
        $abilities = is_array($token->abilities) ? $token->abilities : [];

        return [
            'id' => $token->id, 'name' => $token->name,
            'permissions' => array_values(array_filter($abilities, fn (string $ability): bool => $ability !== 'audience:admin')),
            'created_at' => $token->created_at, 'last_used_at' => $token->last_used_at,
            'last_used_ip' => $token->last_used_ip, 'expires_at' => $token->expires_at,
        ];
    }

    private function allowsNonExpiringTokens(): bool
    {
        $value = Setting::query()->where('key', 'security.allow_non_expiring_api_tokens')->value('value');

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
