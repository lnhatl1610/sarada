<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AuditAccountWrite
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') || ! $request->user()) {
            return $next($request);
        }

        $userId = (int) $request->user()->id;
        $before = $this->snapshot($request, $userId);
        $response = $next($request);
        if ($response->getStatusCode() >= 400) {
            return $response;
        }

        $after = $this->snapshot($request, $userId);
        $beforeFields = $this->flatten($before);
        $afterFields = $this->flatten($after);
        $changedFields = array_values(array_filter(
            array_unique([...array_keys($beforeFields), ...array_keys($afterFields)]),
            fn (string $field): bool => ($beforeFields[$field] ?? null) !== ($afterFields[$field] ?? null),
        ));
        if ($request->is('api/v1/account/password') || $request->is('api/v1/admin/auth/password')) {
            $changedFields[] = 'password';
        }
        $changed = array_fill_keys($changedFields, true);
        $submitted = $this->redact($request->except([
            'password', 'password_confirmation', 'current_password', 'token', 'secret', 'api_key',
            'code', 'two_factor_code', 'recovery_code', 'challenge_token',
        ]));
        $changes = [
            'before' => $this->redact(array_intersect_key($beforeFields, $changed)),
            'after' => $this->redact(array_intersect_key($afterFields, $changed)),
            'changed_fields' => $changedFields,
            'submitted' => $submitted,
        ];
        $actorId = DB::table('users')->where('id', $userId)->exists() ? $userId : null;

        DB::table('activity_logs')->insert([
            'user_id' => $actorId,
            'module' => 'account',
            'action' => $request->method(),
            'path' => substr($request->path(), 0, 500),
            'changes' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);

        return $response;
    }

    /** @return array<string, mixed> */
    private function snapshot(Request $request, int $userId): array
    {
        $snapshot = [
            'profile' => (array) DB::table('users')->where('id', $userId)->first([
                'name', 'email', 'phone', 'avatar', 'gender', 'birthday', 'status', 'email_verified_at', 'last_login_at',
                'phone_verified_at',
                'two_factor_enabled_at', 'two_factor_secret_pending', 'two_factor_recovery_codes', 'updated_at',
            ]),
        ];

        if ($request->is('api/v1/account/preferences*')) {
            $snapshot['preferences'] = DB::table('user_preferences')->where('user_id', $userId)->orderBy('key')->limit(100)->get(['key', 'value', 'updated_at'])->map(fn (object $row): array => (array) $row)->all();
        }
        if ($request->is('api/v1/account/email')) {
            $snapshot['pending_email_change'] = DB::table('pending_email_changes')->where('user_id', $userId)->get(['email', 'expires_at', 'created_at'])->map(fn (object $row): array => (array) $row)->all();
        }
        if (
            $request->is('api/v1/account/sessions*')
            || $request->is('api/v1/account/password')
            || $request->is('api/v1/admin/auth/password')
        ) {
            $snapshot['refresh_sessions'] = DB::table('refresh_tokens')->where('user_id', $userId)->orderBy('id')->limit(100)->get([
                'id', 'audience', 'device_info', 'ip', 'expires_at', 'revoked_at', 'replaced_by_id', 'created_at', 'updated_at',
            ])->map(fn (object $row): array => (array) $row)->all();
            $snapshot['access_sessions'] = DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)->where('tokenable_id', $userId)
                ->orderBy('id')->limit(100)->get(['id', 'name', 'last_used_at', 'expires_at', 'created_at', 'updated_at'])
                ->map(fn (object $row): array => (array) $row)->all();
        }
        if ($request->is('api/v1/account/tokens*')) {
            $snapshot['api_tokens'] = DB::table('personal_access_tokens')->where('tokenable_type', User::class)
                ->where('tokenable_id', $userId)->where('token_type', 'api')->orderBy('id')->limit(20)
                ->get(['id', 'name', 'abilities', 'last_used_at', 'last_used_ip', 'expires_at', 'created_at'])
                ->map(fn (object $row): array => (array) $row)->all();
        }

        return $snapshot;
    }

    /** @param array<string, mixed> $snapshot
     * @return array<string, mixed>
     */
    private function flatten(array $snapshot): array
    {
        $fields = [];
        foreach ($snapshot as $group => $value) {
            if (is_array($value) && ! array_is_list($value)) {
                foreach ($value as $key => $fieldValue) {
                    $fields[$group.'.'.$key] = $fieldValue;
                }
            } else {
                $fields[$group] = $value;
            }
        }

        return $fields;
    }

    private function redact(array $input): array
    {
        $output = [];
        foreach ($input as $key => $value) {
            if (preg_match('/password|token|secret|recovery|credential|authorization|cookie|api_key/i', (string) $key)) {
                $output[$key] = '[hidden]';
            } elseif ((string) $key === 'phone' && is_string($value)) {
                $output[$key] = substr($value, 0, 3).'••••'.substr($value, -2);
            } elseif (is_array($value)) {
                $output[$key] = $this->redact(array_slice($value, 0, 100, true));
            } elseif (is_scalar($value) || $value === null) {
                $output[$key] = is_string($value) ? mb_substr($value, 0, 500) : $value;
            } else {
                $output[$key] = '[unsupported value]';
            }
        }

        return $output;
    }
}
