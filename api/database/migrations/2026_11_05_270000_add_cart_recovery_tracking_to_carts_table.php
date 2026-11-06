<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table): void {
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamp('recovery_1h_sent_at')->nullable();
            $table->timestamp('recovery_24h_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table): void {
            $table->dropColumn(['last_activity_at', 'recovery_1h_sent_at', 'recovery_24h_sent_at']);
        });
    }
};
