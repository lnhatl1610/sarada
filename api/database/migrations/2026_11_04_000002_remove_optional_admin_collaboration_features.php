<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * These optional admin collaboration features were removed. Applying this
     * migration permanently discards rows in their tables.
     */
    public function up(): void
    {
        foreach ([
            'announcement_reads',
            'support_ticket_messages',
            'user_recent_items',
            'announcements',
            'support_tickets',
            'user_shifts',
            'user_bookmarks',
            'user_notes',
            'saved_views',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::hasTable('permissions')) {
            $permissionIds = DB::table('permissions')
                ->whereIn('name', ['announcements.manage', 'saved_views.share', 'support.manage'])
                ->pluck('id');

            if ($permissionIds->isNotEmpty()) {
                DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
                DB::table('permissions')->whereIn('id', $permissionIds)->delete();
            }
        }
    }

    public function down(): void
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

        Schema::create('user_shifts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->text('handoff_note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'started_at'], 'user_shifts_user_started_idx');
            $table->index(['user_id', 'ended_at'], 'user_shifts_user_ended_idx');
        });

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

        Schema::create('user_recent_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject_type', 32);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('url', 500);
            $table->string('label', 191);
            $table->timestamp('visited_at');
            $table->index(['user_id', 'visited_at'], 'user_recent_items_owner_visit_idx');
            $table->index('visited_at', 'user_recent_items_visit_idx');
        });

        foreach ([
            'announcements.manage' => ['admin', 'super_admin'],
            'saved_views.share' => ['admin', 'super_admin'],
            'support.manage' => ['admin', 'super_admin', 'customer_service'],
        ] as $permissionName => $roleNames) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => $permissionName,
                'guard_name' => 'api',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $roleIds = DB::table('roles')->whereIn('name', $roleNames)->where('guard_name', 'api')->pluck('id');
            foreach ($roleIds as $roleId) {
                DB::table('permission_role')->insertOrIgnore(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        }
    }
};
