<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Support\VietnamAddressCatalog;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function provinces(VietnamAddressCatalog $catalog): JsonResponse
    {
        return response()->json([
            'data' => $catalog->provinces(),
            'meta' => $catalog->metadata(),
        ])->header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }

    public function wards(VietnamAddressCatalog $catalog, string $provinceCode): JsonResponse
    {
        $wards = $catalog->wards($provinceCode);
        abort_if($wards === null, 404, 'Không tìm thấy tỉnh/thành phố.');

        return response()->json([
            'data' => $wards,
            'meta' => $catalog->metadata(),
        ])->header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
}
