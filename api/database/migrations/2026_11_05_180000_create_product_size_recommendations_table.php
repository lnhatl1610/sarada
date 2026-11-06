<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_size_recommendations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('size_value_id')->constrained('attribute_values')->cascadeOnDelete();
            $table->decimal('height_min_cm', 5, 1);
            $table->decimal('height_max_cm', 5, 1);
            $table->decimal('weight_min_kg', 5, 1);
            $table->decimal('weight_max_kg', 5, 1);
            $table->timestamps();
            $table->unique(['product_id', 'size_value_id'], 'psr_product_size_unique');
            $table->index(['height_min_cm', 'height_max_cm'], 'psr_height_range_idx');
            $table->index(['weight_min_kg', 'weight_max_kg'], 'psr_weight_range_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_size_recommendations');
    }
};
