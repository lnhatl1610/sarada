<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_jobs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 60);
            $table->json('params')->nullable();
            $table->enum('status', ['queued', 'running', 'ready', 'failed', 'expired'])->default('queued');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->string('file_path', 255)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('error', 500)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->index(['user_id', 'created_at'], 'export_jobs_user_created_idx');
            $table->index(['status', 'expires_at'], 'export_jobs_status_expiry_idx');
        });

        Schema::create('account_deactivation_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at'], 'deactivation_status_created_idx');
            $table->index(['user_id', 'status'], 'deactivation_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_deactivation_requests');
        Schema::dropIfExists('export_jobs');
    }
};
