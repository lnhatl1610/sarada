<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_change_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requester_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 24);
            $table->string('status', 24)->default('pending');
            $table->string('reason', 1000);
            $table->text('resolution_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'status', 'created_at'], 'order_change_requests_order_status_created_idx');
            $table->index(['status', 'type', 'created_at'], 'order_change_requests_status_type_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_change_requests');
    }
};
