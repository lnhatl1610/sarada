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
        Schema::create('career_openings', function (Blueprint $table) {
            $table->id();
            $table->string('title', 180);
            $table->string('department', 120);
            $table->string('location', 150);
            $table->string('employment_type', 24);
            $table->string('summary', 800)->nullable();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->text('benefits')->nullable();
            $table->boolean('is_active')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->index(['is_active', 'department', 'location', 'sort_order'], 'career_openings_public_filter_idx');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_openings');
    }
};
