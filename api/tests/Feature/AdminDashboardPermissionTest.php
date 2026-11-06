<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminDashboardPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_open_dashboard_without_gaining_report_access(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $ordersView = Permission::query()->create(['name' => 'orders.view', 'guard_name' => 'api']);
        $role->permissions()->attach($ordersView);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'staff-dashboard-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/summary')->assertOk();
        $this->withToken($token)->getJson('/api/v1/admin/reports/revenue')->assertForbidden();
    }

    public function test_dashboard_endpoints_reject_authenticated_users_without_orders_view(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'admin', 'dashboard-without-permission')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/summary')->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/admin/dashboard/top-products')->assertForbidden();
    }

    public function test_dashboard_top_products_use_the_selected_paid_sales_period(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'orders.view', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'staff-dashboard-period-test')->plainTextToken;

        $productId = DB::table('products')->insertGetId([
            'name' => 'Áo bán chạy theo kỳ',
            'slug' => 'ao-ban-chay-theo-ky',
            'sku' => 'PERIOD-001',
            'base_price' => 10000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ([
            ['days_ago' => 2, 'payment_status' => 'paid', 'quantity' => 2],
            ['days_ago' => 20, 'payment_status' => 'paid', 'quantity' => 50],
            ['days_ago' => 7, 'payment_status' => 'paid', 'quantity' => 30],
            ['days_ago' => 1, 'payment_status' => 'unpaid', 'quantity' => 100],
        ] as $index => $sale) {
            $createdAt = now()->subDays($sale['days_ago']);
            $orderId = DB::table('orders')->insertGetId([
                'code' => 'PERIOD-ORDER-'.$index,
                'customer_name' => 'Nguyễn An',
                'customer_phone' => '0900000000',
                'shipping_address' => json_encode(['province' => 'Hà Nội']),
                'subtotal' => 10000 * $sale['quantity'],
                'grand_total' => 10000 * $sale['quantity'],
                'status' => 'delivered',
                'payment_status' => $sale['payment_status'],
                'payment_method' => 'cod',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            DB::table('order_items')->insert([
                'order_id' => $orderId,
                'product_id' => $productId,
                'product_name' => 'Áo bán chạy theo kỳ',
                'sku' => 'PERIOD-001',
                'unit_price' => 10000,
                'quantity' => $sale['quantity'],
                'line_total' => 10000 * $sale['quantity'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $cancelledAt = now()->subDays(8);
        DB::table('orders')->insert([
            'code' => 'PERIOD-CANCELLED',
            'customer_name' => 'Nguyễn An',
            'customer_phone' => '0900000000',
            'shipping_address' => json_encode(['province' => 'Hà Nội']),
            'subtotal' => 10000,
            'grand_total' => 10000,
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'created_at' => $cancelledAt,
            'updated_at' => $cancelledAt,
        ]);

        $customerRole = Role::query()->create(['name' => 'customer', 'guard_name' => 'api']);
        $currentCustomer = User::factory()->create(['created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
        $previousCustomer = User::factory()->create(['created_at' => now()->subDays(8), 'updated_at' => now()->subDays(8)]);
        $currentCustomer->roles()->attach($customerRole);
        $previousCustomer->roles()->attach($customerRole);

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/top-products?days=7')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_id', $productId)
            ->assertJsonPath('data.0.product_slug', 'ao-ban-chay-theo-ky')
            ->assertJsonPath('data.0.units_sold', 2)
            ->assertJsonPath('data.0.revenue', 20000);

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/top-products?days=30')
            ->assertJsonPath('data.0.units_sold', 82)
            ->assertJsonPath('data.0.revenue', 820000);

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/summary?days=7')
            ->assertOk()
            ->assertJsonPath('data.period_days', 7)
            ->assertJsonPath('data.revenue', 20000)
            ->assertJsonPath('data.order_count', 2)
            ->assertJsonPath('data.previous_revenue', 300000)
            ->assertJsonPath('data.previous_order_count', 2)
            ->assertJsonPath('data.average_paid_order_value', 20000)
            ->assertJsonPath('data.previous_average_paid_order_value', 300000)
            ->assertJsonPath('data.new_customer_count', 1)
            ->assertJsonPath('data.previous_new_customer_count', 1)
            ->assertJsonPath('data.cancellation_return_rate', 0)
            ->assertJsonPath('data.previous_cancellation_return_rate', 50)
            ->assertJsonPath('data.payment_breakdown.0.count', 1)
            ->assertJsonPath('data.payment_breakdown.0.revenue', 20000);

        $this->withToken($token)->getJson('/api/v1/admin/dashboard/revenue?days=7')
            ->assertOk()
            ->assertJsonCount(7, 'data')
            ->assertJsonPath('data.0.revenue', 0)
            ->assertJsonPath('data.0.orders', 0)
            ->assertJsonPath('data.5.revenue', 0)
            ->assertJsonPath('data.5.orders', 1);
    }

    public function test_named_reports_return_their_section_and_inventory_stock_details(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'reports.view', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'admin-reports-test')->plainTextToken;

        foreach ([['LOW-REPORT', 4, 1, 100000], ['OUT-REPORT', 2, 2, 200000]] as [$sku, $quantity, $reserved, $price]) {
            $productId = DB::table('products')->insertGetId([
                'name' => $sku,
                'slug' => strtolower($sku),
                'base_price' => $price,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $variantId = DB::table('product_variants')->insertGetId([
                'product_id' => $productId,
                'sku' => $sku,
                'price' => $price,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('inventories')->insert([
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'reserved' => $reserved,
                'low_stock_threshold' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $range = '?from='.now()->toDateString().'&to='.now()->toDateString();
        $this->withToken($token)->getJson('/api/v1/admin/reports/inventory'.$range)
            ->assertOk()
            ->assertJsonPath('data.inventory.variants', 2)
            ->assertJsonPath('data.inventory.total_quantity', 6)
            ->assertJsonPath('data.inventory.total_available_quantity', 3)
            ->assertJsonPath('data.inventory.retail_value', 800000)
            ->assertJsonPath('data.inventory_status.out_count', 1)
            ->assertJsonPath('data.inventory_status.low_count', 1)
            ->assertJsonCount(2, 'data.inventory_items')
            ->assertJsonPath('data.inventory_items.0.sku', 'OUT-REPORT')
            ->assertJsonPath('data.inventory_items.0.stock_status', 'out_of_stock')
            ->assertJsonMissingPath('data.daily');

        $this->withToken($token)->getJson('/api/v1/admin/reports/revenue'.$range)
            ->assertOk()
            ->assertJsonStructure(['data' => ['current', 'previous', 'daily', 'coupons', 'payment_methods', 'revenue_categories']])
            ->assertJsonMissingPath('data.inventory');

        $this->withToken($token)->getJson('/api/v1/admin/reports/revenue'.$range.'&group_by=month')
            ->assertOk()->assertJsonPath('data.group_by', 'month');
        $this->withToken($token)->getJson('/api/v1/admin/reports/revenue'.$range.'&group_by=year')
            ->assertUnprocessable()->assertJsonValidationErrors('group_by');
        $this->withToken($token)->getJson('/api/v1/admin/reports/products'.$range)
            ->assertOk()->assertJsonStructure(['data' => ['slow_products']]);

        $inventoryCsv = $this->withToken($token)->get('/api/v1/admin/reports/inventory'.$range.'&export=1');
        $inventoryCsv->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Nhóm', $inventoryCsv->streamedContent());
        $this->assertStringContainsString('OUT-REPORT', $inventoryCsv->streamedContent());
    }
}
