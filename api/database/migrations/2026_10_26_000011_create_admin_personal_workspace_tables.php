<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('job_title', 100)->nullable();
            $table->string('department', 50)->nullable();
            $table->string('staff_code', 30)->nullable()->unique();
            $table->string('bio', 500)->nullable();
            $table->string('signature', 300)->nullable();
            $table->string('timezone', 64)->default('Asia/Ho_Chi_Minh');
            $table->enum('presence_status', ['available', 'busy', 'away', 'invisible'])->default('available');
            $table->timestamp('presence_until')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->json('allowed_ips')->nullable();
        });

        Schema::create('login_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable();
            $table->enum('result', ['success', 'bad_password', 'bad_2fa', 'locked', 'passkey']);
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('location', 120)->nullable();
            $table->timestamp('reported_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index(['user_id', 'created_at'], 'login_attempts_user_created_idx');
            $table->index(['email', 'created_at'], 'login_attempts_email_created_idx');
        });

        Schema::create('user_tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['todo', 'doing', 'done'])->default('todo');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('remind_at')->nullable();
            $table->string('repeat_rule', 50)->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->string('subject_type', 100)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status', 'due_at'], 'user_tasks_user_status_due_idx');
            $table->index('remind_at', 'user_tasks_remind_idx');
        });

        Schema::create('user_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->json('tags')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_pinned', 'updated_at'], 'user_notes_owner_pin_updated_idx');
        });

        Schema::create('user_bookmarks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject_type', 100);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('url', 500)->nullable();
            $table->string('label', 191);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->unique(['user_id', 'subject_type', 'subject_id'], 'user_bookmarks_owner_subject_unique');
            $table->index(['user_id', 'sort_order'], 'user_bookmarks_owner_order_idx');
        });

        $permissionId = DB::table('permissions')->where('name', 'tasks.assign')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'tasks.assign',
                'guard_name' => 'api',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $adminRoleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin'])->where('guard_name', 'api')->pluck('id');
        foreach ($adminRoleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'tasks.assign')->where('guard_name', 'api')->value('id');
        if ($permissionId) {
            DB::table('permission_role')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
        Schema::dropIfExists('user_bookmarks');
        Schema::dropIfExists('user_notes');
        Schema::dropIfExists('user_tasks');
        Schema::dropIfExists('login_attempts');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'job_title', 'department', 'staff_code', 'bio', 'signature', 'timezone', 'presence_status',
                'presence_until', 'last_seen_at', 'last_login_ip', 'password_changed_at', 'must_change_password', 'allowed_ips',
            ]);
        });
    }
};
