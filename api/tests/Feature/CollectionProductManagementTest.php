<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CollectionProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private function tokenWith(string $permission): array
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff-'.bin2hex(random_bytes(3)), 'guard_name' => 'api']);
        $ability = Permission::query()->create(['name' => $permission, 'guard_name' => 'api']);
        $role->permissions()->attach($ability);
        $user->roles()->attach($role);

        return [$user, $this->createApiToken($user, 'admin', 'collection-test')->plainTextToken, $role];
    }

    private function collectionId(): int
    {
        return DB::table('collections')->insertGetId([
            'name' => 'Bộ sưu tập thử nghiệm',
            'slug' => 'bo-suu-tap-thu-nghiem',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function productId(string $slug): int
    {
        return DB::table('products')->insertGetId([
            'name' => 'Sản phẩm '.$slug,
            'slug' => $slug,
            'base_price' => 100000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_staff_can_add_and_remove_products_from_a_collection(): void
    {
        [, $token] = $this->tokenWith('products.update');
        $collectionId = $this->collectionId();
        $firstProduct = $this->productId('san-pham-bo-suu-tap-mot');
        $secondProduct = $this->productId('san-pham-bo-suu-tap-hai');

        $this->withToken($token)->postJson("/api/v1/admin/collections/{$collectionId}/products", [
            'product_ids' => [$firstProduct, $secondProduct],
        ])->assertOk()->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('collection_product', ['collection_id' => $collectionId, 'product_id' => $firstProduct, 'sort_order' => 0]);
        $this->assertDatabaseHas('collection_product', ['collection_id' => $collectionId, 'product_id' => $secondProduct, 'sort_order' => 1]);

        $this->withToken($token)->deleteJson("/api/v1/admin/collections/{$collectionId}/products/{$firstProduct}")
            ->assertOk()->assertJsonCount(1, 'data');
        $this->assertDatabaseMissing('collection_product', ['collection_id' => $collectionId, 'product_id' => $firstProduct]);
    }

    public function test_collection_product_updates_require_permission_and_validate_product_ids(): void
    {
        $collectionId = $this->collectionId();
        $productId = $this->productId('san-pham-bo-suu-tap-ba');
        [, $viewToken, $role] = $this->tokenWith('products.view');

        $this->withToken($viewToken)->postJson("/api/v1/admin/collections/{$collectionId}/products", ['product_ids' => [$productId]])
            ->assertForbidden();
        $updatePermission = Permission::query()->create(['name' => 'products.update', 'guard_name' => 'api']);
        $role->permissions()->attach($updatePermission);
        $this->withToken($viewToken)->postJson("/api/v1/admin/collections/{$collectionId}/products", ['product_ids' => [999999]])
            ->assertUnprocessable()->assertJsonValidationErrors('product_ids.0');
    }

    public function test_collection_product_management_requires_authentication(): void
    {
        $collectionId = $this->collectionId();

        $this->postJson("/api/v1/admin/collections/{$collectionId}/products", ['product_ids' => [1]])
            ->assertUnauthorized();
    }
}
