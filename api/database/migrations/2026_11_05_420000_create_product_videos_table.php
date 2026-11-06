<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_videos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->string('caption')->nullable();
            $table->foreignId('color_value_id')->nullable()->constrained('attribute_values')->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['product_id', 'color_value_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_videos');
    }
};
