<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_stock_alerts', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('variant_id')->constrained()->cascadeOnDelete();
            $table->unique(['variant_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('product_stock_alerts', function (Blueprint $table): void {
            $table->dropUnique(['variant_id', 'user_id']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
