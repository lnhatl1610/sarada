<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\GetBankTransferInstructionsRequest;
use App\Support\StorefrontPaymentConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BankTransferPaymentController extends Controller
{
    public function show(GetBankTransferInstructionsRequest $request, string $code, StorefrontPaymentConfiguration $configuration): JsonResponse
    {
        $order = DB::table('orders')->where('code', $code)->first([
            'code', 'payment_method', 'payment_status', 'grand_total', 'placed_at', 'payment_instructions',
        ]);
        abort_unless($order && $order->payment_method === 'bank_transfer', 404);

        $expectedToken = $configuration->paymentToken((string) $order->code);
        abort_unless(hash_equals($expectedToken, (string) $request->validated('access_token')), 404);

        $instructions = $order->payment_instructions ? json_decode((string) $order->payment_instructions, true) : null;
        abort_unless(is_array($instructions), 404);
        $cancelAfterHours = (int) (DB::table('settings')->where('key', 'payment_cancel_unpaid_after_hours')->value('value') ?? 24);

        return response()->json(['data' => [
            'code' => (string) $order->code,
            'payment_status' => (string) $order->payment_status,
            'amount' => (int) $order->grand_total,
            'placed_at' => $order->placed_at,
            'expires_at' => $cancelAfterHours > 0
                ? Carbon::parse((string) $order->placed_at)->addHours($cancelAfterHours)->toIso8601String()
                : null,
            'bank' => [
                'bin' => (string) ($instructions['bin'] ?? ''),
                'name' => (string) ($instructions['name'] ?? ''),
                'account' => (string) ($instructions['account'] ?? ''),
                'holder' => (string) ($instructions['holder'] ?? ''),
                'note' => (string) ($instructions['note'] ?? ''),
                'transfer_content' => (string) ($instructions['transfer_content'] ?? ''),
            ],
        ]]);
    }
}
