<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ConfirmSudoModeRequest;
use App\Http\Requests\Api\V1\Admin\ListLoginHistoryRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePresenceRequest;
use App\Http\Resources\LoginAttemptResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AccountSecurityController extends Controller
{
    public function unlock(ConfirmSudoModeRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! Hash::check($request->validated('current_password'), $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['Mật khẩu hiện tại không đúng.']]);
        }
        if ($user->two_factor_enabled_at && ! app('pragmarx.google2fa')->verifyKey($user->two_factor_secret, (string) $request->validated('two_factor_code'))) {
            throw ValidationException::withMessages(['two_factor_code' => ['Mã xác thực hai bước không hợp lệ.']]);
        }

        return response()->json(['data' => ['unlocked' => true], 'message' => 'Đã mở khóa màn hình.']);
    }

    public function loginHistory(ListLoginHistoryRequest $request): JsonResponse
    {
        if (! Schema::hasTable('login_attempts')) {
            return response()->json(['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0]]);
        }

        $filters = $request->validated();
        $items = DB::table('login_attempts')->where('user_id', $request->user()->id)
            ->when(isset($filters['result']), fn ($query) => $query->where('result', $filters['result']))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->orderByDesc('created_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 20);

        return response()->json([
            'data' => LoginAttemptResource::collection($items->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function securityScore(Request $request): JsonResponse
    {
        $user = $request->user();
        $emailVerified = $user->email_verified_at !== null;
        $twoFactorEnabled = $user->two_factor_enabled_at !== null;
        $passwordRecent = $user->password_changed_at?->greaterThan(now()->subDays(90)) ?? false;
        $historyAvailable = Schema::hasTable('login_attempts');
        $hasRecentFailures = $historyAvailable && DB::table('login_attempts')
            ->where('user_id', $user->id)->whereIn('result', ['bad_password', 'bad_2fa', 'locked'])
            ->where('created_at', '>=', now()->subDays(30))->exists();
        $checks = [
            ['key' => 'email_verified', 'label' => 'Email đã được xác thực', 'passed' => $emailVerified, 'points' => 25],
            ['key' => 'two_factor', 'label' => 'Đã bật xác thực hai bước', 'passed' => $twoFactorEnabled, 'points' => 35],
            ['key' => 'password_recent', 'label' => 'Mật khẩu được đổi trong 90 ngày gần đây', 'passed' => $passwordRecent, 'points' => 25],
            ['key' => 'recent_login_failures', 'label' => 'Không có lần đăng nhập thất bại trong 30 ngày', 'passed' => $historyAvailable && ! $hasRecentFailures, 'points' => 15],
        ];
        $score = collect($checks)->where('passed', true)->sum('points');

        return response()->json(['data' => [
            'score' => $score,
            'level' => $score >= 80 ? 'strong' : ($score >= 50 ? 'fair' : 'needs_attention'),
            'checks' => $checks,
        ]]);
    }

    public function updatePresence(UpdatePresenceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $request->user()->forceFill([
            'presence_status' => $data['status'],
            'presence_until' => $data['until'] ?? null,
            'last_seen_at' => now(),
        ])->save();
        Cache::forget('admin-account-menu-summary:'.$request->user()->id);

        return response()->json(['data' => [
            'status' => $request->user()->presence_status,
            'until' => $request->user()->presence_until?->toIso8601String(),
        ]]);
    }

    public function recordActivity(Request $request): JsonResponse
    {
        $lastSeenAt = now();
        DB::table('users')->where('id', $request->user()->id)->update(['last_seen_at' => $lastSeenAt]);
        Cache::forget('admin-account-menu-summary:'.$request->user()->id);

        return response()->json(['data' => ['last_seen_at' => $lastSeenAt->toIso8601String()]]);
    }
}
