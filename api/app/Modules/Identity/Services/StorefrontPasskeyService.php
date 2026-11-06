<?php

namespace App\Modules\Identity\Services;

use App\Models\Passkey;
use App\Models\PasskeyChallenge;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Serializer\SerializerInterface;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\CredentialRecord;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\Exception\AuthenticatorResponseVerificationException;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;

class StorefrontPasskeyService
{
    private const MAX_PASSKEYS_PER_ACCOUNT = 10;

    public function registrationOptions(User $user): array
    {
        $passkeys = $user->passkeys()->get();
        if ($passkeys->count() >= self::MAX_PASSKEYS_PER_ACCOUNT) {
            throw ValidationException::withMessages(['passkey' => 'Tài khoản đã đạt giới hạn 10 passkey.']);
        }

        $userHandle = DB::transaction(function () use ($user): string {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $userHandle = $lockedUser->webauthn_user_handle;
            if (! $userHandle) {
                $userHandle = bin2hex(random_bytes(32));
                $lockedUser->forceFill(['webauthn_user_handle' => $userHandle])->save();
            }

            return $userHandle;
        });

        $excludeCredentials = $passkeys->map(function (Passkey $passkey): PublicKeyCredentialDescriptor {
            $record = $this->deserializeCredential($passkey);

            return PublicKeyCredentialDescriptor::create('public-key', $record->publicKeyCredentialId, $record->transports);
        })->all();

        $options = PublicKeyCredentialCreationOptions::create(
            $this->rpEntity(),
            PublicKeyCredentialUserEntity::create($user->email, $userHandle, $user->name),
            random_bytes(32),
            [PublicKeyCredentialParameters::createPk(-7), PublicKeyCredentialParameters::createPk(-257)],
            AuthenticatorSelectionCriteria::create(
                userVerification: AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_REQUIRED,
                residentKey: AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED,
            ),
            PublicKeyCredentialCreationOptions::ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
            $excludeCredentials,
            60000,
        );

        return $this->persistChallenge('registration', $user, $options);
    }

    public function register(User $user, string $challengeId, string $name, array $response): Passkey
    {
        $challenge = $this->consumeChallenge($challengeId, 'registration', $user);
        $serializer = $this->serializer();
        $options = $serializer->deserialize(
            json_encode($challenge->options, JSON_THROW_ON_ERROR),
            PublicKeyCredentialCreationOptions::class,
            'json',
        );
        $credential = $this->decodeCredential($response);
        if (! $credential->response instanceof AuthenticatorAttestationResponse) {
            throw ValidationException::withMessages(['credential' => 'Phản hồi đăng ký passkey không hợp lệ.']);
        }

        try {
            $record = AuthenticatorAttestationResponseValidator::create($this->ceremonyFactory()->creationCeremony())
                ->check($credential->response, $options, $this->rpId());
        } catch (AuthenticatorResponseVerificationException $exception) {
            throw ValidationException::withMessages(['credential' => 'Không thể xác minh passkey.']);
        }

        $encodedCredentialId = $this->base64UrlEncode($record->publicKeyCredentialId);

        return DB::transaction(function () use ($user, $name, $record, $encodedCredentialId, $serializer): Passkey {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($lockedUser->passkeys()->count() >= self::MAX_PASSKEYS_PER_ACCOUNT) {
                throw ValidationException::withMessages(['passkey' => 'Tài khoản đã đạt giới hạn 10 passkey.']);
            }

            if (Passkey::query()->where('credential_id_hash', hash('sha256', $encodedCredentialId))->exists()) {
                throw ValidationException::withMessages(['credential' => 'Passkey này đã được đăng ký.']);
            }

            return $lockedUser->passkeys()->create([
                'name' => trim($name),
                'credential_id' => $encodedCredentialId,
                'credential_id_hash' => hash('sha256', $encodedCredentialId),
                'credential' => json_decode($serializer->serialize($record, 'json'), true, flags: JSON_THROW_ON_ERROR),
            ]);
        });
    }

    public function loginOptions(): array
    {
        $options = PublicKeyCredentialRequestOptions::create(
            random_bytes(32),
            $this->rpId(),
            [],
            PublicKeyCredentialRequestOptions::USER_VERIFICATION_REQUIREMENT_REQUIRED,
            60000,
        );

        return $this->persistChallenge('login', null, $options);
    }

    public function authenticate(string $challengeId, array $response): User
    {
        $challenge = $this->consumeChallenge($challengeId, 'login');
        $serializer = $this->serializer();
        $options = $serializer->deserialize(
            json_encode($challenge->options, JSON_THROW_ON_ERROR),
            PublicKeyCredentialRequestOptions::class,
            'json',
        );
        $credential = $this->decodeCredential($response);
        if (! $credential->response instanceof AuthenticatorAssertionResponse) {
            throw ValidationException::withMessages(['credential' => 'Phản hồi đăng nhập passkey không hợp lệ.']);
        }

        $encodedCredentialId = $this->base64UrlEncode($credential->rawId);
        $passkey = Passkey::query()->where('credential_id_hash', hash('sha256', $encodedCredentialId))->first();
        if (! $passkey) {
            throw ValidationException::withMessages(['passkey' => 'Không thể đăng nhập bằng passkey này.']);
        }

        return DB::transaction(function () use ($passkey, $credential, $options, $serializer): User {
            $lockedPasskey = Passkey::query()->whereKey($passkey->id)->lockForUpdate()->firstOrFail();
            $record = $this->deserializeCredential($lockedPasskey);
            try {
                $updatedRecord = AuthenticatorAssertionResponseValidator::create($this->ceremonyFactory()->requestCeremony())
                    ->check($record, $credential->response, $options, $this->rpId(), $credential->response->userHandle);
            } catch (AuthenticatorResponseVerificationException $exception) {
                throw ValidationException::withMessages(['passkey' => 'Không thể đăng nhập bằng passkey này.']);
            }

            $user = $lockedPasskey->user;
            if (! $user || $user->status !== 'active' || ! $user->hasVerifiedEmail()) {
                throw ValidationException::withMessages(['passkey' => 'Không thể đăng nhập bằng passkey này.']);
            }

            $lockedPasskey->forceFill([
                'credential' => json_decode($serializer->serialize($updatedRecord, 'json'), true, flags: JSON_THROW_ON_ERROR),
                'last_used_at' => now(),
            ])->save();

            return $user;
        });
    }

    private function persistChallenge(string $purpose, ?User $user, object $options): array
    {
        $challengeId = (string) Str::uuid();
        $encodedOptions = $this->serializer()->serialize($options, 'json');
        PasskeyChallenge::query()->create([
            'id' => $challengeId,
            'user_id' => $user?->id,
            'purpose' => $purpose,
            'options' => json_decode($encodedOptions, true, flags: JSON_THROW_ON_ERROR),
            'expires_at' => now()->addSeconds((int) config('storefront-webauthn.challenge_ttl_seconds', 300)),
        ]);

        return [
            'challenge_id' => $challengeId,
            'options' => json_decode($encodedOptions, true, flags: JSON_THROW_ON_ERROR),
            'expires_in' => (int) config('storefront-webauthn.challenge_ttl_seconds', 300),
        ];
    }

    private function consumeChallenge(string $challengeId, string $purpose, ?User $user = null): PasskeyChallenge
    {
        return DB::transaction(function () use ($challengeId, $purpose, $user): PasskeyChallenge {
            $challenge = PasskeyChallenge::query()->whereKey($challengeId)->lockForUpdate()->first();
            if (! $challenge || $challenge->purpose !== $purpose || $challenge->consumed_at || $challenge->expires_at->isPast()
                || (int) $challenge->user_id !== (int) $user?->id) {
                throw ValidationException::withMessages(['challenge_id' => 'Yêu cầu passkey đã hết hạn hoặc không hợp lệ.']);
            }

            $challenge->forceFill(['consumed_at' => now()])->save();

            return $challenge;
        });
    }

    private function decodeCredential(array $response): PublicKeyCredential
    {
        try {
            $credential = $this->serializer()->deserialize(json_encode($response, JSON_THROW_ON_ERROR), PublicKeyCredential::class, 'json');
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages(['credential' => 'Phản hồi passkey không hợp lệ.']);
        }

        if (! $credential instanceof PublicKeyCredential || $credential->type !== 'public-key') {
            throw ValidationException::withMessages(['credential' => 'Phản hồi passkey không hợp lệ.']);
        }

        return $credential;
    }

    private function deserializeCredential(Passkey $passkey): CredentialRecord
    {
        $record = $this->serializer()->deserialize(json_encode($passkey->credential, JSON_THROW_ON_ERROR), CredentialRecord::class, 'json');
        if (! $record instanceof CredentialRecord) {
            throw ValidationException::withMessages(['passkey' => 'Không thể đọc passkey đã lưu.']);
        }

        return $record;
    }

    private function serializer(): SerializerInterface
    {
        $support = AttestationStatementSupportManager::create([NoneAttestationStatementSupport::create()]);

        return (new WebauthnSerializerFactory($support))->create();
    }

    private function ceremonyFactory(): CeremonyStepManagerFactory
    {
        $origins = config('storefront-webauthn.allowed_origins', []);
        if (! is_array($origins) || $origins === []) {
            throw new \RuntimeException('Storefront WebAuthn allowed origins are not configured.');
        }

        $factory = new CeremonyStepManagerFactory;
        $factory->setAllowedOrigins($origins);

        return $factory;
    }

    private function rpEntity(): PublicKeyCredentialRpEntity
    {
        return PublicKeyCredentialRpEntity::create(config('app.name', 'Sarada'), $this->rpId());
    }

    private function rpId(): string
    {
        $rpId = trim((string) config('storefront-webauthn.rp_id'));
        if ($rpId === '' || str_contains($rpId, '://') || str_contains($rpId, '/')) {
            throw new \RuntimeException('Storefront WebAuthn RP ID is invalid.');
        }

        return $rpId;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
