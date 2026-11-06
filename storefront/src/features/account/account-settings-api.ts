import axios from 'axios'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'

export type AccountProfile = components['schemas']['ProfileEnvelope']['data']
export type AccountSession = components['schemas']['AccountSession']
export type PersonalDataExport = components['schemas']['PersonalDataExport']

export class AccountValidationError extends Error {
  readonly fields: Record<string, string[]>

  constructor(fields: Record<string, string[]>, cause?: unknown) {
    super(Object.entries(fields).map(([field, messages]) => `${field}: ${messages.join(' ')}`).join(' · '), { cause })
    this.fields = fields
    this.name = 'AccountValidationError'
  }
}

async function request<T>(execute: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await execute()
    return response.data
  } catch (error) {
    if (axios.isAxiosError<{ errors?: Record<string, string[]> }>(error)) {
      const errors = error.response?.data.errors
      if (errors) {
        throw new AccountValidationError(errors, error)
      }
    }
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật tài khoản.'), { cause: error })
  }
}

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })

export async function getAccountProfile(accessToken: string, signal?: AbortSignal): Promise<AccountProfile> {
  return (await request(() => api.get<components['schemas']['ProfileEnvelope']>('/account', { ...auth(accessToken), signal }))).data
}

export async function getAccountSessions(accessToken: string, signal?: AbortSignal): Promise<AccountSession[]> {
  return (await request(() => api.get<components['schemas']['AccountSessionsEnvelope']>('/account/sessions', { ...auth(accessToken), signal }))).data
}

export async function updateAccountProfile(accessToken: string, values: components['schemas']['ProfileUpdate']): Promise<components['schemas']['ProfileEnvelope']> {
  return request(() => api.put<components['schemas']['ProfileEnvelope']>('/account/profile', values, auth(accessToken)))
}

export async function requestAccountEmailChange(accessToken: string, values: components['schemas']['AccountEmailChangeInput']): Promise<components['schemas']['AccountEmailChangeEnvelope']> {
  return request(() => api.put<components['schemas']['AccountEmailChangeEnvelope']>('/account/email', values, auth(accessToken)))
}

export async function updateAccountPassword(accessToken: string, values: components['schemas']['AccountPasswordChangeInput']): Promise<components['schemas']['AccountPasswordChangedEnvelope']> {
  return request(() => api.put<components['schemas']['AccountPasswordChangedEnvelope']>('/account/password', values, auth(accessToken)))
}

export async function deleteAccount(accessToken: string, password: string): Promise<components['schemas']['MessageEnvelope']> {
  return request(() => api.delete<components['schemas']['MessageEnvelope']>('/account', { ...auth(accessToken), data: { password } }))
}

export async function uploadAccountAvatar(accessToken: string, file: File): Promise<components['schemas']['AccountAvatarEnvelope']> {
  const formData = new FormData()
  formData.append('avatar', file)
  return request(() => api.post<components['schemas']['AccountAvatarEnvelope']>('/account/avatar', formData, auth(accessToken)))
}

export async function deleteAccountAvatar(accessToken: string): Promise<components['schemas']['AccountAvatarEnvelope']> {
  return request(() => api.delete<components['schemas']['AccountAvatarEnvelope']>('/account/avatar', auth(accessToken)))
}

export async function resendAccountVerification(accessToken: string): Promise<components['schemas']['MessageEnvelope']> {
  return request(() => api.post<components['schemas']['MessageEnvelope']>('/account/email/verification-notification', undefined, auth(accessToken)))
}

export async function revokeAccountSession(accessToken: string, sessionId: number): Promise<components['schemas']['MessageEnvelope']> {
  return request(() => api.delete<components['schemas']['MessageEnvelope']>(`/account/sessions/${sessionId}`, auth(accessToken)))
}

export async function revokeOtherAccountSessions(accessToken: string): Promise<components['schemas']['MessageEnvelope']> {
  return request(() => api.delete<components['schemas']['MessageEnvelope']>('/account/sessions', auth(accessToken)))
}

export async function getPersonalDataExports(accessToken: string, signal?: AbortSignal): Promise<PersonalDataExport[]> {
  return (await request(() => api.get<{ data: PersonalDataExport[] }>('/account/privacy/exports', { ...auth(accessToken), signal }))).data
}

export async function createPersonalDataExport(accessToken: string): Promise<{ data: PersonalDataExport; message: string }> {
  return request(() => api.post<{ data: PersonalDataExport; message: string }>('/account/privacy/exports', {}, auth(accessToken)))
}

export async function downloadPersonalDataExport(accessToken: string, url: string): Promise<Blob> {
  return request(() => api.get<Blob>(url, { ...auth(accessToken), responseType: 'blob' }))
}

export async function requestAccountPhoneChange(accessToken: string, values: { phone: string; current_password: string }): Promise<{ data: { phone_masked: string; expires_at: string }; message: string }> {
  return request<{ data: { phone_masked: string; expires_at: string }; message: string }>(() => api.post('/account/phone/change', values, auth(accessToken)))
}

export async function confirmAccountPhoneChange(accessToken: string, code: string): Promise<components['schemas']['ProfileEnvelope']> {
  return request(() => api.post<components['schemas']['ProfileEnvelope']>('/account/phone/change/confirm', { code }, auth(accessToken)))
}
