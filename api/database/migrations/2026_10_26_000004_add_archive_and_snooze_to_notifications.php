<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('read_at');
            $table->timestamp('snoozed_until')->nullable()->after('archived_at');
            $table->index(['notifiable_type', 'notifiable_id', 'archived_at', 'created_at'], 'notifications_owner_archive_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            $table->dropIndex('notifications_owner_archive_created_idx');
            $table->dropColumn(['archived_at', 'snoozed_until']);
        });
    }
};
