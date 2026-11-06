<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment(['local', 'testing'])) {
            $this->call(CatalogSeeder::class);
            $this->call(StorefrontDemoSeeder::class);
        }

        $this->call(AdminPermissionsSeeder::class);
        $superAdmin = Role::query()->where('name', 'super_admin')->firstOrFail();

        $email = config('store.admin_seed_email');
        $password = config('store.admin_seed_password');
        if ($email && $password) {
            $user = User::query()->firstOrCreate(
                ['email' => $email],
                ['name' => 'Store Administrator', 'password' => Hash::make($password), 'status' => 'active'],
            );
            $user->roles()->syncWithoutDetaching([$superAdmin->id]);
        }

        if (app()->environment(['local', 'testing'])) {
            $this->call(StorefrontOrderDemoSeeder::class);
            $this->call(AdminWorkflowDemoSeeder::class);
        }
    }
}
