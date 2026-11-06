<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 180);
            $table->string('slug', 180)->unique();
            $table->string('category_name', 100);
            $table->string('category_slug', 120);
            $table->string('excerpt', 500);
            $table->string('cover_image', 500)->nullable();
            $table->string('cover_alt', 180)->nullable();
            $table->longText('content');
            $table->string('meta_title', 180)->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['is_published', 'published_at']);
            $table->index(['category_slug', 'is_published', 'published_at']);
        });

        Schema::create('blog_post_product', function (Blueprint $table): void {
            $table->foreignId('blog_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->primary(['blog_post_id', 'product_id']);
            $table->index(['product_id', 'blog_post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_product');
        Schema::dropIfExists('blog_posts');
    }
};
