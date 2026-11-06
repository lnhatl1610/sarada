<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collection_product', function (Blueprint $table): void {
            $table->decimal('lookbook_x', 5, 2)->nullable()->after('sort_order');
            $table->decimal('lookbook_y', 5, 2)->nullable()->after('lookbook_x');
        });
    }

    public function down(): void
    {
        Schema::table('collection_product', function (Blueprint $table): void {
            $table->dropColumn(['lookbook_x', 'lookbook_y']);
        });
    }
};
