<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ApproveRegistrationRequest;
use App\Http\Requests\Api\V1\Admin\CreateStaffInvitationRequest;
use App\Http\Requests\Api\V1\Admin\ListPendingApprovalsRequest;
use App\Http\Requests\Api\V1\Admin\ListPersonalPerformanceRequest;
use App\Http\Requests\Api\V1\Admin\ListStaffInvitationsRequest;
use App\Http\Requests\Api\V1\Admin\ListStaffRequest;
use App\Http\Requests\Api\V1\Admin\ResetStaffTwoFactorRequest;
use App\Http\Requests\Api\V1\Admin\SaveStaffRequest;
use App\Http\Requests\Api\V1\Admin\UpdateRolePermissionsRequest;
use App\Http\Resources\PersonalPerformanceResource;
use App\Models\Permission;
use App\Models\Role;
use App\Models\StaffInvitation;
use App\Models\User;
use App\Modules\AdminAccess\Actions\CreateStaffInvitationAction;
use App\Modules\AdminAccess\Actions\GetPersonalPerformanceAction;
use App\Modules\AdminAccess\Actions\ResetStaffTwoFactorAction;
use App\Notifications\RegistrationDecisionNotification;
use App\Support\AdminPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class StaffController extends Controller
{
    public function performance(ListPersonalPerformanceRequest $request, int $staff, GetPersonalPerformanceAction $performance): JsonResponse
    {
        $user = User::query()->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ASSIGNABLE_ADMIN_NAMES))->findOrFail($staff);

        return PersonalPerformanceResource::make($performance->execute($user, $request->validated('range', '7d'), $request->user()))->response();
    }

    public function pendingApprovals(ListPendingApprovalsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = ['name' => 'name', 'email' => 'email', 'created_at' => 'created_at'];
        $users = User::query()->where('status', 'pending_approval')->whereNotNull('email_verified_at')->with('roles:id,name')
            ->when($filters['q'] ?? null, fn ($query, string $q) => $query->where(fn ($search) => $search->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%")))
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => collect($users->items())->map(fn (User $user): array => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone,
            'role' => $user->roles->first()?->name, 'email_verified_at' => $user->email_verified_at, 'created_at' => $user->created_at,
        ])->values(), 'meta' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'per_page' => $users->perPage(), 'total' => $users->total()]]);
    }

    public function approveRegistration(ApproveRegistrationRequest $request, int $userId): JsonResponse
    {
        $user = DB::transaction(function () use ($request, $userId): User {
            $user = User::query()->where('status', 'pending_approval')->lockForUpdate()->findOrFail($userId);
            if (! $user->hasVerifiedEmail()) {
                throw ValidationException::withMessages(['user' => 'Chỉ duyệt tài khoản đã xác minh email.']);
            }
            $roleName = $request->validated('role');
            if ($roleName === 'admin' && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
                abort(403, 'Chỉ chủ cửa hàng được cấp vai trò quản trị viên.');
            }
            $role = Role::query()->where('name', $roleName)->firstOrFail();
            $user->roles()->sync([$role->id]);
            $user->forceFill(['status' => 'active'])->save();

            return $user;
        });
        $user->notify(new RegistrationDecisionNotification(true));

        return response()->json(['data' => ['id' => $user->id, 'status' => $user->status], 'message' => 'Đã duyệt tài khoản và gửi email thông báo.']);
    }

    public function rejectRegistration(int $userId): JsonResponse
    {
        $user = DB::transaction(function () use ($userId): User {
            $user = User::query()->where('status', 'pending_approval')->lockForUpdate()->findOrFail($userId);
            $user->forceFill(['status' => 'rejected'])->save();

            return $user;
        });
        $user->notify(new RegistrationDecisionNotification(false));

        return response()->json(['message' => 'Đã từ chối yêu cầu và gửi email thông báo.']);
    }

    public function invitations(ListStaffInvitationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = ['email' => 'email', 'expires_at' => 'expires_at', 'created_at' => 'created_at'];
        $rows = StaffInvitation::query()->with(['role:id,name', 'inviter:id,name'])
            ->where('status', 'pending')
            ->when($filters['q'] ?? null, fn ($query, string $q) => $query->where('email', 'like', "%{$q}%"))
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => collect($rows->items())->map(fn (StaffInvitation $invitation): array => [
            'id' => $invitation->id, 'email' => $invitation->email, 'role' => $invitation->role->name,
            'invited_by' => $invitation->inviter?->name, 'message' => $invitation->message,
            'expires_at' => $invitation->expires_at, 'expired' => $invitation->expires_at->isPast(),
            'created_at' => $invitation->created_at,
        ])->values(), 'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total()]]);
    }

    public function invite(CreateStaffInvitationRequest $request, CreateStaffInvitationAction $action): JsonResponse
    {
        $data = $request->validated();
        if ($data['role'] === 'admin' && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được mời quản trị viên.');
        }
        $invitation = $action->handle($data, (int) $request->user()->id);

        return response()->json(['data' => ['id' => $invitation->id, 'email' => $invitation->email, 'role' => $invitation->role->name, 'expires_at' => $invitation->expires_at], 'message' => 'Đã gửi lời mời qua email.'], 201);
    }

    public function resendInvitation(StaffInvitation $invitation, CreateStaffInvitationAction $action): JsonResponse
    {
        abort_unless($invitation->status === 'pending', 404);
        if ($invitation->role->name === 'admin' && ! request()->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được gửi lại lời mời quản trị viên.');
        }
        $replacement = $action->handle([
            'email' => $invitation->email, 'role' => $invitation->role->name,
            'expires_in_hours' => 24, 'message' => $invitation->message,
        ], (int) request()->user()->id);

        return response()->json(['data' => ['id' => $replacement->id, 'email' => $replacement->email, 'expires_at' => $replacement->expires_at], 'message' => 'Đã gửi lại lời mời.']);
    }

    public function revokeInvitation(StaffInvitation $invitation): JsonResponse
    {
        abort_unless($invitation->status === 'pending', 404);
        $invitation->forceFill(['status' => 'revoked', 'revoked_at' => now()])->save();

        return response()->json(['message' => 'Đã thu hồi lời mời.']);
    }

    public function index(ListStaffRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $sort = $validated['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = [
            'name' => 'users.name', 'email' => 'users.email', 'status' => 'users.status',
            'last_login_at' => 'users.last_login_at', 'created_at' => 'users.created_at',
        ];
        $countQuery = User::query()->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))
            ->when($validated['q'] ?? null, fn ($query, string $q) => $query->where(fn ($nested) => $nested->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%")))
            ->when($validated['role'] ?? null, fn ($query, string $role) => $query->whereHas('roles', fn ($roles) => $roles->where('name', $role)))
            ->when($validated['last_login_from'] ?? null, fn ($query, string $date) => $query->whereDate('last_login_at', '>=', $date))
            ->when($validated['last_login_to'] ?? null, fn ($query, string $date) => $query->whereDate('last_login_at', '<=', $date));
        $queryText = $validated['q'] ?? null;
        $statusCounts = [
            'all' => (clone $countQuery)->count(),
            'active' => (clone $countQuery)->where('users.status', 'active')->count(),
            'blocked' => (clone $countQuery)->where('users.status', 'blocked')->count(),
            'pending' => User::query()->where('status', 'pending_approval')->whereNotNull('email_verified_at')
                ->when($queryText, fn ($query, string $q) => $query->where(fn ($nested) => $nested->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%")))->count(),
            'invited' => StaffInvitation::query()->where('status', 'pending')
                ->when($queryText, fn ($query, string $q) => $query->where('email', 'like', "%{$q}%"))->count(),
        ];
        $rows = User::query()->with(['roles:id,name'])
            ->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))
            ->when($validated['q'] ?? null, fn ($query, string $q) => $query->where(fn ($nested) => $nested->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%")))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['role'] ?? null, fn ($query, string $role) => $query->whereHas('roles', fn ($roles) => $roles->where('name', $role)))
            ->when($validated['last_login_from'] ?? null, fn ($query, string $date) => $query->whereDate('last_login_at', '>=', $date))
            ->when($validated['last_login_to'] ?? null, fn ($query, string $date) => $query->whereDate('last_login_at', '<=', $date))
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('users.id')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => collect($rows->items())->map(fn (User $user) => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'avatar' => $user->avatar,
                'role' => $user->roles->first()?->name, 'status' => $user->status,
                'presence' => AdminPresence::effectiveStatus($user),
                'last_login_at' => $user->last_login_at, 'two_factor_enabled_at' => $user->two_factor_enabled_at, 'created_at' => $user->created_at,
            ])->values(),
            'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(), 'status_counts' => $statusCounts],
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::query()->whereIn('name', Role::ADMIN_NAMES)->with('permissions:id,name')->withCount('users')->get(['id', 'name'])
            ->sortBy(fn (Role $role): int => array_search($role->name, Role::ADMIN_NAMES, true) ?: 0)->values();

        return response()->json([
            'data' => $roles->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => Role::DEFINITIONS[$role->name]['label'] ?? $role->name,
                'description' => Role::DEFINITIONS[$role->name]['description'] ?? '',
                'users_count' => $role->users_count,
                'permissions' => $role->permissions,
                'system' => true,
            ])->values(),
            'permissions' => Permission::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function updateRolePermissions(UpdateRolePermissionsRequest $request, int $role): JsonResponse
    {
        abort_unless($request->user()?->roles()->where('name', 'super_admin')->exists(), 403, 'Chỉ chủ cửa hàng được sửa ma trận quyền.');
        $data = $request->validated();
        $model = Role::query()->whereIn('name', Role::ADMIN_NAMES)->findOrFail($role);
        if ($model->name === 'super_admin') {
            throw ValidationException::withMessages(['role' => 'Quyền gốc của chủ cửa hàng luôn được giữ để tránh khóa quyền quản trị.']);
        }
        $model->permissions()->sync($data['permissions']);

        return response()->json(['data' => $model->load('permissions:id,name')]);
    }

    public function store(SaveStaffRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($data['role'] === 'admin' && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được cấp vai trò quản trị viên.');
        }
        $role = Role::query()->where('name', $data['role'])->firstOrFail();
        unset($data['role']);
        $creatorId = (int) $request->user()->id;
        $user = DB::transaction(function () use ($data, $role, $creatorId): User {
            $user = User::query()->create($data + ['status' => 'active', 'created_by' => $creatorId]);
            $user->forceFill(['must_change_password' => true])->save();
            $user->roles()->attach($role->id);

            return $user;
        });

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $role->name, 'status' => $user->status]], 201);
    }

    public function update(SaveStaffRequest $request, int $staff): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->with('roles')->findOrFail($staff);
        if (! $user->roles->contains(fn (Role $role) => in_array($role->name, Role::ASSIGNABLE_ADMIN_NAMES, true))) {
            abort(404);
        }
        if ($user->roles->contains(fn (Role $role) => $role->name === 'admin') && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được sửa tài khoản quản trị viên.');
        }
        if ($request->user()?->id === $staff && ($data['status'] ?? 'active') === 'blocked') {
            throw ValidationException::withMessages(['status' => 'Không thể khóa tài khoản đang đăng nhập.']);
        }
        $roleName = $data['role'] ?? $user->roles->first()?->name;
        unset($data['role']);
        if ($roleName === 'admin' && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được cấp vai trò quản trị viên.');
        }
        if ($request->user()?->id === $staff && $roleName !== $user->roles->first()?->name) {
            throw ValidationException::withMessages(['role' => 'KhÃ´ng thá»ƒ tá»± háº¡ quyá»n tÃ i khoáº£n Ä‘ang Ä‘Äƒng nháº­p.']);
        }
        $isAdmin = $user->status === 'active' && $user->roles->contains(fn (Role $role) => $role->name === 'admin');
        $removesAdmin = $isAdmin && (($data['status'] ?? $user->status) === 'blocked' || $roleName !== 'admin');
        if ($removesAdmin && Role::query()->where('name', 'admin')->firstOrFail()->users()->where('status', 'active')->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'KhÃ´ng thá»ƒ háº¡ quyá»n hoáº·c khÃ³a admin cuá»‘i cÃ¹ng.']);
        }
        DB::transaction(function () use ($user, $data, $roleName, $removesAdmin): void {
            if ($removesAdmin) {
                $adminRole = Role::query()->where('name', 'admin')->lockForUpdate()->firstOrFail();
                if ($adminRole->users()->where('status', 'active')->count() <= 1) {
                    throw ValidationException::withMessages(['role' => 'KhÃ´ng thá»ƒ hạ quyền, khóa admin cuối cùng.']);
                }
            }
            $user->update($data);
            if ($roleName) {
                $role = Role::query()->where('name', $roleName)->firstOrFail();
                $user->roles()->sync([$role->id]);
            }
            if (($data['status'] ?? null) === 'blocked' || array_key_exists('password', $data)) {
                $user->tokens()->delete();
                DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            }
        });

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $roleName, 'status' => $user->status]]);
    }

    public function revokeSessions(Request $request, int $staff): JsonResponse
    {
        if ((int) $request->user()?->id === $staff) {
            throw ValidationException::withMessages(['staff' => 'Không thể thu hồi phiên của tài khoản đang đăng nhập.']);
        }

        $user = User::query()->with('roles')->findOrFail($staff);
        if (! $user->roles->contains(fn (Role $role) => in_array($role->name, Role::ASSIGNABLE_ADMIN_NAMES, true))) {
            abort(404);
        }
        if ($user->roles->contains(fn (Role $role) => $role->name === 'admin') && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được thu hồi phiên của quản trị viên.');
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Đã đăng xuất nhân viên khỏi tất cả thiết bị.']);
    }

    public function resetTwoFactor(ResetStaffTwoFactorRequest $request, int $staff, ResetStaffTwoFactorAction $resetTwoFactor): JsonResponse
    {
        if ((int) $request->user()?->id === $staff) {
            throw ValidationException::withMessages(['staff' => 'Không thể đặt lại xác thực hai bước cho tài khoản đang đăng nhập.']);
        }

        $user = User::query()->with('roles')->findOrFail($staff);
        if (! $user->roles->contains(fn (Role $role) => in_array($role->name, Role::ASSIGNABLE_ADMIN_NAMES, true))) {
            abort(404);
        }
        if ($user->roles->contains(fn (Role $role) => $role->name === 'admin') && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được đặt lại xác thực hai bước cho quản trị viên.');
        }

        $resetTwoFactor->execute($request->user(), $user, $request->validated('reason'), $request);

        return response()->json(['message' => 'Đã đặt lại 2FA. Nhân viên phải đăng nhập lại và thiết lập xác thực hai bước mới.']);
    }

    public function sendPasswordReset(Request $request, int $staff): JsonResponse
    {
        abort_if((int) $request->user()?->id === $staff, 422, 'Dùng trang bảo mật tài khoản để đặt lại mật khẩu của chính bạn.');
        $user = User::query()->with('roles')->findOrFail($staff);
        abort_unless($user->roles->contains(fn (Role $role) => in_array($role->name, Role::ASSIGNABLE_ADMIN_NAMES, true)), 404);
        if ($user->roles->contains(fn (Role $role) => $role->name === 'admin') && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng có thể gửi yêu cầu đặt lại mật khẩu cho quản trị viên.');
        }

        $status = Password::sendResetLink(['email' => $user->email]);
        if ($status !== Password::ResetLinkSent) {
            throw ValidationException::withMessages(['staff' => 'Không thể gửi hướng dẫn đặt lại mật khẩu cho nhân viên này.']);
        }

        return response()->json(['message' => 'Đã gửi hướng dẫn đặt lại mật khẩu tới email nhân viên.']);
    }

    public function destroy(Request $request, int $staff): JsonResponse
    {
        $user = User::query()->with('roles')->findOrFail($staff);
        if (! $user->roles->contains(fn (Role $role) => in_array($role->name, Role::ASSIGNABLE_ADMIN_NAMES, true))) {
            abort(404);
        }
        if ($user->roles->contains(fn (Role $role) => $role->name === 'admin') && ! $request->user()?->roles()->where('name', 'super_admin')->exists()) {
            abort(403, 'Chỉ chủ cửa hàng được xóa tài khoản quản trị viên.');
        }
        if ($request->user()?->id === $staff) {
            throw ValidationException::withMessages(['staff' => 'Không thể xóa tài khoản đang đăng nhập.']);
        }
        if ($user->status === 'active' && $user->roles->contains(fn (Role $role) => $role->name === 'admin') && Role::query()->where('name', 'admin')->firstOrFail()->users()->where('status', 'active')->count() <= 1) {
            throw ValidationException::withMessages(['staff' => 'Không thể xóa admin cuối cùng.']);
        }
        DB::transaction(function () use ($user): void {
            if ($user->status === 'active' && $user->roles->contains(fn (Role $role) => $role->name === 'admin')) {
                $adminRole = Role::query()->where('name', 'admin')->lockForUpdate()->firstOrFail();
                if ($adminRole->users()->where('status', 'active')->count() <= 1) {
                    throw ValidationException::withMessages(['staff' => 'KhÃ´ng thá»ƒ xóa admin cuối cùng.']);
                }
            }
            $user->tokens()->delete();
            DB::table('refresh_tokens')->where('user_id', $user->id)->update(['revoked_at' => now(), 'updated_at' => now()]);
            $user->delete();
        });

        return response()->json(['message' => 'Đã xóa tài khoản nhân viên.']);
    }
}
