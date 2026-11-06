<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'system.health')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'system.health', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $roleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin'])->where('guard_name', 'api')->pluck('id');
        foreach ($roleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        // Keep this permission row on rollback because AdminPermissionsSeeder also owns it.
    }
};
