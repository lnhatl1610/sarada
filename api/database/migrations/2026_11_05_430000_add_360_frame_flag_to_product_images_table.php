<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table): void {
            $table->boolean('is_360_frame')->default(false)->after('color_value_id');
            $table->index(['product_id', 'is_360_frame', 'color_value_id'], 'product_images_360_frames_idx');
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table): void {
            $table->dropIndex('product_images_360_frames_idx');
            $table->dropColumn('is_360_frame');
        });
    }
};
