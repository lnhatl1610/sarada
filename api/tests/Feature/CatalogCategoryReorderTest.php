<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogCategoryReorderTest extends TestCase
{
    use RefreshDatabase;

    public function test_reorder_can_move_a_category_and_rejects_invalid_parent_cycles(): void
    {
        $editor = User::factory()->create();
        $role = Role::query()->create(['name' => 'catalog-editor', 'guard_name' => 'api']);
        $permission = Permission::query()->create(['name' => 'products.update', 'guard_name' => 'api']);
        $role->permissions()->attach($permission);
        $editor->roles()->attach($role);
        $token = $this->createApiToken($editor, 'admin', 'catalog-reorder')->plainTextToken;

        $source = $this->category('Nguồn');
        $target = $this->category('Đích');
        $this->category('Con của nguồn', $source);

        $this->withToken($token)->patchJson('/api/v1/admin/categories/reorder', [
            'items' => [['id' => $source, 'sort_order' => 0, 'parent_id' => $target]],
        ])->assertOk();
        $this->assertDatabaseHas('categories', ['id' => $source, 'parent_id' => $target]);

        $this->withToken($token)->patchJson('/api/v1/admin/categories/reorder', [
            'items' => [['id' => $target, 'sort_order' => 0, 'parent_id' => $source]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);
        $this->assertDatabaseHas('categories', ['id' => $target, 'parent_id' => null]);

        $this->withToken($token)->patchJson('/api/v1/admin/categories/reorder', [
            'items' => [['id' => $source, 'sort_order' => 0, 'parent_id' => 999999]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.parent_id']);
    }

    private function category(string $name, ?int $parentId = null): int
    {
        return DB::table('categories')->insertGetId([
            'parent_id' => $parentId,
            'name' => $name,
            'slug' => str()->slug($name).'-'.str()->random(6),
            'sort_order' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
