<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductDetailsBatchUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_and_variant_changes_save_together_and_initialize_stock(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $productId = $this->product('san-pham-cap-nhat-batch');

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/details", [
            'status' => 'hidden',
            'base_price' => 135000,
            'variants' => [[
                'sku' => 'BATCH-NEW-001',
                'barcode' => '123456789',
                'price' => 120000,
                'compare_at_price' => null,
                'color_value_id' => null,
                'size_value_id' => null,
                'weight_gram' => null,
                'is_active' => true,
                'initial_quantity' => 3,
            ]],
        ])->assertOk()->assertJsonPath('data.status', 'hidden')
            ->assertJsonPath('data.base_price', 135000)
            ->assertJsonPath('data.variants.0.sku', 'BATCH-NEW-001');

        $variantId = DB::table('product_variants')->where('sku', 'BATCH-NEW-001')->value('id');
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 3, 'reserved' => 0]);
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variantId,
            'type' => 'import',
            'quantity_change' => 3,
            'stock_after' => 3,
            'reference_type' => 'initial_stock',
        ]);
    }

    public function test_duplicate_variant_combinations_roll_back_the_whole_product_update(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $productId = $this->product('san-pham-cap-nhat-rollback');

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/details", [
            'status' => 'hidden',
            'variants' => [
                ['sku' => 'BATCH-DUP-001', 'price' => 100000, 'is_active' => true, 'initial_quantity' => 2],
                ['sku' => 'BATCH-DUP-002', 'price' => 110000, 'is_active' => true, 'initial_quantity' => 4],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('variants.1.color_value_id');

        $this->assertDatabaseHas('products', ['id' => $productId, 'status' => 'active']);
        $this->assertDatabaseCount('product_variants', 0);
        $this->assertDatabaseCount('inventories', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_existing_variant_edits_are_included_in_the_product_save(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $productId = $this->product('san-pham-sua-bien-the-batch');
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId,
            'sku' => 'BATCH-OLD-001',
            'barcode' => null,
            'price' => 90000,
            'compare_at_price' => null,
            'color_value_id' => null,
            'size_value_id' => null,
            'weight_gram' => null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/details", [
            'base_price' => 110000,
            'variants' => [[
                'id' => $variantId,
                'sku' => 'BATCH-UPDATED-001',
                'barcode' => '987654321',
                'price' => 105000,
                'compare_at_price' => 120000,
                'color_value_id' => null,
                'size_value_id' => null,
                'weight_gram' => 450,
                'is_active' => true,
            ]],
        ])->assertOk()->assertJsonPath('data.variants.0.sku', 'BATCH-UPDATED-001')
            ->assertJsonPath('data.variants.0.price', 105000);

        $this->assertDatabaseHas('products', ['id' => $productId, 'base_price' => 110000]);
        $this->assertDatabaseHas('product_variants', [
            'id' => $variantId,
            'sku' => 'BATCH-UPDATED-001',
            'price' => 105000,
            'compare_at_price' => 120000,
            'weight_gram' => 450,
        ]);
    }

    public function test_product_image_metadata_order_primary_and_deletions_save_in_the_details_transaction(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $productId = $this->product('san-pham-anh-batch');
        $primaryId = DB::table('product_images')->insertGetId([
            'product_id' => $productId,
            'url' => 'https://example.test/primary.jpg',
            'alt' => 'Ảnh cũ',
            'sort_order' => 0,
            'is_primary' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $deleteId = DB::table('product_images')->insertGetId([
            'product_id' => $productId,
            'url' => 'https://example.test/remove.jpg',
            'alt' => null,
            'sort_order' => 1,
            'is_primary' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/details", [
            'status' => 'hidden',
            'images' => [[
                'id' => $primaryId,
                'alt' => 'Ảnh mới',
                'sort_order' => 2,
                'is_primary' => true,
                'color_value_id' => null,
            ]],
            'delete_image_ids' => [$deleteId],
        ])->assertOk()->assertJsonPath('data.thumbnail', 'https://example.test/primary.jpg')
            ->assertJsonPath('data.images.0.alt', 'Ảnh mới')
            ->assertJsonPath('data.images.0.sort_order', 2);

        $this->assertDatabaseHas('products', ['id' => $productId, 'status' => 'hidden', 'thumbnail' => 'https://example.test/primary.jpg']);
        $this->assertDatabaseHas('product_images', ['id' => $primaryId, 'alt' => 'Ảnh mới', 'sort_order' => 2, 'is_primary' => true]);
        $this->assertDatabaseMissing('product_images', ['id' => $deleteId]);
    }

    public function test_invalid_product_image_batch_rolls_back_product_fields_and_preserves_images(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $productId = $this->product('san-pham-anh-batch-rollback');
        $imageId = DB::table('product_images')->insertGetId([
            'product_id' => $productId,
            'url' => 'https://example.test/kept.jpg',
            'alt' => 'Giữ nguyên',
            'sort_order' => 0,
            'is_primary' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/details", [
            'status' => 'hidden',
            'images' => [],
            'delete_image_ids' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors('images');

        $this->assertDatabaseHas('products', ['id' => $productId, 'status' => 'active']);
        $this->assertDatabaseHas('product_images', ['id' => $imageId, 'alt' => 'Giữ nguyên', 'is_primary' => true]);
    }

    public function test_product_tags_are_normalized_reused_and_synced(): void
    {
        $user = User::factory()->create();
        $token = $this->adminToken($user);
        $firstProductId = $this->product('san-pham-tag-thu-nhat');
        $secondProductId = $this->product('san-pham-tag-thu-hai');

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$firstProductId}/details", [
            'tags' => ['Áo Mới', 'Denim'],
        ])->assertOk()->assertJsonCount(2, 'data.tags');
        $this->withToken($token)->patchJson("/api/v1/admin/products/{$secondProductId}/details", [
            'tags' => ['Ao Moi'],
        ])->assertOk()->assertJsonPath('data.tags.0.slug', 'ao-moi');

        $normalizedTagId = DB::table('tags')->where('slug', 'ao-moi')->value('id');
        $this->assertDatabaseCount('tags', 2);
        $this->assertDatabaseHas('product_tag', ['product_id' => $firstProductId, 'tag_id' => $normalizedTagId]);
        $this->assertDatabaseHas('product_tag', ['product_id' => $secondProductId, 'tag_id' => $normalizedTagId]);

        $this->withToken($token)->patchJson("/api/v1/admin/products/{$firstProductId}/details", [
            'tags' => ['Denim'],
        ])->assertOk()->assertJsonCount(1, 'data.tags');
        $this->assertDatabaseMissing('product_tag', ['product_id' => $firstProductId, 'tag_id' => $normalizedTagId]);
    }

    private function adminToken(User $user): string
    {
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $permissions = collect(['products.view', 'products.update'])
            ->map(fn (string $name) => Permission::query()->create(['name' => $name, 'guard_name' => 'api']));
        $role->permissions()->attach($permissions);
        $user->roles()->attach($role);

        return $this->createApiToken($user, 'admin', 'product-details-batch')->plainTextToken;
    }

    private function product(string $slug): int
    {
        return (int) DB::table('products')->insertGetId([
            'name' => 'Sản phẩm cập nhật theo lô',
            'slug' => $slug,
            'base_price' => 100000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
