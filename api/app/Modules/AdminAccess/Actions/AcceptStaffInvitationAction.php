<?php

namespace App\Modules\AdminAccess\Actions;

use App\Models\StaffInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcceptStaffInvitationAction
{
    public function handle(string $token, array $data, ?string $ip = null): User
    {
        return DB::transaction(function () use ($token, $data, $ip): User {
            $invitation = StaffInvitation::query()->where('token_hash', hash('sha256', $token))->lockForUpdate()->first();
            if (! $invitation || $invitation->status !== 'pending' || $invitation->revoked_at || $invitation->expires_at->isPast()) {
                throw ValidationException::withMessages(['token' => 'Lời mời không hợp lệ, đã được sử dụng hoặc đã hết hạn. Hãy liên hệ chủ cửa hàng để nhận lời mời mới.']);
            }
            if (User::withTrashed()->where('email', $invitation->email)->exists()) {
                throw ValidationException::withMessages(['email' => 'Email này đã có tài khoản. Hãy liên hệ chủ cửa hàng để được hỗ trợ.']);
            }

            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $invitation->email,
                'password' => $data['password'],
                'status' => 'active',
                'email_verified_at' => now(),
                'created_by' => $invitation->invited_by,
            ]);
            $user->forceFill(['must_change_password' => true])->save();
            $user->roles()->attach($invitation->role_id);
            $invitation->forceFill(['status' => 'accepted', 'accepted_at' => now()])->save();

            DB::table('activity_logs')->insert([
                'user_id' => $user->id,
                'module' => 'staff',
                'action' => 'POST',
                'path' => 'api/v1/staff-invitations/accept',
                'changes' => json_encode([
                    'before' => ['invitation' => ['status' => 'pending'], 'account' => [], 'role_assignment' => []],
                    'after' => [
                        'invitation' => ['status' => 'accepted'],
                        'account' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'status' => $user->status],
                        'role_assignment' => [['user_id' => $user->id, 'role_id' => $invitation->role_id]],
                    ],
                    'changed_fields' => ['invitation.status', 'account.created', 'role_assignment'],
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'ip' => $ip,
                'created_at' => now(),
            ]);

            return $user->load('roles');
        });
    }
}
