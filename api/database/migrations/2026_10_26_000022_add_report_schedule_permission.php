<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::query()->firstOrCreate(['name' => 'reports.schedule', 'guard_name' => 'api']);
        Role::query()->whereIn('name', ['admin', 'super_admin'])->each(function (Role $role) use ($permission): void {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        });
    }

    public function down(): void
    {
        $permission = Permission::query()->where('name', 'reports.schedule')->where('guard_name', 'api')->first();
        if (! $permission) {
            return;
        }

        $permission->roles()->detach();
        $permission->delete();
    }
};
