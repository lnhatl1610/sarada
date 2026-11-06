<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminBannerReorderTest extends TestCase
{
    use RefreshDatabase;

    private function token(): string
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'banner-staff-'.bin2hex(random_bytes(3)), 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'content.manage', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $user->roles()->attach($role);

        return $this->createApiToken($user, 'admin', 'banner-test')->plainTextToken;
    }

    private function banner(string $title, string $position, int $sortOrder): int
    {
        return DB::table('banners')->insertGetId([
            'title' => $title,
            'image' => 'storage/banners/'.$title.'.webp',
            'position' => $position,
            'sort_order' => $sortOrder,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_banner_reorder_is_limited_to_a_complete_position_group(): void
    {
        $token = $this->token();
        $first = $this->banner('banner-one', 'home_hero', 0);
        $second = $this->banner('banner-two', 'home_hero', 1);
        $popup = $this->banner('banner-popup', 'popup', 0);

        $this->withToken($token)->patchJson('/api/v1/admin/banners/reorder', [
            'position' => 'home_hero',
            'ids' => [$second, $first],
        ])->assertOk();

        $this->assertDatabaseHas('banners', ['id' => $second, 'position' => 'home_hero', 'sort_order' => 0]);
        $this->assertDatabaseHas('banners', ['id' => $first, 'position' => 'home_hero', 'sort_order' => 1]);
        $this->assertDatabaseHas('banners', ['id' => $popup, 'position' => 'popup', 'sort_order' => 0]);

        $this->withToken($token)->patchJson('/api/v1/admin/banners/reorder', [
            'position' => 'home_hero',
            'ids' => [$second, $popup],
        ])->assertUnprocessable()->assertJsonValidationErrors('ids.1');
    }
}
