<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->where('key', 'store_name')->whereIn('value', ['NÉT Studio', 'Morrow'])->update(['value' => 'Sarada']);
        DB::table('settings')->where('key', 'seo_title')->whereIn('value', ['NÉT Studio — Mặc chậm. Ở lại lâu.', 'Morrow — Mặc chậm. Ở lại lâu.'])
            ->update(['value' => 'Sarada — Mặc chậm. Ở lại lâu.']);
        DB::table('settings')->where('key', 'seo_description')->whereIn('value', [
            'Thời trang tối giản từ NÉT Studio — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.',
            'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.',
        ])->update(['value' => 'Thời trang tối giản từ Sarada — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);
        DB::table('settings')->where('key', 'mail_from_name')->whereIn('value', ['NÉT Studio', 'Morrow'])->update(['value' => 'Sarada']);

        DB::table('settings')->where('key', 'seo_og_image')->get(['key', 'value'])->each(function (object $setting): void {
            foreach (['/brands/net-studio-og.jpg', '/brands/morrow-og.svg'] as $oldSuffix) {
                if (is_string($setting->value) && str_ends_with($setting->value, $oldSuffix)) {
                    DB::table('settings')->where('key', $setting->key)->where('value', $setting->value)->update([
                        'value' => substr($setting->value, 0, -strlen($oldSuffix)).'/brands/sarada-og.svg',
                    ]);
                    break;
                }
            }
        });

        DB::table('brands')->where('slug', 'net-studio')->whereIn('name', ['NÉT Studio', 'Morrow'])->update(['name' => 'Sarada']);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'store_name')->where('value', 'Sarada')->update(['value' => 'Morrow']);
        DB::table('settings')->where('key', 'seo_title')->where('value', 'Sarada — Mặc chậm. Ở lại lâu.')
            ->update(['value' => 'Morrow — Mặc chậm. Ở lại lâu.']);
        DB::table('settings')->where('key', 'seo_description')->where('value', 'Thời trang tối giản từ Sarada — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.')
            ->update(['value' => 'Thời trang tối giản từ Morrow — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.']);
        DB::table('settings')->where('key', 'mail_from_name')->where('value', 'Sarada')->update(['value' => 'Morrow']);

        DB::table('settings')->where('key', 'seo_og_image')->get(['key', 'value'])->each(function (object $setting): void {
            $suffix = '/brands/sarada-og.svg';
            if (is_string($setting->value) && str_ends_with($setting->value, $suffix)) {
                DB::table('settings')->where('key', $setting->key)->where('value', $setting->value)->update([
                    'value' => substr($setting->value, 0, -strlen($suffix)).'/brands/morrow-og.svg',
                ]);
            }
        });

        DB::table('brands')->where('slug', 'net-studio')->where('name', 'Sarada')->update(['name' => 'Morrow']);
    }
};
