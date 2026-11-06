<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var array<string, list<string>> */
    private array $permissionSets = [
        'sales_manager' => ['orders.view', 'orders.update_status', 'orders.cancel', 'customers.view', 'coupons.view', 'coupons.manage', 'reports.view'],
        'warehouse_staff' => ['products.view', 'orders.view', 'orders.update_status', 'inventory.view', 'inventory.adjust'],
        'customer_service' => ['orders.view', 'orders.update_status', 'customers.view', 'reviews.moderate'],
        'content_editor' => ['products.view', 'content.manage'],
        'accountant' => ['orders.view', 'reports.view'],
    ];

    public function up(): void
    {
        $permissionIds = DB::table('permissions')->whereIn('name', collect($this->permissionSets)->flatten()->unique())->pluck('id', 'name');
        foreach ($this->permissionSets as $name => $names) {
            $roleId = DB::table('roles')->where('name', $name)->where('guard_name', 'api')->value('id');
            if (! $roleId) {
                $roleId = DB::table('roles')->insertGetId(['name' => $name, 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now()]);
            }

            $ids = collect($names)->map(fn (string $permission) => $permissionIds[$permission] ?? null)->filter()->values();
            DB::table('permission_role')->where('role_id', $roleId)->delete();
            foreach ($ids as $permissionId) {
                DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        }
    }

    public function down(): void
    {
        foreach (array_keys($this->permissionSets) as $name) {
            $roleId = DB::table('roles')->where('name', $name)->where('guard_name', 'api')->value('id');
            if (! $roleId || DB::table('role_user')->where('role_id', $roleId)->exists()) {
                continue;
            }

            DB::table('permission_role')->where('role_id', $roleId)->delete();
            DB::table('roles')->where('id', $roleId)->delete();
        }
    }
};
