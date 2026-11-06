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
        Schema::create('store_locations', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('address', 500);
            $table->string('province_code', 32)->index();
            $table->string('province_name', 150);
            $table->string('ward_name', 150)->nullable();
            $table->string('phone', 32);
            $table->string('email', 254)->nullable();
            $table->text('opening_hours');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->index(['is_active', 'province_code', 'sort_order'], 'store_locations_public_order_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_locations');
    }
};
