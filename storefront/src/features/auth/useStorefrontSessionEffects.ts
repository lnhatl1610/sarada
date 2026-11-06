import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { api, setAccessToken as setApiAccessToken } from '../../lib/http'
import type { components } from '../../types/api'

type Options = {
  accessToken: string
  setAccessToken: Dispatch<SetStateAction<string>>
  setCustomer: Dispatch<SetStateAction<components['schemas']['StorefrontUser'] | null>>
  resetCartMergeAttempt: () => void
}

/** Synchronizes the in-memory API credential, restores a refresh-cookie session, and validates it. */
export function useStorefrontSessionEffects({ accessToken, setAccessToken, setCustomer, resetCartMergeAttempt }: Options) {
  const refreshStarted = useRef(false)
  const [sessionRestored, setSessionRestored] = useState(false)

  useEffect(() => { setApiAccessToken(accessToken || null) }, [accessToken])

  useEffect(() => {
    if (refreshStarted.current) return
    refreshStarted.current = true
    void api.post<components['schemas']['StorefrontRefreshEnvelope']>('/auth/refresh').then(({ data }) => {
      setAccessToken(data.data.access_token)
    }).catch(() => undefined).finally(() => setSessionRestored(true))
  }, [setAccessToken])

  useEffect(() => {
    if (!accessToken) return
    const controller = new AbortController()
    void api.get<components['schemas']['StorefrontIdentityEnvelope']>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    }).then(({ data }) => {
      setCustomer(data.data.user)
    }).catch(() => {
      if (controller.signal.aborted) return
      resetCartMergeAttempt()
      setAccessToken('')
      setCustomer(null)
    })
    return () => controller.abort()
  }, [accessToken, resetCartMergeAttempt, setAccessToken, setCustomer])

  return { sessionRestored }
}
