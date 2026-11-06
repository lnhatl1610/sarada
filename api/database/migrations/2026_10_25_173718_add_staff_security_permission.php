<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'staff.security')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'staff.security', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $roleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin'])->where('guard_name', 'api')->pluck('id');
        foreach ($roleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        // Keep the permission because AdminPermissionsSeeder also owns it.
    }
};
