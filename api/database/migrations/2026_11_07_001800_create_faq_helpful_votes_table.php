<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faq_helpful_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('faq_id')->constrained('faqs')->cascadeOnDelete();
            $table->uuid('visitor_id');
            $table->boolean('helpful');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['faq_id', 'visitor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faq_helpful_votes');
    }
};
