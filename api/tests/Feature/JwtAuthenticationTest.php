<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class JwtAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_issues_a_signed_audience_scoped_jwt_bound_to_a_revocable_session(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $user->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'api']));

        $response = $this->postJson('/api/v1/admin/auth/login', ['email' => $user->email, 'password' => 'password123'])->assertOk();
        $accessToken = $response->json('data.access_token');
        $this->assertIsString($accessToken);
        $this->assertCount(3, explode('.', $accessToken));
        $this->assertSame(['admin'], JWTAuth::setToken($accessToken)->getPayload()->get('aud'));

        $sessionId = JWTAuth::getPayload()->get('sid');
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $sessionId,
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
        ]);
        $this->withToken($accessToken)->getJson('/api/v1/admin/auth/me')->assertOk();
        $this->withToken($accessToken)->getJson('/api/v1/auth/me')->assertForbidden();
    }

    public function test_revoking_the_session_invalidates_its_jwt_on_the_next_request(): void
    {
        $user = User::factory()->create();
        $token = $this->createApiToken($user, 'storefront')->plainTextToken;
        $sessionId = JWTAuth::setToken($token)->getPayload()->get('sid');

        DB::table('personal_access_tokens')->where('id', $sessionId)->delete();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertForbidden();
    }

    public function test_refresh_rotates_both_tokens_and_reuse_revokes_the_session_family(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $user->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'api']));

        $login = $this->postJson('/api/v1/admin/auth/login', ['email' => $user->email, 'password' => 'password123'])->assertOk();
        $oldAccessToken = $login->json('data.access_token');
        $oldRefreshToken = $login->getCookie('admin_refresh_token', false)->getValue();
        $oldSessionId = JWTAuth::setToken($oldAccessToken)->getPayload()->get('sid');
        JWTAuth::unsetToken();

        $refresh = $this->withCredentials()->withUnencryptedCookie('admin_refresh_token', $oldRefreshToken)
            ->postJson('/api/v1/admin/auth/refresh');
        $this->assertSame(200, $refresh->status(), $refresh->getContent());
        $newAccessToken = $refresh->json('data.access_token');
        $newSessionId = JWTAuth::setToken($newAccessToken)->getPayload()->get('sid');
        JWTAuth::unsetToken();

        $this->assertNotSame($oldAccessToken, $newAccessToken);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $oldSessionId]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $newSessionId, 'tokenable_id' => $user->id]);
        $this->withToken($oldAccessToken)->getJson('/api/v1/admin/auth/me')->assertForbidden();
        $this->withToken($newAccessToken)->getJson('/api/v1/admin/auth/me')->assertOk();

        $this->withCredentials()->withUnencryptedCookie('admin_refresh_token', $oldRefreshToken)
            ->postJson('/api/v1/admin/auth/refresh')->assertUnauthorized();
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $newSessionId]);
    }
}
