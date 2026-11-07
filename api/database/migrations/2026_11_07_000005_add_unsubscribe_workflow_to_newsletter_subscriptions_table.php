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
        Schema::table('newsletter_subscriptions', function (Blueprint $table): void {
            $table->timestamp('unsubscribed_at')->nullable();
            $table->string('unsubscribe_reason', 32)->nullable();
            $table->char('unsubscribe_token_hash', 64)->nullable()->unique();
            $table->timestamp('unsubscribe_token_expires_at')->nullable();
            $table->string('pending_unsubscribe_reason', 32)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('newsletter_subscriptions', function (Blueprint $table): void {
            $table->dropUnique(['unsubscribe_token_hash']);
            $table->dropColumn([
                'unsubscribed_at',
                'unsubscribe_reason',
                'unsubscribe_token_hash',
                'unsubscribe_token_expires_at',
                'pending_unsubscribe_reason',
            ]);
        });
    }
};
