<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_refunds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->text('reason');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['order_id', 'created_at']);
            $table->index(['payment_id', 'created_at']);
        });

        DB::table('payments')->where('status', 'refunded')->orderBy('id')->chunkById(100, function ($payments): void {
            $now = now();
            foreach ($payments as $payment) {
                DB::table('payment_refunds')->insert([
                    'order_id' => $payment->order_id,
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'reason' => 'Hoàn tiền toàn bộ trước khi theo dõi chi tiết khoản hoàn.',
                    'recorded_by' => null,
                    'created_at' => $payment->updated_at ?? $now,
                    'updated_at' => $payment->updated_at ?? $now,
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_refunds');
    }
};
