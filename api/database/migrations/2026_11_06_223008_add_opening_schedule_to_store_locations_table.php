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
            $table->json('opening_schedule')->nullable()->after('opening_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_locations', function (Blueprint $table) {
            $table->dropColumn('opening_schedule');
        });
    }
};
