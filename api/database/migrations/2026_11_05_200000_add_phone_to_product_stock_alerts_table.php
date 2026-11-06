<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_stock_alerts', function (Blueprint $table): void {
            $table->string('email', 254)->nullable()->change();
            $table->string('phone', 16)->nullable()->after('email');
            $table->unique(['variant_id', 'phone']);
            $table->timestamp('queued_at')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        DB::table('product_stock_alerts')->whereNull('email')->delete();

        Schema::table('product_stock_alerts', function (Blueprint $table): void {
            $table->dropUnique(['variant_id', 'phone']);
            $table->dropColumn('queued_at');
            $table->dropColumn('phone');
            $table->string('email', 254)->nullable(false)->change();
        });
    }
};
