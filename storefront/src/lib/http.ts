import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { components } from '../types/api'
import { isPublicOfflineRead, readPublicResponseOffline, storePublicResponse } from '../features/offline/public-api-cache'
import { STOREFRONT_API_BASE_URL } from './api-base'

const baseURL = STOREFRONT_API_BASE_URL
let accessToken: string | null = null
let refreshInFlight: Promise<{ token: string | null; rejected: boolean }> | null = null
let sessionExpiryRedirectStarted = false

type RetriableRequest = InternalAxiosRequestConfig & { _fashionRetry?: boolean }

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  config.headers.set('X-Request-Id', crypto.randomUUID())
  if (accessToken && !isPublicOfflineRead(config)) config.headers.set('Authorization', `Bearer ${accessToken}`)
  return config
})

api.interceptors.response.use((response) => {
  void storePublicResponse(response)
  return response
}, async (error: AxiosError) => {
  const offlineResponse = await readPublicResponseOffline(error)
  if (offlineResponse) return offlineResponse

  const request = error.config as RetriableRequest | undefined
  const url = request?.url ?? ''
  const wasAuthenticated = Boolean(request?.headers.get('Authorization') || accessToken)
  if (error.response?.status !== 401 || !request || !wasAuthenticated || request._fashionRetry || /\/auth\/(refresh|login|register|forgot-password|reset-password)/.test(url)) {
    return Promise.reject(error)
  }

  request._fashionRetry = true
  refreshInFlight ??= refreshClient.post<components['schemas']['StorefrontRefreshEnvelope']>('/auth/refresh')
    .then(({ data }) => {
      accessToken = data.data.access_token
      return { token: accessToken, rejected: false }
    })
    .catch((refreshError: AxiosError) => {
      accessToken = null
      return { token: null, rejected: refreshError.response?.status === 401 || refreshError.response?.status === 419 }
    })
    .finally(() => { refreshInFlight = null })

  const refreshResult = await refreshInFlight
  if (!refreshResult.token) {
    if (refreshResult.rejected && !sessionExpiryRedirectStarted) {
      sessionExpiryRedirectStarted = true
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const isAuthEntry = /^\/(login|register|forgot-password|reset-password|verify-email|pending-approval)(\/|$)/.test(window.location.pathname)
      const params = new URLSearchParams({ session: 'expired' })
      if (!isAuthEntry) params.set('returnTo', currentPath)
      window.location.assign(`/login?${params.toString()}`)
    }
    return Promise.reject(error)
  }
  request.headers.set('Authorization', `Bearer ${refreshResult.token}`)
  return api(request)
})

export const getApiErrorMessage = (error: unknown, fallback = 'Không thể kết nối máy chủ. Vui lòng thử lại.') => {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const validationMessage = Object.values(error.response?.data?.errors ?? {})
      .flat()
      .map((message) => message.trim())
      .find(Boolean)
    const responseMessage = error.response?.data?.message?.trim()
    return validationMessage ?? (responseMessage || fallback)
  }
  return error instanceof Error ? error.message.trim() || fallback : fallback
}

