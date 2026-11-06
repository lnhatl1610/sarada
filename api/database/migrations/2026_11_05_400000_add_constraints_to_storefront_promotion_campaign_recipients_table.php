<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $foreignKeys = collect(Schema::getForeignKeys('storefront_promotion_campaign_recipients'))
            ->flatMap(fn (array $foreignKey): array => $foreignKey['columns'] ?? [])
            ->all();
        $indexes = collect(Schema::getIndexes('storefront_promotion_campaign_recipients'))
            ->pluck('name')
            ->all();

        Schema::table('storefront_promotion_campaign_recipients', function (Blueprint $table) use ($foreignKeys, $indexes): void {
            if (! in_array('campaign_id', $foreignKeys, true)) {
                $table->foreign('campaign_id', 'promo_campaign_recipient_campaign_fk')
                    ->references('id')->on('storefront_promotion_campaigns')->cascadeOnDelete();
            }
            if (! in_array('user_id', $foreignKeys, true)) {
                $table->foreign('user_id', 'promo_campaign_recipient_user_fk')
                    ->references('id')->on('users')->nullOnDelete();
            }
            if (! in_array('promo_campaign_email_hash_unique', $indexes, true)) {
                $table->unique(['campaign_id', 'email_hash'], 'promo_campaign_email_hash_unique');
            }
            if (! in_array('promo_campaign_status_id_idx', $indexes, true)) {
                $table->index(['campaign_id', 'status', 'id'], 'promo_campaign_status_id_idx');
            }
        });
    }

    public function down(): void
    {
        $foreignKeys = Schema::getForeignKeys('storefront_promotion_campaign_recipients');
        $indexes = collect(Schema::getIndexes('storefront_promotion_campaign_recipients'))
            ->pluck('name')
            ->all();

        Schema::table('storefront_promotion_campaign_recipients', function (Blueprint $table) use ($foreignKeys, $indexes): void {
            if (in_array('promo_campaign_email_hash_unique', $indexes, true)) {
                $table->dropUnique('promo_campaign_email_hash_unique');
            }
            if (in_array('promo_campaign_status_id_idx', $indexes, true)) {
                $table->dropIndex('promo_campaign_status_id_idx');
            }
            foreach ($foreignKeys as $foreignKey) {
                $table->dropForeign($foreignKey['name']);
            }
        });
    }
};
