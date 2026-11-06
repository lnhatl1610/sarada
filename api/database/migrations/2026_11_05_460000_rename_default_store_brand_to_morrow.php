<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')
            ->where('key', 'store_name')
            ->where('value', 'NÉT Studio')
            ->update(['value' => 'Morrow']);

        DB::table('settings')
            ->where('key', 'seo_title')
            ->where('value', 'NÉT Studio — Mặc chậm. Ở lại lâu.')
            ->update(['value' => 'Morrow — Mặc chậm. Ở lại lâu.']);

        DB::table('settings')
            ->where('key', 'seo_description')
            ->where('value', 'Thời trang tối giản từ NÉT Studio — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.')
            ->update(['value' => 'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);

        DB::table('settings')
            ->where('key', 'seo_og_image')
            ->get(['id', 'key', 'value'])
            ->each(function (object $setting): void {
                $oldSuffix = '/brands/net-studio-og.jpg';

                if ($oldSuffix !== null && is_string($setting->value) && str_ends_with($setting->value, $oldSuffix)) {
                    $newSuffix = '/brands/morrow-og.svg';

                    DB::table('settings')->where('id', $setting->id)->update([
                        'value' => substr($setting->value, 0, -strlen($oldSuffix)).$newSuffix,
                    ]);
                }
            });

        DB::table('brands')
            ->where('slug', 'net-studio')
            ->where('name', 'NÉT Studio')
            ->update(['name' => 'Morrow']);
    }

    public function down(): void
    {
        DB::table('settings')
            ->where('key', 'store_name')
            ->where('value', 'Morrow')
            ->update(['value' => 'NÉT Studio']);

        DB::table('settings')
            ->where('key', 'seo_title')
            ->where('value', 'Morrow — Mặc chậm. Ở lại lâu.')
            ->update(['value' => 'NÉT Studio — Mặc chậm. Ở lại lâu.']);

        DB::table('settings')
            ->where('key', 'seo_description')
            ->where('value', 'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.')
            ->update(['value' => 'Thời trang tối giản từ NÉT Studio — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);

        DB::table('settings')
            ->where('key', 'seo_og_image')
            ->get(['id', 'key', 'value'])
            ->each(function (object $setting): void {
                $newSuffix = '/brands/morrow-og.svg';

                if ($newSuffix !== null && is_string($setting->value) && str_ends_with($setting->value, $newSuffix)) {
                    $oldSuffix = '/brands/net-studio-og.jpg';

                    DB::table('settings')->where('id', $setting->id)->update([
                        'value' => substr($setting->value, 0, -strlen($newSuffix)).$oldSuffix,
                    ]);
                }
            });

        DB::table('brands')
            ->where('slug', 'net-studio')
            ->where('name', 'Morrow')
            ->update(['name' => 'NÉT Studio']);
    }
};
