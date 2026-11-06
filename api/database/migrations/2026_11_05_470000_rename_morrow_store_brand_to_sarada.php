<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->where('key', 'store_name')->where('value', 'Morrow')->update(['value' => 'Sarada']);
        DB::table('settings')->where('key', 'seo_title')->where('value', 'Morrow — Mặc chậm. Ở lại lâu.')->update(['value' => 'Sarada — Mặc chậm. Ở lại lâu.']);
        DB::table('settings')->where('key', 'seo_description')->where('value', 'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.')
            ->update(['value' => 'Thời trang tối giản từ Sarada — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);
        DB::table('settings')->where('key', 'mail_from_name')->where('value', 'Morrow')->update(['value' => 'Sarada']);

        DB::table('settings')->where('key', 'seo_og_image')->get(['key', 'value'])->each(function (object $setting): void {
            $oldSuffix = '/brands/morrow-og.svg';
            if (is_string($setting->value) && str_ends_with($setting->value, $oldSuffix)) {
                DB::table('settings')->where('key', $setting->key)->where('value', $setting->value)->update([
                    'value' => substr($setting->value, 0, -strlen($oldSuffix)).'/brands/sarada-og.svg',
                ]);
            }
        });

        DB::table('brands')->where('slug', 'net-studio')->where('name', 'Morrow')->update(['name' => 'Sarada']);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'store_name')->where('value', 'Sarada')->update(['value' => 'Morrow']);
        DB::table('settings')->where('key', 'seo_title')->where('value', 'Sarada — Mặc chậm. Ở lại lâu.')->update(['value' => 'Morrow — Mặc chậm. Ở lại lâu.']);
        DB::table('settings')->where('key', 'seo_description')->where('value', 'Thời trang tối giản từ Sarada — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.')
            ->update(['value' => 'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);
        DB::table('settings')->where('key', 'mail_from_name')->where('value', 'Sarada')->update(['value' => 'Morrow']);

        DB::table('settings')->where('key', 'seo_og_image')->get(['key', 'value'])->each(function (object $setting): void {
            $newSuffix = '/brands/sarada-og.svg';
            if (is_string($setting->value) && str_ends_with($setting->value, $newSuffix)) {
                DB::table('settings')->where('key', $setting->key)->where('value', $setting->value)->update([
                    'value' => substr($setting->value, 0, -strlen($newSuffix)).'/brands/morrow-og.svg',
                ]);
            }
        });

        DB::table('brands')->where('slug', 'net-studio')->where('name', 'Sarada')->update(['name' => 'Morrow']);
    }
};
