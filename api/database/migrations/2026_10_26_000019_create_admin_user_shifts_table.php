<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('user_shifts');
    }
};
