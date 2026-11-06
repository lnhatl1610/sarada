<?php

namespace App\Modules\Shipping\Queries;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class AvailableShippingMethods
{
    public function forDestination(string $provinceCode, ?string $wardCode): Builder
    {
        return DB::table('shipping_methods')
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('province_code')->orWhere('province_code', $provinceCode))
            ->where(function ($query) use ($wardCode): void {
                $query->whereNull('ward_codes');
                $query->orWhereJsonLength('ward_codes', 0);
                if ($wardCode !== null && $wardCode !== '') {
                    $query->orWhereJsonContains('ward_codes', $wardCode);
                }
            });
    }
}
