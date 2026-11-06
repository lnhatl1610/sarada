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
        Schema::table('addresses', function (Blueprint $table): void {
            $table->string('district_code', 32)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('addresses')->whereNull('district_code')->update(['district_code' => '']);

        Schema::table('addresses', function (Blueprint $table): void {
            $table->string('district_code', 32)->nullable(false)->change();
        });
    }
};
