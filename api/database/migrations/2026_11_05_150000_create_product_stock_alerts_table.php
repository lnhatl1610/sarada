<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_stock_alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->string('email', 254);
            $table->timestamps();
            $table->unique(['variant_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_stock_alerts');
    }
};
