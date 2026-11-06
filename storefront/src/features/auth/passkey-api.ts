import { api } from '../../lib/http'
import type { components } from '../../types/api'
import type { PasskeyCredentialPayload } from './passkey-credentials'

export type PasskeySummary = components['schemas']['PasskeySummary']
type ChallengeEnvelope = components['schemas']['PasskeyChallengeEnvelope']
type PasskeyListEnvelope = components['schemas']['PasskeyListEnvelope']
type PasskeyEnvelope = components['schemas']['PasskeyEnvelope']
type LoginEnvelope = components['schemas']['StorefrontLoginEnvelope']

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })

export async function listPasskeys(accessToken: string, signal?: AbortSignal): Promise<PasskeySummary[]> {
  const { data } = await api.get<PasskeyListEnvelope>('/account/passkeys', { ...auth(accessToken), signal })
  return data.data
}

export async function getPasskeyRegistrationOptions(accessToken: string): Promise<ChallengeEnvelope['data']> {
  const { data } = await api.post<ChallengeEnvelope>('/account/passkeys/options', {}, auth(accessToken))
  return data.data
}

export async function registerPasskey(accessToken: string, values: { challenge_id: string; name: string; credential: PasskeyCredentialPayload }): Promise<PasskeySummary> {
  const { data } = await api.post<PasskeyEnvelope>('/account/passkeys', values, auth(accessToken))
  return data.data
}

export async function removePasskey(accessToken: string, passkeyId: number): Promise<void> {
  await api.delete(`/account/passkeys/${passkeyId}`, auth(accessToken))
}

export async function getPasskeyLoginOptions(): Promise<ChallengeEnvelope['data']> {
  const { data } = await api.post<ChallengeEnvelope>('/auth/passkeys/options', {})
  return data.data
}

export async function loginWithPasskey(values: { challenge_id: string; credential: PasskeyCredentialPayload }): Promise<NonNullable<LoginEnvelope['data']>> {
  const { data } = await api.post<LoginEnvelope>('/auth/passkeys/login', values)
  return data.data
}
