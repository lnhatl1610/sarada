import type { components } from '../../types/api'

export type PasskeyCredentialPayload = components['schemas']['PasskeyCredentialResponse']

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return bytes.buffer
}

function encodeBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

type JsonObject = Record<string, unknown>

export function decodeCreationOptions(value: unknown): PublicKeyCredentialCreationOptions {
  const options = value as JsonObject
  const user = options.user as JsonObject
  const excludeCredentials = Array.isArray(options.excludeCredentials) ? options.excludeCredentials as JsonObject[] : []
  return {
    ...options,
    challenge: decodeBase64Url(String(options.challenge ?? '')),
    user: { ...user, id: decodeBase64Url(String(user.id ?? '')) },
    excludeCredentials: excludeCredentials.map((credential) => ({
      ...credential,
      id: decodeBase64Url(String(credential.id ?? '')),
    })),
  } as PublicKeyCredentialCreationOptions
}

export function decodeRequestOptions(value: unknown): PublicKeyCredentialRequestOptions {
  const options = value as JsonObject
  const allowCredentials = Array.isArray(options.allowCredentials) ? options.allowCredentials as JsonObject[] : []
  return {
    ...options,
    challenge: decodeBase64Url(String(options.challenge ?? '')),
    allowCredentials: allowCredentials.map((credential) => ({
      ...credential,
      id: decodeBase64Url(String(credential.id ?? '')),
    })),
  } as PublicKeyCredentialRequestOptions
}

export function serializePasskeyCredential(credential: PublicKeyCredential): PasskeyCredentialPayload {
  const response = credential.response
  const common = {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: 'public-key' as const,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: credential.getClientExtensionResults(),
  }

  if (response instanceof AuthenticatorAttestationResponse) {
    return {
      ...common,
      response: {
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        attestationObject: encodeBase64Url(response.attestationObject),
        transports: response.getTransports?.() ?? [],
      },
    }
  }

  if (response instanceof AuthenticatorAssertionResponse) {
    return {
      ...common,
      response: {
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        authenticatorData: encodeBase64Url(response.authenticatorData),
        signature: encodeBase64Url(response.signature),
        userHandle: response.userHandle ? encodeBase64Url(response.userHandle) : null,
      },
    }
  }

  throw new Error('Trình duyệt trả về phản hồi passkey không được hỗ trợ.')
}

export function supportsPasskeys(): boolean {
  return typeof window !== 'undefined'
    && typeof PublicKeyCredential !== 'undefined'
    && typeof navigator.credentials?.create === 'function'
    && typeof navigator.credentials?.get === 'function'
}

export function passkeyCancellationMessage(error: unknown): string | null {
  return error instanceof DOMException && error.name === 'NotAllowedError'
    ? 'Bạn đã hủy xác thực hoặc thiết bị chưa hoàn tất yêu cầu passkey.'
    : null
}
