<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admin_impersonation_sessions', function (Blueprint $table) {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_impersonation_sessions');
    }
};
