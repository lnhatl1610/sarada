<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StoreSettingsAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_update_is_permission_checked_and_audited_without_recording_values(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'settings-admin', 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'settings.manage', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $user->roles()->attach($role);
        $token = $this->createApiToken($user, 'admin', 'settings-audit-test')->plainTextToken;
        $bankAccount = '1234567890123456';

        $this->withToken($token)->putJson('/api/v1/admin/settings', [
            'store_name' => 'Sarada',
            'payment_bank_account' => $bankAccount,
        ])->assertOk()
            ->assertJsonPath('data.store_name', 'Sarada')
            ->assertJsonPath('data.payment_bank_account', $bankAccount);

        $log = DB::table('activity_logs')->where('user_id', $user->id)->sole();
        $this->assertSame('settings', $log->module);
        $this->assertSame('PUT', $log->action);
        $this->assertSame('/api/v1/admin/settings', '/'.$log->path);
        $this->assertSame([
            'changed_fields' => ['store_name', 'payment_bank_account'],
        ], json_decode($log->changes, true, flags: JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString($bankAccount, $log->changes);
    }

    public function test_settings_update_is_rejected_without_permission_and_does_not_create_audit_log(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'admin', 'settings-denied-test')->plainTextToken;

        $this->withToken($token)->putJson('/api/v1/admin/settings', ['store_name' => 'Unauthorized'])
            ->assertForbidden();

        $this->assertDatabaseCount('activity_logs', 0);
    }
}
