<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['question', 'bug', 'feedback', 'access', 'other'])->default('question');
            $table->enum('severity', ['low', 'normal', 'high'])->default('normal');
            $table->enum('status', ['new', 'in_progress', 'waiting_user', 'done'])->default('new');
            $table->string('subject', 191);
            $table->unsignedTinyInteger('rating')->nullable();
            $table->json('context')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at'], 'support_tickets_status_created_idx');
            $table->index(['user_id', 'created_at'], 'support_tickets_user_created_idx');
        });

        Schema::create('support_ticket_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->json('attachments')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['ticket_id', 'created_at'], 'support_messages_ticket_created_idx');
        });

        $permissionId = DB::table('permissions')->where('name', 'support.manage')->where('guard_name', 'api')->value('id');
        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'support.manage', 'guard_name' => 'api', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $adminRoleIds = DB::table('roles')->whereIn('name', ['super_admin', 'admin', 'customer_service'])->where('guard_name', 'api')->pluck('id');
        foreach ($adminRoleIds as $roleId) {
            DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
        }
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'support.manage')->where('guard_name', 'api')->value('id');
        if ($permissionId) {
            DB::table('permission_role')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};
