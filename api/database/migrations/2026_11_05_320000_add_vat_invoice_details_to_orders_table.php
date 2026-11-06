<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->boolean('invoice_requested')->default(false);
            $table->string('invoice_tax_code', 14)->nullable();
            $table->string('invoice_company_name', 255)->nullable();
            $table->string('invoice_address', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['invoice_requested', 'invoice_tax_code', 'invoice_company_name', 'invoice_address']);
        });
    }
};
