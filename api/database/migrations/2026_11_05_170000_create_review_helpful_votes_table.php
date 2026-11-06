<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_helpful_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->uuid('visitor_id');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['review_id', 'visitor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_helpful_votes');
    }
};
