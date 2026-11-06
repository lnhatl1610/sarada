<?php

namespace App\Modules\Reporting\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EligibleReportRecipients
{
    /** @param list<string> $emails
     * @return list<string>
     */
    public function __invoke(array $emails): array
    {
        $normalized = collect($emails)->map(fn (string $email): string => mb_strtolower($email))->unique()->values();
        $eligible = DB::table('users')->where('status', 'active')->whereNull('deleted_at')
            ->whereIn(DB::raw('LOWER(email)'), $normalized)
            ->whereExists(fn ($staffQuery) => $staffQuery->selectRaw('1')->from('role_user')->join('roles', 'roles.id', '=', 'role_user.role_id')
                ->whereColumn('role_user.user_id', 'users.id')->where('roles.guard_name', 'api')->where('roles.name', '!=', 'customer'))
            ->where(function ($query): void {
                $query->whereExists(fn ($roleQuery) => $roleQuery->selectRaw('1')->from('role_user')->join('roles', 'roles.id', '=', 'role_user.role_id')
                    ->join('permission_role', 'permission_role.role_id', '=', 'roles.id')
                    ->join('permissions', 'permissions.id', '=', 'permission_role.permission_id')
                    ->whereColumn('role_user.user_id', 'users.id')->where('permissions.name', 'reports.view')->where('permissions.guard_name', 'api'))
                    ->orWhereExists(fn ($adminQuery) => $adminQuery->selectRaw('1')->from('role_user')->join('roles', 'roles.id', '=', 'role_user.role_id')
                        ->whereColumn('role_user.user_id', 'users.id')->where('roles.name', 'super_admin')->where('roles.guard_name', 'api'))
                    ;
            })
            ->pluck('email')->map(fn (string $email): string => mb_strtolower($email));

        return $normalized->intersect($eligible)->values()->all();
    }

    /** @param list<string> $emails */
    public function assertAllAllowed(array $emails): void
    {
        if (count($this($emails)) !== count(array_unique(array_map('mb_strtolower', $emails)))) {
            throw ValidationException::withMessages(['recipients' => 'Người nhận phải là tài khoản nhân viên đang hoạt động có quyền xem báo cáo.']);
        }
    }
}
