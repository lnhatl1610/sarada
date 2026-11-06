<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_location_inventories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_location_id')->constrained()->restrictOnDelete();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('reserved')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(0);
            $table->timestamps();
            $table->unique(['store_location_id', 'variant_id'], 'store_location_variant_inventory_unique');
            $table->index(['variant_id', 'store_location_id']);
        });

        Schema::table('inventory_movements', function (Blueprint $table): void {
            $table->foreignId('store_location_id')->nullable()->after('variant_id')->constrained()->restrictOnDelete();
            $table->index(['store_location_id', 'variant_id', 'created_at'], 'inventory_movements_store_variant_created_idx');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->string('fulfillment_type', 20)->default('delivery')->after('shipping_address')->index();
            $table->foreignId('pickup_location_id')->nullable()->after('fulfillment_type')->constrained('store_locations')->nullOnDelete();
            $table->json('pickup_location_snapshot')->nullable()->after('pickup_location_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pickup_location_id');
            $table->dropIndex('orders_fulfillment_type_index');
            $table->dropColumn(['fulfillment_type', 'pickup_location_snapshot']);
        });
        Schema::table('inventory_movements', function (Blueprint $table): void {
            $table->dropIndex('inventory_movements_store_variant_created_idx');
            $table->dropConstrainedForeignId('store_location_id');
        });
        Schema::dropIfExists('store_location_inventories');
    }
};
