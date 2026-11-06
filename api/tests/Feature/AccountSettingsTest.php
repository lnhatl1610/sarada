<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Notifications\AccountEmailChangeNotification;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function token(User $user): string
    {
        return $this->createApiToken($user, 'storefront', 'storefront')->plainTextToken;
    }

    private function addressData(array $overrides = []): array
    {
        return array_merge(['recipient_name' => 'Nguyễn An', 'phone' => '0912345678', 'province_code' => '01', 'district_code' => '001', 'ward_code' => '00001', 'street' => '12 Nguyễn Trãi'], $overrides);
    }

    public function test_account_profile_is_available_only_to_authenticated_active_sessions(): void
    {
        $this->getJson('/api/v1/account')->assertUnauthorized();
        $user = User::factory()->create();
        $token = $this->token($user);
        $this->withToken($token)->getJson('/api/v1/account')->assertOk()->assertJsonPath('data.email', $user->email);
        $this->withToken($token)->putJson('/api/v1/account/profile', ['name' => 'Nguyễn Minh An', 'phone' => '0912345678', 'gender' => 'other', 'birthday' => '1995-10-12'])
            ->assertOk()->assertJsonPath('data.name', 'Nguyễn Minh An');
        $this->withToken($token)->putJson('/api/v1/account/profile', ['name' => 'A', 'phone' => '123'])->assertUnprocessable();
        $user->forceFill(['status' => 'blocked'])->save();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/account')->assertForbidden();
    }

    public function test_avatar_upload_replaces_and_removes_the_old_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['avatar' => Storage::disk('public')->url('avatars/old.png')]);
        Storage::disk('public')->put('avatars/old.png', 'old');
        $token = $this->token($user);
        $avatarPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
        $this->withToken($token)->post('/api/v1/account/avatar', ['avatar' => UploadedFile::fake()->createWithContent('avatar.png', $avatarPng)], ['Accept' => 'application/json'])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id, 'avatar' => Storage::disk('public')->url('avatars/old.png')]);
        Storage::disk('public')->assertMissing('avatars/old.png');
        $this->withToken($token)->deleteJson('/api/v1/account/avatar')->assertOk();
    }

    public function test_email_change_requires_password_and_sends_verification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'password123']);
        $currentEmail = $user->email;
        $currentVerificationTime = $user->email_verified_at;
        $token = $this->token($user);
        $this->withToken($token)->putJson('/api/v1/account/email', ['email' => 'new@example.test', 'current_password' => 'wrongpass'])->assertUnprocessable();
        $this->withToken($token)->putJson('/api/v1/account/email', ['email' => 'new@example.test', 'current_password' => 'password123'])
            ->assertOk()
            ->assertJsonPath('data.email', $currentEmail)
            ->assertJsonPath('data.email_verified', true)
            ->assertJsonPath('data.pending_email', 'new@example.test');
        $user->refresh();
        $this->assertSame($currentEmail, $user->email);
        $this->assertEquals($currentVerificationTime, $user->email_verified_at);
        $this->assertDatabaseHas('pending_email_changes', ['user_id' => $user->id, 'email' => 'new@example.test']);
        Notification::assertSentOnDemand(AccountEmailChangeNotification::class);
    }

    public function test_password_change_revokes_other_sessions_and_current_session_can_list_them(): void
    {
        $this->app->instance(UncompromisedVerifier::class, new class implements UncompromisedVerifier
        {
            public function verify($data): bool
            {
                return true;
            }
        });
        $user = User::factory()->create(['password' => 'password123']);
        $token = $this->createApiToken($user, 'storefront', 'current');
        $other = $this->createApiToken($user, 'storefront', 'other');
        $this->withToken($token->plainTextToken)->getJson('/api/v1/account/sessions')->assertOk()->assertJsonFragment(['is_current' => true]);
        $this->withToken($token->plainTextToken)->putJson('/api/v1/account/password', ['current_password' => 'password123', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $other->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $token->accessToken->id]);
    }

    public function test_password_change_rejects_a_compromised_password(): void
    {
        $this->app->instance(UncompromisedVerifier::class, new class implements UncompromisedVerifier
        {
            public function verify($data): bool
            {
                return false;
            }
        });
        $user = User::factory()->create(['password' => 'password123']);
        $token = $this->token($user);

        $this->withToken($token)->putJson('/api/v1/account/password', [
            'current_password' => 'password123',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_address_limit_default_and_idor_rules_are_enforced(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $this->token($user);
        $otherAddress = $otherUser->addresses()->create($this->addressData());
        $this->withToken($token)->putJson('/api/v1/account/addresses/'.$otherAddress->id, $this->addressData())->assertNotFound();
        $this->withToken($token)->postJson('/api/v1/account/addresses', $this->addressData())->assertCreated()->assertJsonPath('data.is_default', true);
        $this->withToken($token)->postJson('/api/v1/account/addresses', $this->addressData(['street' => 'Địa chỉ thứ hai']))->assertCreated()->assertJsonPath('data.is_default', false);
        $rows = $user->addresses()->orderBy('id')->get();
        $this->withToken($token)->patchJson('/api/v1/account/addresses/'.$rows[1]->id.'/default')->assertOk();
        $this->assertSame(1, $user->addresses()->where('is_default', true)->count());
        $this->withToken($token)->deleteJson('/api/v1/account/addresses/'.$rows[1]->id)->assertOk();
        $this->assertTrue((bool) $user->addresses()->first()->is_default);
        for ($index = 0; $index < 9; $index++) {
            $this->withToken($token)->postJson('/api/v1/account/addresses', $this->addressData(['street' => 'Địa chỉ '.($index + 3)]))->assertCreated();
        }
        $this->assertSame(10, $user->addresses()->count());
        $this->withToken($token)->postJson('/api/v1/account/addresses', $this->addressData(['street' => 'Địa chỉ thứ mười một']))->assertUnprocessable();
    }

    public function test_only_customer_can_soft_delete_account_and_active_orders_block_deletion(): void
    {
        $customer = User::factory()->create(['password' => 'password123']);
        $customerRole = Role::query()->firstOrCreate(['name' => 'customer', 'guard_name' => 'api']);
        $customer->roles()->attach($customerRole);
        $token = $this->token($customer);
        DB::table('orders')->insert(['code' => 'TEST-ACCOUNT-1', 'user_id' => $customer->id, 'customer_name' => $customer->name, 'customer_phone' => '0912345678', 'shipping_address' => json_encode([]), 'subtotal' => 100, 'grand_total' => 100, 'status' => 'pending', 'payment_status' => 'unpaid', 'payment_method' => 'cod', 'created_at' => now(), 'updated_at' => now()]);
        $this->withToken($token)->deleteJson('/api/v1/account', ['password' => 'password123'])->assertUnprocessable();
        DB::table('orders')->where('user_id', $customer->id)->update(['status' => 'cancelled']);
        $this->withToken($token)->deleteJson('/api/v1/account', ['password' => 'password123'])->assertOk();
        $this->assertSoftDeleted('users', ['id' => $customer->id]);

        $staff = User::factory()->create(['password' => 'password123']);
        $staff->roles()->attach(Role::query()->firstOrCreate(['name' => 'staff', 'guard_name' => 'api']));
        $this->app['auth']->forgetGuards();
        $this->withToken($this->token($staff))->deleteJson('/api/v1/account', ['password' => 'password123'])->assertForbidden();
    }
}
