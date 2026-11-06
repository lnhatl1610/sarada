<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CustomerReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_spending_keeps_orders_that_advanced_from_delivered_to_completed(): void
    {
        $admin = User::factory()->create();
        $role = Role::query()->create(['name' => 'customer-detail-admin-'.bin2hex(random_bytes(4)), 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'customers.view', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $admin->roles()->attach($role);
        $token = $this->createApiToken($admin, 'admin', 'customer-spending')->plainTextToken;

        $customerRole = Role::query()->create(['name' => 'customer', 'guard_name' => 'api']);
        $customer = User::factory()->create(['name' => 'Khách đã hoàn tất']);
        $customer->roles()->attach($customerRole);
        $this->order('CUSTOMER-DELIVERED', now()->subDays(2), $customer->name, '0901111111', 100000, $customer->id);
        $this->order('CUSTOMER-COMPLETED', now()->subDay(), $customer->name, '0901111111', 75000, $customer->id);
        DB::table('orders')->where('code', 'CUSTOMER-COMPLETED')->update(['status' => 'completed']);

        $this->withToken($token)->getJson('/api/v1/admin/customers')
            ->assertOk()
            ->assertJsonPath('data.0.total_spent', 175000);

        $this->withToken($token)->getJson('/api/v1/admin/customers/'.$customer->id)
            ->assertOk()
            ->assertJsonPath('data.total_spent', 175000)
            ->assertJsonPath('data.average_order_value', 87500);

        $csv = $this->withToken($token)->get('/api/v1/admin/customers/export');
        $csv->assertOk();
        $this->assertStringContainsString('175000', $csv->streamedContent());
    }

    public function test_customer_report_groups_by_identity_and_checks_paid_history_before_the_period(): void
    {
        $admin = User::factory()->create();
        $staffRole = Role::query()->create(['name' => 'report-staff', 'guard_name' => 'api']);
        $reportPermission = Permission::query()->create(['name' => 'reports.view', 'guard_name' => 'api']);
        $staffRole->permissions()->attach($reportPermission);
        $admin->roles()->attach($staffRole);
        $token = $this->createApiToken($admin, 'admin', 'customer-report')->plainTextToken;

        $from = Carbon::parse('2026-10-01 00:00:00');
        $to = Carbon::parse('2026-10-31 23:59:59');
        $customerRole = Role::query()->create(['name' => 'customer', 'guard_name' => 'api']);
        $returningCustomer = User::factory()->create(['name' => 'Alex', 'created_at' => $from->copy()->subYear(), 'updated_at' => $from->copy()->subYear()]);
        $newCustomer = User::factory()->create(['name' => 'Alex', 'created_at' => $from->copy()->addDays(2), 'updated_at' => $from->copy()->addDays(2)]);
        $timelineCustomer = User::factory()->create(['name' => 'Khách mới', 'created_at' => $from->copy()->addDays(4), 'updated_at' => $from->copy()->addDays(4)]);
        $returningCustomer->roles()->attach($customerRole);
        $newCustomer->roles()->attach($customerRole);
        $timelineCustomer->roles()->attach($customerRole);

        $this->order('REPORT-HISTORY', $from->copy()->subDays(2), 'Alex', '0901111111', 100000, $returningCustomer->id);
        $this->order('REPORT-GUEST-HISTORY', $from->copy()->subDays(3), 'Alex', '090-222-2222', 80000);
        $this->order('REPORT-RETURNING', $from->copy()->addDay(), 'Alex', '0901111111', 110000, $returningCustomer->id);
        $this->order('REPORT-NEW-ACCOUNT', $from->copy()->addDays(2), 'Alex', '0902222222', 200000, $newCustomer->id);
        $this->order('REPORT-GUEST-1', $from->copy()->addDays(3), 'Alex', '090-333-4444', 50000);
        $this->order('REPORT-GUEST-2', $from->copy()->addDays(5), 'Alex', '0903334444', 70000);

        $response = $this->withToken($token)->getJson('/api/v1/admin/reports/customers?from=2026-10-01&to=2026-10-31');
        $response->assertOk()
            ->assertJsonPath('data.new_customers', 2)
            ->assertJsonPath('data.new_customers_timeline.0.date', '2026-10-03')
            ->assertJsonPath('data.new_customers_timeline.0.customers', 1)
            ->assertJsonPath('data.new_customers_timeline.1.date', '2026-10-05')
            ->assertJsonPath('data.new_customers_timeline.1.customers', 1);

        $repeat = collect($response->json('data.customer_repeat'));
        $this->assertCount(3, $repeat, 'Customers with the same display name must remain separate, while a guest phone with formatting changes should group together.');
        $this->assertSame(['new', 'returning', 'returning'], $repeat->pluck('segment')->sort()->values()->all());
        $this->assertSame([1, 1, 2], $repeat->pluck('order_count')->map(fn ($count) => (int) $count)->sort()->values()->all());
        $this->assertCount(3, $repeat->pluck('customer_ref')->unique());
        $this->assertStringNotContainsString('0903334444', json_encode($repeat->all(), JSON_THROW_ON_ERROR));

        $topCustomers = collect($response->json('data.top_customers'));
        $this->assertCount(3, $topCustomers);
        $this->assertSame([110000, 120000, 200000], $topCustomers->pluck('spent')->map(fn ($amount) => (int) $amount)->sort()->values()->all());
        $this->assertCount(3, $topCustomers->pluck('customer_ref')->unique());

        $csv = $this->withToken($token)->get('/api/v1/admin/reports/customers?from=2026-10-01&to=2026-10-31&export=1');
        $csv->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Khách mua lần đầu', $csv->streamedContent());
        $this->assertStringContainsString('Khách quay lại', $csv->streamedContent());
    }

    private function order(string $code, Carbon $placedAt, string $name, string $phone, int $amount, ?int $userId = null): void
    {
        DB::table('orders')->insert([
            'code' => $code,
            'user_id' => $userId,
            'customer_name' => $name,
            'customer_phone' => $phone,
            'shipping_address' => json_encode(['street' => 'Địa chỉ kiểm thử', 'province' => 'Hà Nội'], JSON_THROW_ON_ERROR),
            'subtotal' => $amount,
            'grand_total' => $amount,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'placed_at' => $placedAt,
            'created_at' => $placedAt,
            'updated_at' => $placedAt,
        ]);
    }
}
