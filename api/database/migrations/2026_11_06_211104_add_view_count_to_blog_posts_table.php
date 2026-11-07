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
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->unsignedBigInteger('view_count')->default(0)->after('published_at');
            $table->index(['is_published', 'view_count'], 'blog_posts_public_views_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropIndex('blog_posts_public_views_idx');
            $table->dropColumn('view_count');
        });
    }
};
