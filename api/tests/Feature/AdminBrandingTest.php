<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBrandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_identity_includes_only_public_store_branding_without_settings_permission(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'admin', 'admin-branding-test')->plainTextToken;

        Setting::query()->create(['key' => 'store_name', 'value' => 'Nhà Mốt Ánh Dương']);
        Setting::query()->create(['key' => 'store_logo', 'value' => 'https://cdn.example.test/store/logo.png']);
        Setting::query()->create(['key' => 'payment_bank_account', 'value' => '0123456789']);

        $this->withToken($token)->getJson('/api/v1/admin/auth/me')
            ->assertOk()
            ->assertJsonPath('data.store.store_name', 'Nhà Mốt Ánh Dương')
            ->assertJsonPath('data.store.store_logo', 'https://cdn.example.test/store/logo.png')
            ->assertJsonMissingPath('data.store.payment_bank_account');

        $this->withToken($token)->getJson('/api/v1/admin/settings')
            ->assertForbidden();
    }

    public function test_admin_identity_uses_default_store_branding_when_settings_are_missing(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'admin', 'admin-branding-default-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/admin/auth/me')
            ->assertOk()
            ->assertJsonPath('data.store.store_name', 'Sarada')
            ->assertJsonPath('data.store.store_logo', '');
    }
}
