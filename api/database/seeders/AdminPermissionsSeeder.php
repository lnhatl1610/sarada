<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AdminPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'products.view', 'products.create', 'products.update', 'products.delete',
            'orders.view', 'orders.update_status', 'orders.cancel',
            'inventory.view', 'inventory.adjust', 'coupons.view', 'coupons.manage', 'staff.view_performance',
            'customers.view', 'users.manage', 'staff.security', 'reports.view', 'reports.schedule', 'content.manage', 'reviews.moderate', 'settings.manage', 'tasks.assign', 'system.health', 'system.backup', 'api_tokens.manage',
        ];
        $permissions = collect($names)->map(fn (string $name) => Permission::query()->firstOrCreate(['name' => $name, 'guard_name' => 'api']));
        $superAdmin = Role::query()->firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']);
        $admin = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $staff = Role::query()->firstOrCreate(['name' => 'staff', 'guard_name' => 'api']);
        Role::query()->firstOrCreate(['name' => 'customer', 'guard_name' => 'api']);
        $superAdmin->permissions()->sync($permissions->pluck('id')->all());
        $admin->permissions()->sync($permissions->pluck('id')->all());
        $staff->permissions()->sync($permissions->whereIn('name', ['products.view', 'orders.view', 'orders.update_status', 'inventory.view', 'customers.view', 'reviews.moderate', 'coupons.view'])->pluck('id')->all());

        $sets = [
            'sales_manager' => ['orders.view', 'orders.update_status', 'orders.cancel', 'customers.view', 'coupons.view', 'coupons.manage', 'reports.view'],
            'warehouse_staff' => ['products.view', 'orders.view', 'orders.update_status', 'inventory.view', 'inventory.adjust'],
            'customer_service' => ['orders.view', 'orders.update_status', 'customers.view', 'reviews.moderate'],
            'content_editor' => ['products.view', 'content.manage'],
            'accountant' => ['orders.view', 'reports.view'],
        ];
        foreach ($sets as $name => $permissionNames) {
            Role::query()->firstOrCreate(['name' => $name, 'guard_name' => 'api'])
                ->permissions()->sync($permissions->whereIn('name', $permissionNames)->pluck('id')->all());
        }
    }
}
