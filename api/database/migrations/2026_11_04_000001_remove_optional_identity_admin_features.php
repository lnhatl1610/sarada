<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * These optional features were removed from the application. Their stored
     * records are intentionally discarded when this migration is applied.
     */
    public function up(): void
    {
        foreach ([
            'permission_requests',
            'user_permission_grants',
            'telegram_link_codes',
            'linked_accounts',
            'passkeys',
            'admin_impersonation_sessions',
            'account_deactivation_requests',
            'trusted_admin_devices',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::hasTable('permissions')) {
            $permissionId = DB::table('permissions')->where('name', 'staff.impersonate')->value('id');

            if ($permissionId !== null) {
                DB::table('permission_role')->where('permission_id', $permissionId)->delete();
                DB::table('permissions')->where('id', $permissionId)->delete();
            }
        }
    }

    public function down(): void
    {
        Schema::create('trusted_admin_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->string('ip', 45)->nullable();
            $table->text('device_info')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->index(['user_id', 'expires_at']);
        });

        Schema::create('account_deactivation_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at'], 'deactivation_status_created_idx');
            $table->index(['user_id', 'status'], 'deactivation_user_status_idx');
        });

        Schema::create('admin_impersonation_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('actor_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('actor_session_id');
            $table->timestamp('expires_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('started_ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['actor_session_id', 'ended_at', 'expires_at'], 'admin_impersonation_active_session_idx');
            $table->index(['target_user_id', 'created_at'], 'admin_impersonation_target_created_idx');
        });

        Schema::create('passkeys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('credential_id')->unique();
            $table->json('credential');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('linked_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 24);
            $table->string('provider_user_id', 191);
            $table->string('display_name', 191)->nullable();
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_user_id'], 'linked_accounts_provider_user_unique');
            $table->unique(['user_id', 'provider'], 'linked_accounts_user_provider_unique');
        });

        Schema::create('telegram_link_codes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('code_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at'], 'telegram_link_codes_user_expiry_idx');
        });

        Schema::create('user_permission_grants', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'permission_id'], 'user_permission_grants_pk');
            $table->index('permission_id', 'user_permission_grants_permission_idx');
        });

        Schema::create('permission_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->text('reason');
            $table->string('status', 20)->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at'], 'permission_requests_status_created_idx');
            $table->index(['user_id', 'status'], 'permission_requests_user_status_idx');
        });

        DB::table('permissions')->insertOrIgnore([
            'name' => 'staff.impersonate',
            'guard_name' => 'api',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
