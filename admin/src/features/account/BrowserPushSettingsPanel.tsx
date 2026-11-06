import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type Subscription = { id: number; endpoint: string; device_name: string | null; created_at: string }
type PushData = { public_key: string | null; configured: boolean; subscriptions: Subscription[] }
type PushResponse = { data?: PushData; message?: string }

function decodeVapidKey(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0)).buffer as ArrayBuffer
}

export function BrowserPushSettingsPanel({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const queryKey = ['admin', 'push-subscriptions', accountId]
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/push-subscriptions`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as PushResponse
      if (!response.ok || !body.data) throw new Error(body.message ? t(body.message) : t('Không tải được cài đặt thông báo đẩy.'))
      return body.data
    },
    enabled: supported && Boolean(accessToken),
  })
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!supported) throw new Error(t('Trình duyệt này không hỗ trợ thông báo đẩy.'))
      if (!query.data?.configured || !query.data.public_key) throw new Error(t('Máy chủ chưa cấu hình thông báo đẩy.'))
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') throw new Error(permission === 'denied' ? t('Quyền thông báo đang bị chặn trong cài đặt trình duyệt.') : t('Cần cho phép thông báo để đăng ký thiết bị.'))
      await navigator.serviceWorker.register('/admin-sw.js')
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
        ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(query.data.public_key) })
      const serialized = subscription.toJSON()
      if (!serialized.keys?.p256dh || !serialized.keys.auth) throw new Error(t('Trình duyệt không trả về khóa mã hóa cho thiết bị này.'))
      const response = await adminApiFetch(`${apiUrl}/account/push-subscriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint, keys: serialized.keys, content_encoding: 'aes128gcm', device_name: navigator.userAgent.slice(0, 100) }),
      })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ? t(body.message) : t('Không lưu được thiết bị nhận thông báo.'))
      return subscription
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey }); setNotice(t('Đã bật thông báo trên trình duyệt này.')); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không bật được thông báo.')); setNotice('') },
  })
  const removeMutation = useMutation({
    mutationFn: async (item: Subscription) => {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const localSubscription = await registration?.pushManager.getSubscription()
      if (localSubscription?.endpoint === item.endpoint) await localSubscription.unsubscribe()
      const response = await adminApiFetch(`${apiUrl}/account/push-subscriptions/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ? t(body.message) : t('Không hủy được thiết bị.'))
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey }); setNotice(t('Đã hủy thiết bị nhận thông báo.')); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không hủy được thiết bị.')); setNotice('') },
  })
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/push-subscriptions/test`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ? t(body.message) : t('Không gửi được thông báo thử.'))
      return body.message ? t(body.message) : t('Đã đưa thông báo thử vào hàng đợi.')
    },
    onSuccess: (message) => { setNotice(message); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không gửi được thông báo thử.')); setNotice('') },
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  return <section className="panel account-personal-page">
    <header className="panel-heading"><div><h2>{t('Thông báo đẩy trên trình duyệt')}</h2><p>{t('Nhận thông báo admin trên thiết bị đã đăng ký. Trình duyệt yêu cầu HTTPS hoặc localhost.')}</p></div></header>
    {!supported && <p className="account-settings-help">{t('Trình duyệt này chưa hỗ trợ Service Worker và Push API.')}</p>}
    {supported && query.isPending && <p role="status">{t('Đang tải thiết bị…')}</p>}
    {supported && query.isError && <p className="account-settings-error" role="alert">{query.error.message} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {supported && query.data && !query.data.configured && <p className="account-settings-help">{t('Máy chủ chưa cấu hình VAPID. Quản trị viên cần thiết lập')} VAPID_PUBLIC_KEY {t('và')} VAPID_PRIVATE_KEY.</p>}
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {supported && query.data?.configured && <div className="account-push-controls">
      <button className="primary" type="button" disabled={registerMutation.isPending || query.isPending} onClick={() => registerMutation.mutate()}>{registerMutation.isPending ? t('Đang đăng ký…') : t('Bật trên trình duyệt này')}</button>
      <button className="secondary" type="button" disabled={testMutation.isPending || query.data.subscriptions.length === 0} onClick={() => testMutation.mutate()}>{testMutation.isPending ? t('Đang gửi…') : t('Gửi thử')}</button>
      <h3>{t('Thiết bị đã đăng ký ({{count}})', { count: query.data.subscriptions.length })}</h3>
      {query.data.subscriptions.length === 0 ? <p>{t('Chưa có thiết bị nào nhận thông báo đẩy.')}</p> : <ul className="account-push-device-list">{query.data.subscriptions.map((item) => <li key={item.id}><span><strong>{item.device_name || t('Trình duyệt')}</strong><small>{new Date(item.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN')}</small></span><button className="secondary" type="button" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(item)}>{t('Hủy')}</button></li>)}</ul>}
    </div>}
  </section>
}
