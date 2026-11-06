<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table): void {
            $table->unsignedBigInteger('min_order_amount')->default(0);
            $table->timestamp('expires_at')->nullable();
        });

        Schema::table('coupon_usages', function (Blueprint $table): void {
            $table->unsignedBigInteger('discount')->default(0);
        });

        Schema::table('banners', function (Blueprint $table): void {
            $table->string('link_url', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table): void {
            $table->dropColumn('link_url');
        });

        Schema::table('coupon_usages', function (Blueprint $table): void {
            $table->dropColumn('discount');
        });

        Schema::table('coupons', function (Blueprint $table): void {
            $table->dropColumn(['min_order_amount', 'expires_at']);
        });
    }
};
