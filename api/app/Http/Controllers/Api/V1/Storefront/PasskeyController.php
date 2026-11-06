<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Identity\RegisterPasskeyRequest;
use App\Models\Passkey;
use App\Modules\Identity\Services\StorefrontPasskeyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PasskeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()->passkeys()->orderByDesc('created_at')->get(['id', 'name', 'last_used_at', 'created_at']);

        return response()->json(['data' => $passkeys]);
    }

    public function registrationOptions(Request $request, StorefrontPasskeyService $passkeys): JsonResponse
    {
        return response()->json(['data' => $passkeys->registrationOptions($request->user())]);
    }

    public function store(RegisterPasskeyRequest $request, StorefrontPasskeyService $passkeys): JsonResponse
    {
        $data = $request->validated();
        $passkey = $passkeys->register($request->user(), $data['challenge_id'], $data['name'], $data['credential']);

        return response()->json(['data' => [
            'id' => $passkey->id,
            'name' => $passkey->name,
            'last_used_at' => $passkey->last_used_at,
            'created_at' => $passkey->created_at,
        ]], 201);
    }

    public function destroy(Request $request, int $passkey): JsonResponse
    {
        $record = Passkey::query()->where('user_id', $request->user()->id)->findOrFail($passkey);
        $record->delete();

        return response()->json(['message' => 'Đã xóa passkey.']);
    }
}
