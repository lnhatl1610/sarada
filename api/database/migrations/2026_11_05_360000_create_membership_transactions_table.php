<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_refund_id')->nullable()->constrained('payment_refunds')->nullOnDelete();
            $table->string('reference_key', 120)->unique();
            $table->string('type', 32);
            $table->integer('points_delta');
            $table->unsignedBigInteger('amount_vnd')->default(0);
            $table->unsignedSmallInteger('earn_rate_basis_points')->nullable();
            $table->string('description', 240);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'expires_at']);
            $table->index(['order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_transactions');
    }
};
