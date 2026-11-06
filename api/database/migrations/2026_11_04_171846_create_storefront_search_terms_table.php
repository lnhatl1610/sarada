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
        Schema::create('storefront_search_terms', function (Blueprint $table) {
            $table->id();
            $table->date('search_date');
            $table->char('term_hash', 64);
            $table->string('term', 120);
            $table->unsignedInteger('search_count')->default(0);
            $table->timestamp('last_searched_at');
            $table->timestamps();

            $table->unique(['search_date', 'term_hash']);
            $table->index('search_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_search_terms');
    }
};
