<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminCatalogEditDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_collection_and_coupon_detail_routes_return_editable_resource_data(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'catalog-editor', 'guard_name' => 'api']);
        $role->permissions()->attach([
            Permission::query()->create(['name' => 'products.view', 'guard_name' => 'api'])->id,
            Permission::query()->create(['name' => 'coupons.view', 'guard_name' => 'api'])->id,
        ]);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'catalog-edit-details')->plainTextToken;

        $collectionId = DB::table('collections')->insertGetId([
            'name' => 'Áo mùa thu', 'slug' => 'ao-mua-thu', 'description' => 'Mô tả', 'banner' => '/banner.webp',
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $couponId = DB::table('coupons')->insertGetId([
            'code' => 'AUTUMN10', 'type' => 'percent', 'value' => 10, 'min_order_value' => 100000,
            'used_count' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->getJson("/api/v1/admin/catalog-options/collections/{$collectionId}")
            ->assertOk()
            ->assertJsonPath('data.id', $collectionId)
            ->assertJsonPath('data.name', 'Áo mùa thu')
            ->assertJsonPath('data.description', 'Mô tả');

        $this->withToken($token)->getJson("/api/v1/admin/campaigns/coupons/{$couponId}")
            ->assertOk()
            ->assertJsonPath('data.id', $couponId)
            ->assertJsonPath('data.code', 'AUTUMN10')
            ->assertJsonPath('data.min_order_value', 100000)
            ->assertJsonPath('data.used_count', 2);

        $this->withToken($token)->getJson('/api/v1/admin/catalog-options/collections/999999')->assertNotFound();
        $this->withToken($token)->getJson('/api/v1/admin/campaigns/coupons/999999')->assertNotFound();
    }

    public function test_detail_routes_require_the_matching_read_permission(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'admin', 'catalog-edit-details-no-permission')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/admin/catalog-options/collections/1')->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/admin/campaigns/coupons/1')->assertForbidden();
    }
}
