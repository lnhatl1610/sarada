<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminContentPagesTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(string $permission = 'content.manage'): array
    {
        $user = User::factory()->create();
        $role = Role::query()->create(['name' => 'pages-'.bin2hex(random_bytes(4)), 'guard_name' => 'api']);
        $ability = Permission::query()->firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        $role->permissions()->attach($ability);
        $user->roles()->attach($role);

        return [$user, $this->createApiToken($user, 'admin', 'admin-pages')->plainTextToken];
    }

    public function test_admin_can_manage_pages_and_mutations_are_audited(): void
    {
        [$admin, $token] = $this->adminToken();
        $this->withToken($token)->postJson('/api/v1/admin/pages', [
            'title' => 'Chính sách đổi trả', 'slug' => 'doi-tra', 'content' => "Đổi trả trong 7 ngày.\nGiữ nguyên nhãn.", 'is_published' => true,
        ])->assertCreated()->assertJsonPath('data.slug', 'doi-tra')->assertJsonPath('data.is_published', true);

        $page = Page::query()->where('slug', 'doi-tra')->firstOrFail();
        $this->assertSame(1, DB::table('activity_logs')->where('user_id', $admin->id)->where('module', 'pages')->count());
        $this->getJson('/api/v1/admin/pages?q=đổi')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson("/api/v1/admin/pages/{$page->id}")->assertOk()->assertJsonPath('data.content', "Đổi trả trong 7 ngày.\nGiữ nguyên nhãn.");
        $this->getJson('/api/v1/pages/doi-tra')->assertOk()->assertJsonPath('data.title', 'Chính sách đổi trả');
        $this->postJson('/api/v1/admin/pages', [
            'title' => 'Trang trùng', 'slug' => 'doi-tra', 'content' => 'Nội dung', 'is_published' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $this->patchJson("/api/v1/admin/pages/{$page->id}", [
            'title' => 'Đổi trả', 'slug' => 'doi-tra', 'content' => 'Bản cập nhật', 'is_published' => false,
        ])->assertOk()->assertJsonPath('data.is_published', false);
        $this->getJson('/api/v1/pages/doi-tra')->assertNotFound();
        $this->deleteJson("/api/v1/admin/pages/{$page->id}")->assertOk();
        $this->assertSame(3, DB::table('activity_logs')->where('user_id', $admin->id)->where('module', 'pages')->count());
    }

    public function test_page_management_requires_content_permission_and_slug_must_be_unique(): void
    {
        $this->getJson('/api/v1/admin/pages')->assertUnauthorized();
        $this->postJson('/api/v1/admin/pages', [])->assertUnauthorized();

        $customer = User::factory()->create();
        $customerToken = $this->createApiToken($customer, 'storefront', 'storefront-pages')->plainTextToken;
        $this->withToken($customerToken)->getJson('/api/v1/admin/pages')->assertForbidden();

        [, $withoutPermission] = $this->adminToken('orders.view');
        $this->withToken($withoutPermission)->getJson('/api/v1/admin/pages')->assertForbidden();

        Page::query()->create(['title' => 'Trang A', 'slug' => 'trang-a', 'content' => 'Nội dung', 'is_published' => false]);
        $this->getJson('/api/v1/pages/trang-a')->assertNotFound();
    }
}
