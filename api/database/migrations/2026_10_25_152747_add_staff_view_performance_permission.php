<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'staff.view_performance')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'staff.view_performance',
                'guard_name' => 'api',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (['admin', 'super_admin'] as $name) {
            $roleId = DB::table('roles')->where('name', $name)->where('guard_name', 'api')->value('id');
            if (! $roleId) {
                $roleId = DB::table('roles')->insertGetId([
                    'name' => $name,
                    'guard_name' => 'api',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'staff.view_performance')->where('guard_name', 'api')->value('id');
        if ($permissionId) {
            DB::table('permission_role')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
    }
};
