<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardAlertsTest extends TestCase
{
    use RefreshDatabase;

    public function test_alerts_are_permission_filtered_and_failed_orders_are_not_duplicated(): void
    {
        $this->getJson('/api/v1/admin/alerts')->assertUnauthorized();

        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $ordersView = Permission::query()->create(['name' => 'orders.view', 'guard_name' => 'api']);
        $role->permissions()->attach($ordersView);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'admin-alerts-test')->plainTextToken;

        $orderIds = [];
        $latestOrderCode = '';
        $baseTime = now()->subMinutes(10);
        for ($index = 0; $index < 6; $index++) {
            $latestOrderCode = 'ALERT-ORDER-'.$index;
            $orderIds[] = DB::table('orders')->insertGetId([
                'code' => $latestOrderCode,
                'customer_name' => 'Khách hàng '.$index,
                'customer_phone' => '0900000000',
                'shipping_address' => json_encode(['province_code' => '01']),
                'subtotal' => 200000,
                'grand_total' => 200000,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'cod',
                'created_at' => $baseTime->copy()->addMinutes($index),
                'updated_at' => $baseTime->copy()->addMinutes($index),
            ]);
        }

        foreach ([
            [$orderIds[0], now()->subMinutes(5)],
            [$orderIds[0], now()->subMinutes(3)],
            [$orderIds[1], now()->subMinute()],
        ] as [$orderId, $updatedAt]) {
            DB::table('payments')->insert([
                'order_id' => $orderId,
                'method' => 'bank_transfer',
                'amount' => 200000,
                'status' => 'failed',
                'created_at' => $updatedAt,
                'updated_at' => $updatedAt,
            ]);
        }

        $productId = DB::table('products')->insertGetId([
            'name' => 'Áo cảnh báo',
            'slug' => 'ao-canh-bao',
            'base_price' => 200000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reviews')->insert([
            'product_id' => $productId,
            'user_id' => $user->id,
            'rating' => 5,
            'title' => 'Đánh giá cần duyệt',
            'content' => 'Nội dung đánh giá',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $variantId = DB::table('product_variants')->insertGetId([
            'product_id' => $productId,
            'sku' => 'ALERT-LOW-STOCK',
            'price' => 200000,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('inventories')->insert([
            'variant_id' => $variantId,
            'quantity' => 2,
            'reserved' => 0,
            'low_stock_threshold' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/alerts')
            ->assertOk()
            ->assertJsonPath('data.counts.pending_orders', 6)
            ->assertJsonPath('data.counts.failed_payments', 2)
            ->assertJsonPath('data.counts.pending_reviews', 0)
            ->assertJsonPath('data.counts.low_stock', 0)
            ->assertJsonPath('data.items.pending_orders.0.code', $latestOrderCode)
            ->assertJsonCount(5, 'data.items.pending_orders')
            ->assertJsonCount(2, 'data.items.failed_payments')
            ->assertJsonPath('data.items.failed_payments.0.id', $orderIds[1])
            ->assertJsonCount(0, 'data.items.pending_reviews')
            ->assertJsonCount(0, 'data.items.low_stock');

        $this->withToken($token)->getJson('/api/v1/admin/operations/payments?status=failed')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $role->permissions()->attach([
            Permission::query()->create(['name' => 'reviews.moderate', 'guard_name' => 'api'])->id,
            Permission::query()->create(['name' => 'inventory.view', 'guard_name' => 'api'])->id,
        ]);

        $this->withToken($token)->getJson('/api/v1/admin/alerts')
            ->assertOk()
            ->assertJsonPath('data.counts.pending_reviews', 1)
            ->assertJsonPath('data.counts.low_stock', 1)
            ->assertJsonPath('data.items.pending_reviews.0.product_name', 'Áo cảnh báo')
            ->assertJsonPath('data.items.low_stock.0.sku', 'ALERT-LOW-STOCK');
    }
}
