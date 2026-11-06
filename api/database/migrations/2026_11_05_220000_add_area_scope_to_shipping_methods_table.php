<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_methods', function (Blueprint $table): void {
            $table->string('province_code', 32)->nullable()->index()->after('est_days');
            $table->json('ward_codes')->nullable()->after('province_code');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_methods', function (Blueprint $table): void {
            $table->dropIndex(['province_code']);
            $table->dropColumn(['province_code', 'ward_codes']);
        });
    }
};
