<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->char('webauthn_user_handle', 64)->nullable()->unique();
        });

        Schema::create('passkeys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->text('credential_id');
            $table->char('credential_id_hash', 64)->unique();
            $table->json('credential');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('passkey_challenges', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('purpose', ['registration', 'login']);
            $table->json('options');
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'purpose', 'expires_at'], 'passkey_challenge_user_purpose_expiry_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passkey_challenges');
        Schema::dropIfExists('passkeys');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['webauthn_user_handle']);
            $table->dropColumn('webauthn_user_handle');
        });
    }
};
