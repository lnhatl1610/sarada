<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('review_images', function (Blueprint $table): void {
            $table->string('media_type', 16)->default('image')->after('url');
            $table->index(['review_id', 'media_type'], 'review_images_review_media_type_idx');
        });
    }

    public function down(): void
    {
        Schema::table('review_images', function (Blueprint $table): void {
            $table->dropIndex('review_images_review_media_type_idx');
            $table->dropColumn('media_type');
        });
    }
};
