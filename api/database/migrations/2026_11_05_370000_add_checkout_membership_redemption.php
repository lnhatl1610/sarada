<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_transactions', function (Blueprint $table): void {
            $table->foreignId('source_transaction_id')->nullable()->after('payment_refund_id')
                ->constrained('membership_transactions')->nullOnDelete();
        });

        DB::table('membership_transactions')->whereIn('type', ['refund_adjustment', 'return_reversal'])
            ->whereNull('source_transaction_id')->orderBy('id')->chunkById(100, function ($transactions): void {
                foreach ($transactions as $transaction) {
                    $sourceId = DB::table('membership_transactions')->where('order_id', $transaction->order_id)
                        ->where('type', 'earn')->value('id');
                    if ($sourceId !== null) {
                        DB::table('membership_transactions')->where('id', $transaction->id)->update(['source_transaction_id' => $sourceId]);
                    }
                }
            });

        Schema::table('orders', function (Blueprint $table): void {
            $table->unsignedInteger('membership_points_used')->default(0)->after('discount_total');
            $table->unsignedBigInteger('membership_discount_total')->default(0)->after('membership_points_used');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['membership_points_used', 'membership_discount_total']);
        });

        Schema::table('membership_transactions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('source_transaction_id');
        });
    }
};
