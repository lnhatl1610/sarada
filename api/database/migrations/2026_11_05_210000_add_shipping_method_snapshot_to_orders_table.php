<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('shipping_method_name', 100)->nullable()->after('shipping_method_id');
            $table->string('shipping_method_est_days', 30)->nullable()->after('shipping_method_name');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['shipping_method_name', 'shipping_method_est_days']);
        });
    }
};
