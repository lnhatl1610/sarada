type AdminApiSessionConfig = {
  apiBaseUrl: string
  accessToken: string
  onAccessToken: (token: string) => void
  onSessionExpired: () => void
}

export class AdminApiUploadError extends Error {
  readonly reason: 'network' | 'timeout' | 'aborted'

  constructor(reason: 'network' | 'timeout' | 'aborted') {
    super(reason)
    this.name = 'AdminApiUploadError'
    this.reason = reason
  }
}

let session: AdminApiSessionConfig | null = null
let refreshInFlight: Promise<string | null> | null = null
let expiredToken: string | null = null
const nativeFetch = globalThis.fetch.bind(globalThis)
let latestAdminRequestId: string | null = null

export function getLatestAdminRequestId(): string | null {
  return latestAdminRequestId
}

export function configureAdminApiSession(config: AdminApiSessionConfig): void {
  if (config.accessToken && session?.accessToken !== config.accessToken) {
    expiredToken = null
  }
  session = config
}

function requestHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
  if (!headers.has('X-Request-Id')) headers.set('X-Request-Id', crypto.randomUUID())
  return headers
}

function captureRequestId(response: Response): void {
  latestAdminRequestId = response.headers.get('X-Request-Id') ?? latestAdminRequestId
}

function isProtectedAdminUrl(input: RequestInfo | URL): boolean {
  const value = input instanceof Request ? input.url : input.toString()
  const pathname = new URL(value, window.location.href).pathname

  if (pathname.endsWith('/admin/auth/login') || pathname.endsWith('/admin/auth/refresh') || pathname.endsWith('/admin/auth/two-factor/verify')) return false
  return pathname.includes('/admin/') || pathname.includes('/account/') || pathname.includes('/me/')
}

async function refreshAdminAccessToken(): Promise<string | null> {
  if (!session) return null
  if (refreshInFlight) return refreshInFlight

  const refreshUrl = `${session.apiBaseUrl.replace(/\/$/, '')}/admin/auth/refresh`
  refreshInFlight = nativeFetch(refreshUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'X-Request-Id': crypto.randomUUID() },
  }).then(async (response) => {
    captureRequestId(response)
    if (!response.ok) return null
    const body = await response.json() as { data?: { access_token?: string } }
    return body.data?.access_token || null
  }).catch(() => null).finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

function expireAdminSession(token: string): void {
  if (!session || expiredToken === token) return
  expiredToken = token
  session.accessToken = ''
  session.onSessionExpired()
  session.onAccessToken('')
}

async function getAdminRetryToken(tokenUsed: string): Promise<string | null> {
  if (!session) return null

  // Another request may already have refreshed this token while this one was in flight.
  const refreshedToken = session.accessToken !== tokenUsed ? session.accessToken : await refreshAdminAccessToken()
  if (!refreshedToken) {
    expireAdminSession(tokenUsed)
    return null
  }

  if (session.accessToken !== refreshedToken) {
    session.accessToken = refreshedToken
    session.onAccessToken(refreshedToken)
  }

  return refreshedToken
}

function xhrResponse(request: XMLHttpRequest): Response {
  const headers = new Headers()
  for (const line of request.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
    const separator = line.indexOf(':')
    if (separator > 0) headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }

  return new Response(request.responseText || null, {
    status: request.status,
    statusText: request.statusText,
    headers,
  })
}

function sendAdminUpload(input: string | URL, body: XMLHttpRequestBodyInit, init: RequestInit, onProgress?: (percent: number) => void): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const signal = init.signal
    const url = input.toString()
    const headers = requestHeaders(url, init)
    const method = init.method ?? 'POST'
    let settled = false

    const cleanup = () => signal?.removeEventListener('abort', abort)
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const abort = () => request.abort()

    if (signal?.aborted) {
      reject(new AdminApiUploadError('aborted'))
      return
    }

    request.open(method, url)
    request.withCredentials = init.credentials === 'include'
    headers.forEach((value, name) => request.setRequestHeader(name, value))
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      if (settled) return
      settled = true
      cleanup()
      if (request.status === 0) {
        reject(new Error('Không nhận được phản hồi từ máy chủ khi tải tệp lên.'))
        return
      }
      try {
        resolve(xhrResponse(request))
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Không thể đọc phản hồi tải tệp lên.'))
      }
    })
    request.addEventListener('error', () => fail(new AdminApiUploadError('network')))
    request.addEventListener('timeout', () => fail(new AdminApiUploadError('timeout')))
    request.addEventListener('abort', () => fail(new AdminApiUploadError('aborted')))
    signal?.addEventListener('abort', abort, { once: true })
    request.send(body)
  })
}

export async function adminApiUpload(
  input: string | URL,
  body: XMLHttpRequestBodyInit,
  init: RequestInit = {},
  onProgress?: (percent: number) => void,
): Promise<Response> {
  const headers = requestHeaders(input.toString(), init)
  const protectedUrl = isProtectedAdminUrl(input)
  const tokenUsed = protectedUrl ? session?.accessToken || headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '' : ''
  if (session && protectedUrl && session.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  const response = await sendAdminUpload(input, body, { ...init, headers }, onProgress)
  captureRequestId(response)
  if (!protectedUrl || response.status !== 401 || !tokenUsed || expiredToken === tokenUsed) return response

  const refreshedToken = await getAdminRetryToken(tokenUsed)
  if (!refreshedToken) return response

  const retryHeaders = new Headers(headers)
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
  const retryResponse = await sendAdminUpload(input, body, { ...init, headers: retryHeaders }, onProgress)
  captureRequestId(retryResponse)
  if (retryResponse.status === 401) expireAdminSession(refreshedToken)
  return retryResponse
}

export async function adminApiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = requestHeaders(input, init)
  if (!session || !isProtectedAdminUrl(input)) {
    const response = await nativeFetch(input, { ...init, headers })
    captureRequestId(response)
    return response
  }

  const tokenUsed = session.accessToken
  if (tokenUsed) headers.set('Authorization', `Bearer ${tokenUsed}`)

  const response = await nativeFetch(input, { ...init, headers })
  captureRequestId(response)
  if (response.status !== 401 || !tokenUsed || expiredToken === tokenUsed) return response

  const refreshedToken = await getAdminRetryToken(tokenUsed)
  if (!refreshedToken) return response

  const retryHeaders = new Headers(headers)
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
  const retryResponse = await nativeFetch(input, { ...init, headers: retryHeaders })
  captureRequestId(retryResponse)
  if (retryResponse.status === 401) expireAdminSession(refreshedToken)

  return retryResponse
}
