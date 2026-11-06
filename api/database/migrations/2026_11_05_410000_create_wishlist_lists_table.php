<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlist_lists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->boolean('is_default')->default(false);
            $table->string('share_token', 64)->nullable()->unique();
            $table->timestamps();
            $table->index(['user_id', 'is_default']);
        });

        Schema::table('wishlists', function (Blueprint $table): void {
            $table->unsignedBigInteger('wishlist_list_id')->nullable()->after('user_id');
        });

        DB::table('wishlists')->select('user_id')->distinct()->orderBy('user_id')->chunk(500, function ($users): void {
            foreach ($users as $user) {
                $listId = DB::table('wishlist_lists')->insertGetId([
                    'user_id' => $user->user_id,
                    'name' => 'Yêu thích',
                    'is_default' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('wishlists')->where('user_id', $user->user_id)->update(['wishlist_list_id' => $listId]);
            }
        });

        // Also create the default list for customers whose wishlist is currently empty.
        DB::table('users')->select('id')->orderBy('id')->chunk(500, function ($users): void {
            foreach ($users as $user) {
                DB::table('wishlist_lists')->insertOrIgnore([
                    'user_id' => $user->id,
                    'name' => 'Yêu thích',
                    'is_default' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        Schema::table('wishlists', function (Blueprint $table): void {
            $table->dropPrimary();
            $table->unsignedBigInteger('wishlist_list_id')->nullable(false)->change();
            $table->foreign('wishlist_list_id')->references('id')->on('wishlist_lists')->cascadeOnDelete();
            $table->primary(['wishlist_list_id', 'product_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('wishlists', function (Blueprint $table): void {
            $table->dropPrimary();
            $table->dropForeign(['wishlist_list_id']);
            $table->dropColumn('wishlist_list_id');
            $table->primary(['user_id', 'product_id']);
            $table->dropIndex(['user_id', 'created_at']);
        });

        Schema::dropIfExists('wishlist_lists');
    }
};
