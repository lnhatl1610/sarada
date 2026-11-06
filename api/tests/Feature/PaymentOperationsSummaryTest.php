<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentOperationsSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_summary_uses_the_same_date_and_method_filters_as_the_list(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'staff', 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'orders.view', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'payment-summary')->plainTextToken;

        $today = now();
        $this->payment('SUMMARY-SUCCESS', 'success', 125000, 'cod', $today);
        $this->payment('SUMMARY-PENDING', 'pending', 30000, 'cod', $today);
        $this->payment('SUMMARY-FAILED', 'failed', 25000, 'cod', $today);
        $this->payment('SUMMARY-REFUNDED', 'refunded', 10000, 'cod', $today);
        $this->payment('SUMMARY-OLD', 'success', 900000, 'cod', $today->copy()->subDay());
        $this->payment('SUMMARY-OTHER-METHOD', 'success', 800000, 'bank_transfer', $today);

        $this->withToken($token)->getJson('/api/v1/admin/operations/payments?from='.$today->toDateString().'&to='.$today->toDateString().'&method=cod')
            ->assertOk()
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('summary.success_count', 1)
            ->assertJsonPath('summary.success_amount', 125000)
            ->assertJsonPath('summary.pending_count', 1)
            ->assertJsonPath('summary.pending_amount', 30000)
            ->assertJsonPath('summary.failed_count', 1)
            ->assertJsonPath('summary.failed_amount', 25000)
            ->assertJsonPath('summary.refunded_count', 1)
            ->assertJsonPath('summary.refunded_amount', 10000);
    }

    private function payment(string $code, string $status, int $amount, string $method, $createdAt): void
    {
        $orderId = DB::table('orders')->insertGetId([
            'code' => $code,
            'customer_name' => 'Khách thanh toán',
            'customer_phone' => '0900000000',
            'shipping_address' => json_encode(['street' => 'Địa chỉ kiểm thử'], JSON_THROW_ON_ERROR),
            'subtotal' => $amount,
            'grand_total' => $amount,
            'status' => 'pending',
            'payment_status' => $status,
            'payment_method' => $method,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        DB::table('payments')->insert([
            'order_id' => $orderId,
            'method' => $method,
            'amount' => $amount,
            'status' => $status,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }
}
