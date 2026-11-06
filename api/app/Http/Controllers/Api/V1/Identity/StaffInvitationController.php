<?php

namespace App\Http\Controllers\Api\V1\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Identity\AcceptStaffInvitationRequest;
use App\Models\StaffInvitation;
use App\Models\User;
use App\Modules\AdminAccess\Actions\AcceptStaffInvitationAction;
use Illuminate\Http\JsonResponse;

class StaffInvitationController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $invitation = $this->findInvitation($token);

        return response()->json(['data' => [
            'email' => $invitation->email,
            'role' => $invitation->role->name,
            'expires_at' => $invitation->expires_at,
        ]]);
    }

    public function accept(AcceptStaffInvitationRequest $request, string $token, AcceptStaffInvitationAction $action): JsonResponse
    {
        $user = $action->handle($token, $request->validated(), $request->ip());

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->roles->first()?->name], 'message' => 'Đã nhận lời mời. Bạn có thể đăng nhập.'], 201);
    }

    private function findInvitation(string $token): StaffInvitation
    {
        $invitation = StaffInvitation::query()->with('role')->where('token_hash', hash('sha256', $token))->first();
        abort_unless($invitation && $invitation->status === 'pending' && ! $invitation->revoked_at && $invitation->expires_at->isFuture(), 404, 'Lời mời không hợp lệ hoặc đã hết hạn.');
        abort_if(User::withTrashed()->where('email', $invitation->email)->exists(), 409, 'Email này đã có tài khoản.');

        return $invitation;
    }
}
