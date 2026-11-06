<?php

namespace App\Modules\AdminAccess\Actions;

use App\Models\Role;
use App\Models\StaffInvitation;
use App\Notifications\StaffInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class CreateStaffInvitationAction
{
    public function handle(array $data, int $inviterId): StaffInvitation
    {
        $token = Str::random(64);
        $invitation = DB::transaction(function () use ($data, $inviterId, $token): StaffInvitation {
            StaffInvitation::query()->where('email', Str::lower($data['email']))->where('status', 'pending')
                ->update(['status' => 'revoked', 'revoked_at' => now(), 'updated_at' => now()]);

            return StaffInvitation::query()->create([
                'email' => Str::lower($data['email']),
                'role_id' => Role::query()->where('name', $data['role'])->firstOrFail()->id,
                'token_hash' => hash('sha256', $token),
                'invited_by' => $inviterId,
                'status' => 'pending',
                'message' => $data['message'] ?? null,
                'expires_at' => now()->addHours((int) $data['expires_in_hours']),
            ])->load('role');
        });

        Notification::route('mail', $invitation->email)->notify(new StaffInvitationNotification($invitation, $token));

        return $invitation;
    }
}
