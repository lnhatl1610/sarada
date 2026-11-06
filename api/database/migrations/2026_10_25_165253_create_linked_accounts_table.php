<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('linked_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 24);
            $table->string('provider_user_id', 191);
            $table->string('display_name', 191)->nullable();
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_user_id'], 'linked_accounts_provider_user_unique');
            $table->unique(['user_id', 'provider'], 'linked_accounts_user_provider_unique');
        });

        Schema::create('telegram_link_codes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('code_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at'], 'telegram_link_codes_user_expiry_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_link_codes');
        Schema::dropIfExists('linked_accounts');
    }
};
