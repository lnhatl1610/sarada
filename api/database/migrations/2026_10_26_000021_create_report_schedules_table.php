<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_schedules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('report', 60);
            $table->json('params')->nullable();
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->enum('format', ['csv', 'pdf'])->default('csv');
            $table->json('recipients');
            $table->string('timezone', 64)->default('Asia/Ho_Chi_Minh');
            $table->time('send_time')->default('08:00:00');
            $table->unsignedTinyInteger('weekday')->nullable();
            $table->unsignedTinyInteger('month_day')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->text('last_error')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'next_run_at'], 'report_schedules_due_idx');
            $table->index(['user_id', 'created_at'], 'report_schedules_owner_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_schedules');
    }
};
