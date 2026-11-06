<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RevenueReportFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_revenue_and_product_sales_exclude_paid_orders_that_are_not_fulfilled(): void
    {
        $admin = User::factory()->create();
        $role = Role::query()->create(['name' => 'revenue-report-'.bin2hex(random_bytes(4)), 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'reports.view', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $admin->roles()->attach($role);
        $token = $this->createApiToken($admin, 'admin', 'revenue-report')->plainTextToken;

        $deliveredId = $this->order('DELIVERED', 'delivered', 100000);
        $completedId = $this->order('COMPLETED', 'completed', 75000);
        $this->order('PAID-PENDING', 'pending', 900000);
        $this->lineItem($deliveredId, 'Áo đã giao', 100000);
        $this->lineItem($completedId, 'Quần đã hoàn tất', 75000);
        $this->lineItem($this->orderId('PAID-PENDING'), 'Hàng chưa giao', 900000);

        $revenue = $this->withToken($token)->getJson('/api/v1/admin/reports/revenue?from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('data.current.order_count', 2)
            ->assertJsonPath('data.current.revenue', 175000)
            ->assertJsonPath('data.daily.0.orders', 2)
            ->assertJsonPath('data.daily.0.revenue', '175000');

        $this->assertSame(175000, collect($revenue->json('data.revenue_categories'))->sum('revenue'));

        $products = $this->withToken($token)->getJson('/api/v1/admin/reports/products?from=2026-10-01&to=2026-10-31')
            ->assertOk()->json('data.products');
        $this->assertCount(2, $products);
        $this->assertSame([100000, 75000], array_map(static fn (array $product): int => (int) $product['revenue'], $products));
    }

    private function orderId(string $code): int
    {
        return (int) DB::table('orders')->where('code', $code)->value('id');
    }

    private function order(string $code, string $status, int $amount): int
    {
        return DB::table('orders')->insertGetId([
            'code' => $code,
            'customer_name' => 'Khách báo cáo',
            'customer_phone' => '0900000000',
            'shipping_address' => json_encode(['province' => 'Hà Nội'], JSON_THROW_ON_ERROR),
            'subtotal' => $amount,
            'grand_total' => $amount,
            'status' => $status,
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'placed_at' => '2026-10-10 12:00:00',
            'created_at' => '2026-10-10 12:00:00',
            'updated_at' => '2026-10-10 12:00:00',
        ]);
    }

    private function lineItem(int $orderId, string $name, int $amount): void
    {
        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_name' => $name,
            'sku' => strtoupper(str_replace(' ', '-', $name)),
            'unit_price' => $amount,
            'quantity' => 1,
            'line_total' => $amount,
            'created_at' => '2026-10-10 12:00:00',
            'updated_at' => '2026-10-10 12:00:00',
        ]);
    }
}
