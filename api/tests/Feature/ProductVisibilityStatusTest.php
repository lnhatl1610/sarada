<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductVisibilityStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_hidden_is_a_visibility_status_and_archiving_remains_a_soft_delete_action(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $permissions = collect(['products.view', 'products.update', 'products.delete'])
            ->map(fn (string $name) => Permission::query()->create(['name' => $name, 'guard_name' => 'api']));
        $role->permissions()->attach($permissions);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'admin-product-status')->plainTextToken;

        $productId = DB::table('products')->insertGetId([
            'name' => 'Sản phẩm kiểm tra trạng thái',
            'slug' => 'san-pham-kiem-tra-trang-thai',
            'base_price' => 100000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)
            ->patchJson("/api/v1/admin/products/{$productId}/details", ['status' => 'hidden'])
            ->assertOk()
            ->assertJsonPath('data.status', 'hidden');
        $this->assertDatabaseHas('products', ['id' => $productId, 'status' => 'hidden']);

        $this->withToken($token)
            ->patchJson("/api/v1/admin/products/{$productId}/details", ['status' => 'archived'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->withToken($token)
            ->deleteJson("/api/v1/admin/products/{$productId}")
            ->assertOk();
        $this->assertSoftDeleted('products', ['id' => $productId]);
    }
}
