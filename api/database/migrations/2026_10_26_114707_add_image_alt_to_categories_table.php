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
        Schema::table('categories', function (Blueprint $table): void {
            $table->string('image_alt')->nullable()->after('image');
        });

        DB::table('categories')->whereNull('image_alt')->orderBy('id')->chunkById(500, function ($categories): void {
            foreach ($categories as $category) {
                DB::table('categories')->where('id', $category->id)->update([
                    'image_alt' => 'Ảnh danh mục '.$category->name,
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->dropColumn('image_alt');
        });
    }
};
