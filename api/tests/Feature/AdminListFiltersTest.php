<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminListFiltersTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(string $permission): array
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $ability = Permission::query()->create(['name' => $permission, 'guard_name' => 'api']);
        $role->permissions()->attach($ability);
        $user->roles()->attach($role);

        return [$user, $this->createApiToken($user, 'admin', 'admin-test')->plainTextToken];
    }

    private function order(array $overrides = []): int
    {
        return DB::table('orders')->insertGetId($overrides + [
            'code' => 'TEST-'.bin2hex(random_bytes(5)),
            'customer_name' => 'Nguyễn An',
            'customer_phone' => '0900000000',
            'shipping_address' => json_encode(['province_code' => '01']),
            'subtotal' => 200000,
            'grand_total' => 200000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_admin_product_search_matches_product_and_variant_skus(): void
    {
        [, $token] = $this->adminToken('products.view');

        foreach ([
            ['slug' => 'product-sku-match', 'product_sku' => 'NEEDLE-PRODUCT-001', 'variant_sku' => 'VARIANT-001'],
            ['slug' => 'variant-sku-match', 'product_sku' => 'PRODUCT-002', 'variant_sku' => 'NEEDLE-VARIANT-002'],
            ['slug' => 'unmatched-product', 'product_sku' => 'PRODUCT-003', 'variant_sku' => 'VARIANT-003'],
        ] as $index => $row) {
            $productId = DB::table('products')->insertGetId([
                'name' => 'Sản phẩm tìm kiếm '.$index,
                'slug' => $row['slug'],
                'sku' => $row['product_sku'],
                'base_price' => 100000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('product_variants')->insert([
                'product_id' => $productId,
                'sku' => $row['variant_sku'],
                'price' => 100000,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->withToken($token)->getJson('/api/v1/admin/products?q=NEEDLE')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['slug' => 'product-sku-match'])
            ->assertJsonFragment(['slug' => 'variant-sku-match'])
            ->assertJsonPath('data.0.variants_count', 1)
            ->assertJsonPath('data.0.active_variants_count', 1)
            ->assertJsonPath('data.0.stock_quantity', 0)
            ->assertJsonPath('data.0.available_stock', 0);
    }

    public function test_inventory_list_filters_by_category_sorts_available_stock_and_returns_latest_movement(): void
    {
        [$user, $token] = $this->adminToken('inventory.view');
        $parentId = DB::table('categories')->insertGetId(['name' => 'Áo', 'slug' => 'ao', 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('categories')->insertGetId(['parent_id' => $parentId, 'name' => 'Áo khoác', 'slug' => 'ao-khoac', 'created_at' => now(), 'updated_at' => now()]);
        $otherCategoryId = DB::table('categories')->insertGetId(['name' => 'Giày', 'slug' => 'giay', 'created_at' => now(), 'updated_at' => now()]);
        $colorAttributeId = DB::table('attributes')->insertGetId(['name' => 'Inventory colors', 'type' => 'color', 'created_at' => now(), 'updated_at' => now()]);
        $colorId = DB::table('attribute_values')->insertGetId(['attribute_id' => $colorAttributeId, 'value' => 'Đỏ', 'created_at' => now(), 'updated_at' => now()]);
        $sizeAttributeId = DB::table('attributes')->insertGetId(['name' => 'Inventory sizes', 'type' => 'size', 'created_at' => now(), 'updated_at' => now()]);
        $sizeId = DB::table('attribute_values')->insertGetId(['attribute_id' => $sizeAttributeId, 'value' => 'M', 'created_at' => now(), 'updated_at' => now()]);

        $variantIds = [];
        foreach ([['AOK-LOW', 5, 2, $categoryId], ['AOK-HIGH', 10, 8, $categoryId], ['GIAY', 50, 45, $otherCategoryId]] as [$sku, $quantity, $available, $productCategoryId]) {
            $productId = DB::table('products')->insertGetId([
                'category_id' => $productCategoryId,
                'name' => $sku,
                'slug' => strtolower($sku),
                'base_price' => 100000,
                'thumbnail' => $sku === 'AOK-LOW' ? 'storage/products/inventory-test.webp' : null,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $variantId = DB::table('product_variants')->insertGetId([
                'product_id' => $productId,
                'sku' => $sku,
                'barcode' => $sku === 'AOK-LOW' ? 'BARCODE-LOW' : null,
                'price' => 100000,
                'color_value_id' => $sku === 'AOK-LOW' ? $colorId : null,
                'size_value_id' => $sku === 'AOK-LOW' ? $sizeId : null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('inventories')->insert([
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'reserved' => $quantity - $available,
                'low_stock_threshold' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $variantIds[$sku] = $variantId;
        }
        DB::table('inventory_movements')->insert([
            'variant_id' => $variantIds['AOK-HIGH'],
            'type' => 'import',
            'quantity_change' => 10,
            'stock_after' => 10,
            'reference_type' => 'csv_import',
            'note' => 'Đợt nhập tháng 10',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('inventory_movements')->insert([
            'variant_id' => $variantIds['AOK-LOW'],
            'type' => 'adjust',
            'quantity_change' => -3,
            'stock_after' => 2,
            'reference_type' => 'manual_adjustment',
            'note' => 'Điều chỉnh kiểm kê',
            'created_by' => $user->id,
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);

        $this->withToken($token)->getJson("/api/v1/admin/inventory?category_id={$categoryId}&sort=-available")
            ->assertOk()
            ->assertJsonPath('data.0.sku', 'AOK-HIGH')
            ->assertJsonPath('data.0.last_movement_type', 'import')
            ->assertJsonPath('data.0.last_movement_change', 10)
            ->assertJsonPath('filters.categories.1.parent_name', 'Áo')
            ->assertJsonCount(2, 'data');

        $this->withToken($token)->getJson('/api/v1/admin/inventory?q=BARCODE-LOW')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.barcode', 'BARCODE-LOW')
            ->assertJsonPath('data.0.color_name', 'Đỏ')
            ->assertJsonPath('data.0.size_name', 'M')
            ->assertJsonPath('data.0.thumbnail', 'storage/products/inventory-test.webp');

        $this->withToken($token)->getJson('/api/v1/admin/inventory/export?category_id='.$categoryId.'&sort=-available')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->withToken($token)->getJson('/api/v1/admin/operations/movements?sort=quantity_change')
            ->assertOk()
            ->assertJsonPath('data.0.quantity_change', -3)
            ->assertJsonPath('data.1.quantity_change', 10);
        $this->withToken($token)->getJson('/api/v1/admin/operations/movements?status=adjust&q=AOK-LOW')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'adjust')
            ->assertJsonPath('data.0.reference_type', 'manual_adjustment')
            ->assertJsonPath('data.0.note', 'Điều chỉnh kiểm kê')
            ->assertJsonPath('data.0.creator_name', $user->name);
        $this->withToken($token)->getJson('/api/v1/admin/operations/movements?sort=unsupported')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');
    }

    public function test_inventory_csv_import_uses_inventory_action_and_reports_unknown_skus_by_line(): void
    {
        [$user, $token] = $this->adminToken('inventory.adjust');
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Import', 'slug' => 'import', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $productId = DB::table('products')->insertGetId([
            'category_id' => $categoryId,
            'name' => 'Import product',
            'slug' => 'import-product',
            'base_price' => 100000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId,
            'sku' => 'IMPORT-001',
            'price' => 100000,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('inventories')->insert([
            'variant_id' => $variantId,
            'quantity' => 4,
            'reserved' => 2,
            'low_stock_threshold' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $file = UploadedFile::fake()->createWithContent(
            'inventory.csv',
            "sku,quantity,note\nIMPORT-001,7,Restock\nUNKNOWN-001,3,Missing SKU\n",
        );

        $this->withToken($token)
            ->postJson('/api/v1/admin/inventory/import-csv', ['file' => $file])
            ->assertStatus(207)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.errors.0.line', 3)
            ->assertJsonPath('data.errors.0.sku', 'UNKNOWN-001');

        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 11, 'reserved' => 2]);
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variantId,
            'type' => 'import',
            'quantity_change' => 7,
            'stock_after' => 11,
            'reference_type' => 'csv_import',
            'note' => 'Restock',
            'created_by' => $user->id,
        ]);
        $this->assertDatabaseCount('inventory_movements', 1);
    }

    public function test_order_list_searches_email_filters_shipping_and_totals_and_sorts_on_the_server(): void
    {
        [, $token] = $this->adminToken('orders.view');
        $shippingMethodId = DB::table('shipping_methods')->insertGetId(['name' => 'Giao nhanh', 'fee' => 30000, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $otherShippingMethodId = DB::table('shipping_methods')->insertGetId(['name' => 'Giao tiết kiệm', 'fee' => 15000, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);

        foreach ([
            ['code' => 'ORDER-LOW', 'grand_total' => 150000, 'shipping_method_id' => $shippingMethodId, 'placed_at' => now()->subDay()],
            ['code' => 'ORDER-HIGH', 'grand_total' => 450000, 'shipping_method_id' => $shippingMethodId, 'placed_at' => now()],
            ['code' => 'ORDER-OTHER', 'grand_total' => 300000, 'shipping_method_id' => $otherShippingMethodId, 'placed_at' => now()],
        ] as $order) {
            DB::table('orders')->insert([
                'code' => $order['code'],
                'customer_name' => 'Nguyễn An',
                'customer_email' => $order['code'] === 'ORDER-OTHER' ? 'other@example.test' : 'an@example.test',
                'customer_phone' => '0900000000',
                'shipping_address' => json_encode(['province_code' => '01']),
                'subtotal' => $order['grand_total'],
                'grand_total' => $order['grand_total'],
                'shipping_method_id' => $order['shipping_method_id'],
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'cod',
                'placed_at' => $order['placed_at'],
                'created_at' => $order['placed_at'],
                'updated_at' => $order['placed_at'],
            ]);
        }

        $this->withToken($token)->getJson("/api/v1/admin/orders?q=an%40example.test&shipping_method_id={$shippingMethodId}&min_total=100000&max_total=500000&sort=-grand_total")
            ->assertOk()
            ->assertJsonPath('data.0.code', 'ORDER-HIGH')
            ->assertJsonPath('data.1.code', 'ORDER-LOW')
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $shippingMethodId, 'name' => 'Giao nhanh']);

        $this->withToken($token)->getJson("/api/v1/admin/orders/export?q=an%40example.test&shipping_method_id={$shippingMethodId}&sort=-grand_total")
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_order_list_filters_failed_payment_rows_and_reports_failed_payment_count(): void
    {
        [, $token] = $this->adminToken('orders.view');
        $failedOrderId = $this->order(['code' => 'ORDER-PAYMENT-FAILED']);
        $this->order(['code' => 'ORDER-PAYMENT-OK']);

        DB::table('payments')->insert([
            'order_id' => $failedOrderId,
            'method' => 'cod',
            'amount' => 200000,
            'status' => 'failed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/orders?payment_status=failed&payment_method=cod')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $failedOrderId)
            ->assertJsonPath('data.0.failed_payment_count', 1);

        $this->withToken($token)->getJson('/api/v1/admin/orders?payment_status=invalid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_status');

        $export = $this->withToken($token)->get('/api/v1/admin/orders/export?payment_status=failed');
        $export->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $csv = $export->streamedContent();
        $this->assertStringContainsString('ORDER-PAYMENT-FAILED', $csv);
        $this->assertStringNotContainsString('ORDER-PAYMENT-OK', $csv);
    }

    public function test_inventory_adjustment_cannot_reduce_stock_below_reserved_quantity(): void
    {
        [, $token] = $this->adminToken('inventory.adjust');
        $this->withToken($token)->postJson('/api/v1/admin/inventory/999/adjust', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity_change', 'reason']);
        $this->withToken($token)->postJson('/api/v1/admin/inventory/999/adjust', ['quantity_change' => -1, 'reason' => 'Kiểm kê âm', 'type' => 'import'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity_change');

        $productId = DB::table('products')->insertGetId([
            'name' => 'Áo kiểm thử tồn kho', 'slug' => 'ao-kiem-thu-ton-kho', 'base_price' => 100000,
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId, 'sku' => 'TEST-STOCK-1', 'price' => 100000,
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('inventories')->insert([
            'variant_id' => $variantId, 'quantity' => 4, 'reserved' => 2, 'low_stock_threshold' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->postJson("/api/v1/admin/inventory/{$variantId}/adjust", ['quantity_change' => -3, 'reason' => 'Kiểm kê âm'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity_change');
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 4, 'reserved' => 2]);
        $this->assertDatabaseMissing('inventory_movements', ['variant_id' => $variantId]);

        $this->withToken($token)->postJson("/api/v1/admin/inventory/{$variantId}/adjust", ['quantity_change' => -2, 'reason' => 'Kiểm kê âm'])
            ->assertOk()
            ->assertJsonPath('data.movement.type', 'adjust')
            ->assertJsonPath('data.movement.quantity_change', -2)
            ->assertJsonPath('data.quantity', 2);
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 2, 'reserved' => 2]);
        $this->assertDatabaseHas('inventory_movements', ['variant_id' => $variantId, 'type' => 'adjust', 'quantity_change' => -2, 'stock_after' => 2]);

        $this->withToken($token)->postJson("/api/v1/admin/inventory/{$variantId}/adjust", ['quantity_change' => 3, 'reason' => 'Nhập bổ sung', 'type' => 'import'])
            ->assertOk()
            ->assertJsonPath('data.movement.type', 'import')
            ->assertJsonPath('data.movement.stock_after', 5);
    }

    public function test_order_transitions_enforce_valid_edges_record_history_and_restore_stock(): void
    {
        [, $token] = $this->adminToken('orders.update_status');
        $productId = DB::table('products')->insertGetId([
            'name' => 'Áo kiểm thử đơn hàng', 'slug' => 'ao-kiem-thu-don-hang', 'base_price' => 100000,
            'sold_count' => 2, 'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId, 'sku' => 'TEST-ORDER-1', 'price' => 100000,
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('inventories')->insert([
            'variant_id' => $variantId, 'quantity' => 8, 'reserved' => 2, 'low_stock_threshold' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $cancelOrderId = $this->order();
        DB::table('order_items')->insert([
            'order_id' => $cancelOrderId, 'product_id' => $productId, 'variant_id' => $variantId,
            'product_name' => 'Áo kiểm thử đơn hàng', 'sku' => 'TEST-ORDER-1', 'unit_price' => 100000,
            'quantity' => 2, 'line_total' => 200000, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$cancelOrderId}/status", ['status' => 'cancelled', 'note' => 'Khách yêu cầu hủy'])
            ->assertOk();
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 8, 'reserved' => 0]);
        $this->assertDatabaseHas('inventory_movements', ['variant_id' => $variantId, 'type' => 'release', 'quantity_change' => -2, 'stock_after' => 8]);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $cancelOrderId, 'from_status' => 'pending', 'to_status' => 'cancelled']);
        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$cancelOrderId}/status", ['status' => 'confirmed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $returnOrderId = $this->order(['status' => 'delivered', 'code' => 'TEST-RETURN-'.bin2hex(random_bytes(4))]);
        DB::table('order_items')->insert([
            'order_id' => $returnOrderId, 'product_id' => $productId, 'variant_id' => $variantId,
            'product_name' => 'Áo kiểm thử đơn hàng', 'sku' => 'TEST-ORDER-1', 'unit_price' => 100000,
            'quantity' => 2, 'line_total' => 200000, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('order_change_requests')->insert([
            'order_id' => $returnOrderId, 'requester_id' => null, 'reviewed_by' => null,
            'type' => 'return', 'status' => 'approved', 'reason' => 'Sản phẩm bị lỗi',
            'reviewed_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$returnOrderId}/status", ['status' => 'returned', 'note' => 'Khách trả hàng'])
            ->assertOk();
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 10, 'reserved' => 0]);
        $this->assertDatabaseHas('inventory_movements', ['variant_id' => $variantId, 'type' => 'return', 'quantity_change' => 2, 'stock_after' => 10]);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $returnOrderId, 'from_status' => 'delivered', 'to_status' => 'returned']);
        $this->assertDatabaseHas('products', ['id' => $productId, 'sold_count' => 0]);

        DB::table('inventories')->where('variant_id', $variantId)->update(['quantity' => 8, 'reserved' => 0]);
        DB::table('products')->where('id', $productId)->update(['sold_count' => 2]);
        $deliveryOrderId = $this->order(['status' => 'shipping', 'code' => 'TEST-DELIVERY-'.bin2hex(random_bytes(4))]);
        DB::table('order_items')->insert([
            'order_id' => $deliveryOrderId, 'product_id' => $productId, 'variant_id' => $variantId,
            'product_name' => 'Test product', 'sku' => 'TEST-ORDER-1', 'unit_price' => 100000,
            'quantity' => 2, 'line_total' => 200000, 'created_at' => now(), 'updated_at' => now(),
        ]);
        app(InventoryService::class)->reserveForOrder($variantId, 2, $deliveryOrderId, 'Checkout reservation', null);
        DB::table('payments')->insert([
            'order_id' => $deliveryOrderId, 'method' => 'cod', 'amount' => 200000, 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$deliveryOrderId}/status", ['status' => 'delivered', 'payment_collected' => true])
            ->assertOk();
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 6, 'reserved' => 0]);
        $this->assertDatabaseHas('inventory_movements', ['variant_id' => $variantId, 'type' => 'sale', 'quantity_change' => -2, 'stock_after' => 6]);
        $this->assertDatabaseHas('products', ['id' => $productId, 'sold_count' => 4]);
        $this->assertDatabaseHas('payments', ['order_id' => $deliveryOrderId, 'status' => 'paid']);

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$deliveryOrderId}/status", ['status' => 'returned'])
            ->assertOk();
        $this->assertDatabaseHas('inventories', ['variant_id' => $variantId, 'quantity' => 8, 'reserved' => 0]);
        $this->assertDatabaseHas('inventory_movements', ['variant_id' => $variantId, 'type' => 'return', 'quantity_change' => 2, 'stock_after' => 8]);
        $this->assertDatabaseHas('products', ['id' => $productId, 'sold_count' => 2]);
    }

    public function test_variant_sale_price_and_product_rating_aggregates_stay_in_sync(): void
    {
        [$user, $token] = $this->adminToken('products.create');
        $role = $user->roles()->firstOrFail();
        foreach (['products.update', 'reviews.moderate'] as $permissionName) {
            $permission = Permission::query()->create(['name' => $permissionName, 'guard_name' => 'api']);
            $role->permissions()->attach($permission);
        }
        $productId = DB::table('products')->insertGetId([
            'name' => 'Sản phẩm đồng bộ tổng hợp', 'slug' => 'san-pham-dong-bo-tong-hop',
            'base_price' => 100000, 'status' => 'active', 'rating_avg' => 0, 'rating_count' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $colorAttributeId = DB::table('attributes')->insertGetId([
            'name' => 'Màu kiểm thử', 'type' => 'color', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $firstColorId = DB::table('attribute_values')->insertGetId([
            'attribute_id' => $colorAttributeId, 'value' => 'Đỏ kiểm thử', 'color_hex' => '#ff0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $secondColorId = DB::table('attribute_values')->insertGetId([
            'attribute_id' => $colorAttributeId, 'value' => 'Xanh kiểm thử', 'color_hex' => '#0000ff',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->postJson("/api/v1/admin/products/{$productId}/variants", [
            'sku' => 'TEST-SALE-1', 'price' => 80000, 'compare_at_price' => 100000,
            'color_value_id' => $firstColorId, 'initial_quantity' => 0,
        ])->assertCreated();
        $this->assertDatabaseHas('products', ['id' => $productId, 'sale_price' => 80000]);
        $secondVariant = $this->withToken($token)->postJson("/api/v1/admin/products/{$productId}/variants", [
            'sku' => 'TEST-SALE-2', 'price' => 70000, 'compare_at_price' => 100000,
            'color_value_id' => $secondColorId, 'initial_quantity' => 0,
        ])->assertCreated()->json('data.id');
        $this->assertDatabaseHas('products', ['id' => $productId, 'sale_price' => 70000]);
        $this->withToken($token)->patchJson("/api/v1/admin/products/{$productId}/variants/{$secondVariant}", ['is_active' => false])->assertOk();
        $this->assertDatabaseHas('products', ['id' => $productId, 'sale_price' => 80000]);

        $customer = User::factory()->create();
        $firstReview = DB::table('reviews')->insertGetId([
            'product_id' => $productId, 'user_id' => $customer->id, 'rating' => 4, 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $secondCustomer = User::factory()->create();
        $secondReview = DB::table('reviews')->insertGetId([
            'product_id' => $productId, 'user_id' => $secondCustomer->id, 'rating' => 2, 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->withToken($token)->patchJson("/api/v1/admin/reviews/{$firstReview}/status", ['status' => 'approved'])->assertOk();
        $this->assertProductRating($productId, 4, 1);
        $this->withToken($token)->patchJson("/api/v1/admin/reviews/{$secondReview}/status", ['status' => 'approved'])->assertOk();
        $this->assertProductRating($productId, 3, 2);
        $this->withToken($token)->patchJson("/api/v1/admin/reviews/{$firstReview}/status", ['status' => 'rejected', 'reason' => 'Đánh giá không hợp lệ'])->assertOk();
        $this->assertProductRating($productId, 2, 1);
    }

    public function test_catalog_options_in_use_cannot_be_deleted(): void
    {
        [, $token] = $this->adminToken('products.delete');
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Danh mục đang dùng', 'slug' => 'danh-muc-dang-dung', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $brandId = DB::table('brands')->insertGetId([
            'name' => 'Thương hiệu đang dùng', 'slug' => 'thuong-hieu-dang-dung', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $productId = DB::table('products')->insertGetId([
            'category_id' => $categoryId, 'brand_id' => $brandId, 'name' => 'Sản phẩm giữ tham chiếu',
            'slug' => 'san-pham-giu-tham-chieu', 'base_price' => 100000, 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $colorAttributeId = DB::table('attributes')->insertGetId([
            'name' => 'Màu đang dùng', 'type' => 'color', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $sizeAttributeId = DB::table('attributes')->insertGetId([
            'name' => 'Size đang dùng', 'type' => 'size', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $colorId = DB::table('attribute_values')->insertGetId([
            'attribute_id' => $colorAttributeId, 'value' => 'Đỏ đang dùng', 'color_hex' => '#ff0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $sizeId = DB::table('attribute_values')->insertGetId([
            'attribute_id' => $sizeAttributeId, 'value' => 'M đang dùng', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('product_variants')->insert([
            'product_id' => $productId, 'sku' => 'TEST-OPTION-1', 'price' => 100000,
            'color_value_id' => $colorId, 'size_value_id' => $sizeId,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->deleteJson("/api/v1/admin/categories/{$categoryId}")->assertStatus(409);
        $this->withToken($token)->deleteJson("/api/v1/admin/brands/{$brandId}")->assertStatus(409);
        $this->withToken($token)->deleteJson("/api/v1/admin/colors/{$colorId}")->assertStatus(409);
        $this->withToken($token)->deleteJson("/api/v1/admin/sizes/{$sizeId}")->assertStatus(409);
        $this->assertDatabaseHas('categories', ['id' => $categoryId]);
        $this->assertDatabaseHas('brands', ['id' => $brandId]);
        $this->assertDatabaseHas('attribute_values', ['id' => $colorId]);
        $this->assertDatabaseHas('attribute_values', ['id' => $sizeId]);
    }

    public function test_last_active_admin_cannot_be_blocked_or_demoted(): void
    {
        [$actor, $token] = $this->adminToken('users.manage');
        $actor->roles()->attach(Role::query()->firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']));
        $adminRole = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $this->withToken($token)->patchJson("/api/v1/admin/staff/{$admin->id}", ['status' => 'blocked'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'status' => 'active']);
    }

    public function test_staff_with_customer_view_permission_can_read_customers_but_cannot_update_them(): void
    {
        [, $token] = $this->adminToken('customers.view');
        $customerRole = Role::query()->create(['name' => 'customer', 'guard_name' => 'api']);
        $customer = User::factory()->create(['name' => 'Khách hàng thử nghiệm']);
        $customer->forceFill(['avatar' => 'https://example.test/avatar.webp', 'email_verified_at' => now()])->save();
        $customer->roles()->attach($customerRole);
        $this->order(['user_id' => $customer->id, 'status' => 'delivered', 'payment_status' => 'paid', 'grand_total' => 120000, 'placed_at' => now()->subDay()]);
        $this->order(['user_id' => $customer->id, 'status' => 'pending', 'payment_status' => 'paid', 'grand_total' => 80000, 'placed_at' => now()]);

        $this->withToken($token)->getJson('/api/v1/admin/customers')
            ->assertOk()
            ->assertJsonFragment(['name' => $customer->name])
            ->assertJsonPath('data.0.avatar', 'https://example.test/avatar.webp')
            ->assertJsonPath('data.0.email_verified', true)
            ->assertJsonPath('data.0.order_count', 2)
            ->assertJsonPath('data.0.total_spent', 120000);
        $this->withToken($token)->getJson('/api/v1/admin/customers?min_spent=120001')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->withToken($token)->get('/api/v1/admin/customers/export?min_spent=120001')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->withToken($token)->getJson("/api/v1/admin/customers/{$customer->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonPath('data.order_count', 2)
            ->assertJsonPath('data.total_spent', 120000)
            ->assertJsonPath('data.average_order_value', 120000)
            ->assertJsonPath('data.avatar', 'https://example.test/avatar.webp')
            ->assertJsonPath('data.email_verified', true);
        $this->withToken($token)->getJson('/api/v1/admin/search?q=Khách%20hàng%20thử')
            ->assertOk()
            ->assertJsonPath('data.customers.0.id', $customer->id)
            ->assertJsonPath('data.customers.0.url', "/customers/{$customer->id}");
        $this->withToken($token)->patchJson("/api/v1/admin/customers/{$customer->id}/status", ['status' => 'blocked'])
            ->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $customer->id, 'status' => 'active']);
    }

    public function test_user_management_permission_alone_does_not_grant_customer_read_access(): void
    {
        [, $token] = $this->adminToken('users.manage');

        $this->withToken($token)->getJson('/api/v1/admin/customers')->assertForbidden();
    }

    public function test_customer_list_uses_allowlisted_server_sorting(): void
    {
        [, $token] = $this->adminToken('customers.view');
        $role = Role::query()->create(['name' => 'customer', 'guard_name' => 'api']);
        $first = User::factory()->create(['name' => 'A Khách hàng']);
        $second = User::factory()->create(['name' => 'Z Khách hàng']);
        $first->roles()->attach($role);
        $second->roles()->attach($role);

        $this->withToken($token)->getJson('/api/v1/admin/customers?sort=name')
            ->assertOk()->assertJsonPath('data.0.id', $first->id);
        $this->withToken($token)->getJson('/api/v1/admin/customers?sort=password')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
    }

    public function test_staff_list_uses_allowlisted_server_sorting(): void
    {
        [, $token] = $this->adminToken('users.manage');
        $role = Role::query()->where('name', 'staff')->firstOrFail();
        $first = User::factory()->create(['name' => 'A Nhân viên']);
        $second = User::factory()->create(['name' => 'Z Nhân viên']);
        $first->roles()->attach($role);
        $second->roles()->attach($role);

        $this->withToken($token)->getJson('/api/v1/admin/staff?sort=name')
            ->assertOk()->assertJsonPath('data.0.id', $first->id);
        $this->withToken($token)->getJson('/api/v1/admin/staff?sort=password')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
    }

    public function test_shipping_and_activity_lists_use_allowlisted_server_sorting(): void
    {
        [, $token] = $this->adminToken('settings.manage');
        $firstMethod = DB::table('shipping_methods')->insertGetId(['name' => 'A Giao nhanh', 'fee' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('shipping_methods')->insert(['name' => 'Z Giao thường', 'fee' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('activity_logs')->insert([
            ['module' => 'Z-order', 'action' => 'PATCH', 'path' => '/orders/1', 'created_at' => now()],
            ['module' => 'A-product', 'action' => 'POST', 'path' => '/products', 'created_at' => now()],
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/shipping-methods?sort=name')
            ->assertOk()->assertJsonPath('data.0.id', $firstMethod);
        $this->withToken($token)->getJson('/api/v1/admin/shipping-methods?sort=unknown')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->withToken($token)->getJson('/api/v1/admin/activity-logs?sort=module')
            ->assertOk()->assertJsonPath('data.0.module', 'A-product');
        $this->withToken($token)->getJson('/api/v1/admin/activity-logs?sort=unknown')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
    }

    public function test_catalog_reference_lists_use_allowlisted_server_sorting(): void
    {
        [, $token] = $this->adminToken('products.view');
        $first = DB::table('brands')->insertGetId([
            'name' => 'A Thương hiệu', 'slug' => 'a-thuong-hieu', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('brands')->insert([
            'name' => 'Z Thương hiệu', 'slug' => 'z-thuong-hieu', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/catalog-options/brands?sort=name')
            ->assertOk()->assertJsonPath('data.0.id', $first);
        $this->withToken($token)->getJson('/api/v1/admin/catalog-options/brands?sort=password')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
    }

    public function test_coupon_list_uses_allowlisted_server_sorting(): void
    {
        [, $token] = $this->adminToken('coupons.view');
        $first = DB::table('coupons')->insertGetId([
            'code' => 'A-SORT', 'type' => 'fixed', 'value' => 1000, 'min_order_value' => 0,
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('coupons')->insert([
            'code' => 'Z-SORT', 'type' => 'fixed', 'value' => 5000, 'min_order_value' => 0,
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $lowerDiscountOrder = $this->order();
        $higherDiscountOrder = $this->order();
        DB::table('coupon_usages')->insert([
            ['coupon_id' => $first, 'order_id' => $higherDiscountOrder, 'discount' => 500, 'created_at' => now(), 'updated_at' => now()],
            ['coupon_id' => $first, 'order_id' => $lowerDiscountOrder, 'discount' => 100, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/campaigns/coupons?sort=code')
            ->assertOk()->assertJsonPath('data.0.id', $first);
        $this->withToken($token)->getJson('/api/v1/admin/campaigns/coupons?sort=password')
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->withToken($token)->getJson("/api/v1/admin/campaigns/coupons/{$first}/usages?sort=discount")
            ->assertOk()->assertJsonPath('data.0.discount', 100);
        $this->withToken($token)->getJson("/api/v1/admin/coupons/{$first}/usages?sort=password")
            ->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->withToken($token)->postJson('/api/v1/admin/campaigns/coupons', [])->assertForbidden();
    }

    private function assertProductRating(int $productId, float $average, int $count): void
    {
        $product = DB::table('products')->where('id', $productId)->first();
        $this->assertEquals($average, (float) $product->rating_avg);
        $this->assertSame($count, (int) $product->rating_count);
    }
}
