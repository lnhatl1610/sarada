import { useEffect, useRef, useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

const ACTIVITY_EVENT = 'fashion-admin-user-activity'
const DEFAULT_TIMEOUT_MINUTES = 30

export function AdminIdleSessionGuard({ apiUrl, accessToken, locked, onLock, onLogout }: { apiUrl: string; accessToken: string; locked: boolean; onLock: () => void; onLogout: () => void | Promise<void> }) {
  const { t } = useTranslation()
  const [timeoutMinutes, setTimeoutMinutes] = useState<number | null>(null)
  const [autoLockMinutes, setAutoLockMinutes] = useState(0)
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const lastActivity = useRef(0)
  const lastActivitySignal = useRef(0)
  const lastPresenceSync = useRef(0)
  const activityChannel = useRef<BroadcastChannel | null>(null)
  const onLogoutRef = useRef(onLogout)
  const onLockRef = useRef(onLock)
  useEffect(() => {
    onLogoutRef.current = onLogout
    onLockRef.current = onLock
  }, [onLock, onLogout])

  useEffect(() => {
    let cancelled = false
    void adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { data?: { admin_session_security?: { idle_timeout_minutes?: number; auto_lock_minutes?: number } } }
        if (!response.ok) throw new Error('Could not load session preference')
        if (!cancelled) setTimeoutMinutes(body.data?.admin_session_security?.idle_timeout_minutes ?? DEFAULT_TIMEOUT_MINUTES)
        if (!cancelled) setAutoLockMinutes(body.data?.admin_session_security?.auto_lock_minutes ?? 0)
      })
      .catch(() => { if (!cancelled) setTimeoutMinutes(DEFAULT_TIMEOUT_MINUTES) })
    return () => { cancelled = true }
  }, [apiUrl, accessToken])

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ idleTimeout?: number; autoLock?: number }>).detail
      if (typeof detail?.idleTimeout === 'number' && [0, 15, 30, 60, 120].includes(detail.idleTimeout)
        && typeof detail.autoLock === 'number' && [0, 5, 10, 15, 30, 60].includes(detail.autoLock)) {
        setTimeoutMinutes(detail.idleTimeout)
        setAutoLockMinutes(detail.autoLock)
        setWarning(false)
      }
    }
    window.addEventListener('fashion-admin-session-security-change', update)
    return () => window.removeEventListener('fashion-admin-session-security-change', update)
  }, [])

  useEffect(() => {
    if (!accessToken || locked) return
    lastActivity.current = Date.now()
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fashion-admin-session-activity') : null
    activityChannel.current = channel
    const syncPresence = () => {
      const now = Date.now()
      if (now - lastPresenceSync.current < 60_000) return
      lastPresenceSync.current = now
      void adminApiFetch(`${apiUrl}/account/presence/activity`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      }).catch(() => undefined)
    }
    const reset = (broadcast: boolean) => {
      lastActivity.current = Date.now()
      setWarning(false)
      setSecondsLeft(60)
      if (broadcast) channel?.postMessage({ type: 'activity', at: lastActivity.current })
    }
    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivitySignal.current < 1000) return
      lastActivitySignal.current = now
      reset(true)
      syncPresence()
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'activity' && typeof event.data.at === 'number') {
        lastActivity.current = Math.max(lastActivity.current, event.data.at)
        setWarning(false)
      }
      if (event.data?.type === 'lock') onLockRef.current()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'fashion-admin-last-activity' && event.newValue) {
        const at = Number(event.newValue)
        if (Number.isFinite(at)) {
          lastActivity.current = Math.max(lastActivity.current, at)
          setWarning(false)
        }
      }
    }
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - lastActivity.current
      if (autoLockMinutes > 0 && elapsed >= autoLockMinutes * 60_000) {
        window.clearInterval(timer)
        channel?.postMessage({ type: 'lock' })
        onLockRef.current()
        return
      }
      if (timeoutMinutes === null || timeoutMinutes === 0) return
      const timeoutMs = timeoutMinutes * 60_000
      const remaining = Math.ceil((timeoutMs - elapsed) / 1000)
      if (remaining <= 0) {
        window.clearInterval(timer)
        void onLogoutRef.current()
      } else if (remaining <= 60) {
        setWarning(true)
        setSecondsLeft(remaining)
      }
    }, 500)
    channel?.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('pointermove', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    window.addEventListener('touchstart', onActivity, { passive: true })
    window.addEventListener('scroll', onActivity, { passive: true })
    window.addEventListener(ACTIVITY_EVENT, onActivity)
    return () => {
      window.clearInterval(timer)
      channel?.removeEventListener('message', onMessage)
      channel?.close()
      activityChannel.current = null
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('pointermove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('scroll', onActivity)
      window.removeEventListener(ACTIVITY_EVENT, onActivity)
    }
  }, [timeoutMinutes, autoLockMinutes, accessToken, locked, apiUrl])

  if (!warning || timeoutMinutes === null || timeoutMinutes === 0 || locked) return null
  return <div className="admin-idle-warning-backdrop"><section className="admin-idle-warning" role="alertdialog" aria-modal="true" aria-labelledby="admin-idle-warning-title" aria-describedby="admin-idle-warning-description"><h2 id="admin-idle-warning-title">{t('Sắp đăng xuất do không hoạt động')}</h2><p id="admin-idle-warning-description">{t('Phiên sẽ đăng xuất sau {{count}} giây. Chọn “Ở lại” để tiếp tục làm việc.', { count: secondsLeft })}</p><button type="button" className="primary" autoFocus onClick={() => {
    lastActivity.current = Date.now()
    void adminApiFetch(`${apiUrl}/account/presence/activity`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    }).catch(() => undefined)
    setWarning(false)
    setSecondsLeft(60)
    activityChannel.current?.postMessage({ type: 'activity', at: lastActivity.current })
    try { localStorage.setItem('fashion-admin-last-activity', String(lastActivity.current)) } catch { /* storage may be disabled */ }
  }}>{t('Ở lại')}</button></section></div>
}
