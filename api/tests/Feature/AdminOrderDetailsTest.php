<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminOrderDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(string $permission): array
    {
        $user = User::factory()->create(['name' => 'Nhân viên vận hành']);
        $role = Role::query()->create(['name' => 'staff-'.bin2hex(random_bytes(4)), 'guard_name' => 'api']);
        $ability = Permission::query()->firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        $role->permissions()->attach($ability);
        $user->roles()->attach($role);

        return [$user, $this->createApiToken($user, 'admin', 'admin-order-details')->plainTextToken];
    }

    private function order(User $customer): int
    {
        return DB::table('orders')->insertGetId([
            'code' => 'DETAIL-'.bin2hex(random_bytes(4)),
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_email' => $customer->email,
            'customer_phone' => '0900000000',
            'shipping_address' => json_encode(['street' => '12 Đường Hoa', 'ward' => 'Phường 1']),
            'subtotal' => 250000,
            'discount_total' => 10000,
            'shipping_fee' => 20000,
            'grand_total' => 260000,
            'coupon_code' => 'FASHION10',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'note' => 'Giao hàng sau 17 giờ',
            'placed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_order_detail_returns_snapshots_payment_payload_shipment_and_history_actor(): void
    {
        [$admin, $token] = $this->adminToken('orders.view');
        $customer = User::factory()->create(['name' => 'Khách mua hàng']);
        $orderId = $this->order($customer);
        DB::table('order_items')->insert([
            'order_id' => $orderId, 'product_name' => 'Áo snapshot', 'variant_name' => 'Đen M',
            'sku' => 'AO-DEN-M', 'image' => 'storage/products/ao-den.webp', 'unit_price' => 125000,
            'quantity' => 2, 'line_total' => 250000, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('payments')->insert([
            'order_id' => $orderId, 'method' => 'cod', 'amount' => 260000, 'status' => 'pending',
            'transaction_ref' => 'TX-DETAIL-001', 'raw_payload' => json_encode(['source' => 'checkout', 'attempt' => 1, 'access_token' => 'do-not-return']),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('shipments')->insert([
            'order_id' => $orderId, 'carrier' => 'GHN', 'tracking_code' => 'GHN-001', 'status' => 'in_transit',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId, 'from_status' => null, 'to_status' => 'pending', 'note' => 'Đơn mới',
            'changed_by' => $admin->id, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $this->withToken($token)->getJson("/api/v1/admin/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.customer_id', $customer->id)
            ->assertJsonPath('data.items.0.image', 'storage/products/ao-den.webp')
            ->assertJsonPath('data.items.0.unit_price', 125000)
            ->assertJsonPath('data.items.0.variant_name', 'Đen M')
            ->assertJsonPath('data.payments.0.provider', 'cod')
            ->assertJsonPath('data.payments.0.payload.source', 'checkout')
            ->assertJsonPath('data.payments.0.payload.access_token', '[redacted]')
            ->assertJsonPath('data.shipments.0.tracking_code', 'GHN-001')
            ->assertJsonPath('data.history.0.changed_by_name', $admin->name);

        $response->assertJsonPath('data.coupon_code', 'FASHION10');
    }

    public function test_payment_status_requires_a_note_and_refunds_use_the_reason_endpoint(): void
    {
        [, $token] = $this->adminToken('orders.update_status');
        $customer = User::factory()->create();
        $orderId = $this->order($customer);
        DB::table('payments')->insert([
            'order_id' => $orderId, 'method' => 'cod', 'amount' => 260000, 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$orderId}/payment-status", ['payment_status' => 'refunded', 'note' => 'Hoàn tiền'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_status');

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$orderId}/payment-status", ['payment_status' => 'paid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('note');

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$orderId}/payment-status", ['payment_status' => 'paid', 'note' => 'Đã thu tiền COD'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.payments.0.status', 'paid');

        $this->assertDatabaseHas('order_status_histories', ['order_id' => $orderId, 'note' => 'Thanh toán: paid — Đã thu tiền COD']);
    }

    public function test_internal_note_is_appended_to_history_without_overwriting_customer_note(): void
    {
        [$admin, $token] = $this->adminToken('orders.update_status');
        $customer = User::factory()->create();
        $orderId = $this->order($customer);

        $this->withToken($token)->patchJson("/api/v1/admin/orders/{$orderId}/note", ['note' => 'Đã gọi xác nhận size'])
            ->assertOk()
            ->assertJsonPath('data.note', 'Giao hàng sau 17 giờ')
            ->assertJsonPath('data.history.0.type', 'internal_note')
            ->assertJsonPath('data.history.0.note', 'Đã gọi xác nhận size')
            ->assertJsonPath('data.history.0.changed_by_name', $admin->name);

        $this->assertDatabaseHas('orders', ['id' => $orderId, 'note' => 'Giao hàng sau 17 giờ']);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $orderId, 'note' => '[INTERNAL_NOTE] Đã gọi xác nhận size']);

        $orderCode = DB::table('orders')->where('id', $orderId)->value('code');
        $this->getJson('/api/v1/orders/track?code='.$orderCode.'&phone=0900000000')
            ->assertOk()
            ->assertJsonMissing(['note' => '[INTERNAL_NOTE] Đã gọi xác nhận size']);
    }
}
