<?php

namespace App\Modules\Membership\Support;

class MembershipTiers
{
    public const POINT_VALUE_VND = 100;

    public const POINT_EXPIRY_MONTHS = 12;

    /** @return array<int, array{key: string, name: string, threshold_vnd: int, earn_rate_basis_points: int, benefits: array<int, string>}> */
    public static function all(): array
    {
        return [
            ['key' => 'member', 'name' => 'Thành viên', 'threshold_vnd' => 0, 'earn_rate_basis_points' => 10_000, 'benefits' => ['Tích 1 điểm cho mỗi 10.000 VND chi tiêu']],
            ['key' => 'silver', 'name' => 'Bạc', 'threshold_vnd' => 5_000_000, 'earn_rate_basis_points' => 12_500, 'benefits' => ['Tích điểm với hệ số 1,25']],
            ['key' => 'gold', 'name' => 'Vàng', 'threshold_vnd' => 15_000_000, 'earn_rate_basis_points' => 15_000, 'benefits' => ['Tích điểm với hệ số 1,5', 'Ưu tiên xem bộ sưu tập mới']],
            ['key' => 'diamond', 'name' => 'Kim cương', 'threshold_vnd' => 30_000_000, 'earn_rate_basis_points' => 20_000, 'benefits' => ['Tích điểm với hệ số 2', 'Ưu tiên xem bộ sưu tập mới']],
        ];
    }

    /** @return array{key: string, name: string, threshold_vnd: int, earn_rate_basis_points: int, benefits: array<int, string>} */
    public static function forSpend(int $spend): array
    {
        $current = self::all()[0];
        foreach (self::all() as $tier) {
            if ($spend < $tier['threshold_vnd']) {
                break;
            }
            $current = $tier;
        }

        return $current;
    }

    public static function nextAfter(string $key): ?array
    {
        $tiers = self::all();
        foreach ($tiers as $index => $tier) {
            if ($tier['key'] === $key) {
                return $tiers[$index + 1] ?? null;
            }
        }

        return null;
    }
}
