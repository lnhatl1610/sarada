<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListMembershipTransactionsRequest;
use App\Modules\Membership\Actions\GetMembershipSummaryAction;
use App\Modules\Membership\Support\MembershipTiers;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MembershipController extends Controller
{
    public function tiers(): JsonResponse
    {
        return response()->json(['data' => [
            'tiers' => MembershipTiers::all(),
            'point_value_vnd' => MembershipTiers::POINT_VALUE_VND,
            'points_expire_after_months' => MembershipTiers::POINT_EXPIRY_MONTHS,
        ]]);
    }

    public function show(ListMembershipTransactionsRequest $request, GetMembershipSummaryAction $summary): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $transactions = DB::table('membership_transactions')->where('user_id', $userId)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate((int) ($request->validated('per_page') ?? 20));

        return response()->json([
            'data' => [
                'summary' => $summary->execute($userId),
                'transactions' => collect($transactions->items())->map(fn (object $row): array => [
                    'id' => (int) $row->id,
                    'type' => (string) $row->type,
                    'points_delta' => (int) $row->points_delta,
                    'amount_vnd' => (int) $row->amount_vnd,
                    'description' => (string) $row->description,
                    'expires_at' => $row->expires_at,
                    'created_at' => $row->created_at,
                    'is_expired' => $row->expires_at !== null && $row->expires_at <= now()->toDateTimeString(),
                ])->values(),
                'meta' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
            ],
        ]);
    }
}
