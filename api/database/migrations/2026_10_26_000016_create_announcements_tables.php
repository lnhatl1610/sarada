<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 180);
            $table->text('body');
            $table->string('kind', 24)->default('feature');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('audience', 20)->default('all');
            $table->json('role_names')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['starts_at', 'ends_at', 'kind']);
        });

        Schema::create('announcement_reads', function (Blueprint $table): void {
            $table->foreignId('announcement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->primary(['announcement_id', 'user_id']);
            $table->index(['user_id', 'read_at']);
        });

        $permissionId = DB::table('permissions')->where('name', 'announcements.manage')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'announcements.manage', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $roleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin'])->where('guard_name', 'api')->pluck('id');
        foreach ($roleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_reads');
        Schema::dropIfExists('announcements');
        // Keep the permission row because the seeder also owns it.
    }
};
