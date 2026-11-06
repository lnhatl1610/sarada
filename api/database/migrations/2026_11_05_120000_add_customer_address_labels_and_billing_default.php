<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table): void {
            $table->string('label', 20)->default('home');
            $table->boolean('is_default_billing')->default(false);
        });

        DB::table('addresses')->where('is_default', true)->update(['is_default_billing' => true]);
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table): void {
            $table->dropColumn(['label', 'is_default_billing']);
        });
    }
};
