<?php

namespace App\Modules\Shipping\Actions;

use App\Modules\Shipping\Queries\AvailableShippingMethods;
use Illuminate\Support\Facades\DB;

class GetStorefrontShippingEstimateAction
{
    public function __construct(private readonly AvailableShippingMethods $availableMethods) {}

    /** @return array<string, mixed> */
    public function execute(string $provinceCode, ?string $wardCode = null): array
    {
        $rate = DB::table('shipping_rates')
            ->where('province_code', $provinceCode)
            ->where('is_active', true)
            ->first();
        $fee = (int) ($rate?->fee ?? DB::table('settings')->where('key', 'default_shipping_fee')->value('value') ?? config('store.default_shipping_fee'));
        $threshold = $rate?->free_shipping_threshold ?? DB::table('settings')->where('key', 'free_shipping_threshold')->value('value') ?? config('store.free_shipping_threshold');
        $methods = $this->availableMethods->forDestination($provinceCode, $wardCode)
            ->orderBy('fee')
            ->orderBy('name')
            ->get(['id', 'name', 'fee', 'est_days'])
            ->map(fn (object $method): array => [
                'id' => (int) $method->id,
                'name' => (string) $method->name,
                'fee' => (int) $method->fee,
                'est_days' => $method->est_days === null ? null : (string) $method->est_days,
            ]);

        return [
            'province_code' => $provinceCode,
            'fee' => $fee,
            'free_shipping_threshold' => $threshold === null ? null : (int) $threshold,
            'shipping_methods' => collect([[
                'id' => null,
                'name' => 'Giao hàng theo tỉnh/thành',
                'fee' => $fee,
                'est_days' => null,
            ]])->concat($methods)->values()->all(),
        ];
    }
}
