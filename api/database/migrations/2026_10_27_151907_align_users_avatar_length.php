<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'avatar')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('avatar', 500)->nullable()->after('phone');
            });
        } else {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('avatar', 500)->nullable()->change();
            });
        }

        // Keep fresh-install column order aligned with fashion_store_schema.sql.
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('email_verified_at')->nullable()->after('email')->change();
            $table->string('password')->after('email_verified_at')->change();
            $table->rememberToken()->after('password')->change();
            $table->timestamp('created_at')->nullable()->after('remember_token')->change();
            $table->timestamp('updated_at')->nullable()->after('created_at')->change();
            $table->string('phone')->nullable()->after('updated_at')->change();
            $table->string('avatar', 500)->nullable()->after('phone')->change();
            $table->string('status')->default('active')->after('avatar')->change();
            $table->timestamp('last_login_at')->nullable()->after('status')->change();
            $table->softDeletes()->after('last_login_at')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'avatar')) {
            return;
        }

        if (DB::table('users')->whereRaw('CHAR_LENGTH(avatar) > 255')->exists()) {
            throw new RuntimeException('Cannot reduce users.avatar to 255 characters while longer values exist.');
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('email_verified_at')->nullable()->after('last_login_at')->change();
            $table->string('password')->after('email_verified_at')->change();
            $table->rememberToken()->after('password')->change();
            $table->timestamp('created_at')->nullable()->after('remember_token')->change();
            $table->timestamp('updated_at')->nullable()->after('created_at')->change();
            $table->timestamp('deleted_at')->nullable()->after('updated_at')->change();
            $table->string('phone')->nullable()->after('email')->change();
            $table->string('avatar', 255)->nullable()->after('phone')->change();
            $table->string('status')->default('active')->after('avatar')->change();
            $table->timestamp('last_login_at')->nullable()->after('status')->change();
        });
    }
};
