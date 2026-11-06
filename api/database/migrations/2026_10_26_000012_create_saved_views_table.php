<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_views', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('page', 60);
            $table->string('name', 120);
            $table->json('query');
            $table->json('columns')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_shared')->default(false);
            $table->timestamps();
            $table->index(['page', 'is_shared'], 'idx_sv_page_shared');
            $table->index(['user_id', 'page'], 'idx_sv_user_page');
        });

        $permissionId = DB::table('permissions')->where('name', 'saved_views.share')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'saved_views.share', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $adminRoleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin'])->where('guard_name', 'api')->pluck('id');
        foreach ($adminRoleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_views');
    }
};
