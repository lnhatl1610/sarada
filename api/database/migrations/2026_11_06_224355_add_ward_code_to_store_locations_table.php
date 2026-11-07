<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_locations', function (Blueprint $table) {
            $table->string('ward_code', 32)->nullable()->after('province_code');
            $table->index(['is_active', 'province_code', 'ward_code', 'sort_order'], 'store_locations_public_ward_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_locations', function (Blueprint $table) {
            $table->dropIndex('store_locations_public_ward_idx');
            $table->dropColumn('ward_code');
        });
    }
};
