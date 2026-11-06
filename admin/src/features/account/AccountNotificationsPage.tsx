import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { createApiResponseError } from '../../components/shared/api-validation'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { SudoModeDialog } from './SudoModeDialog'
import { BrowserPushSettingsPanel } from './BrowserPushSettingsPanel'
import { useTranslation } from 'react-i18next'

type Delivery = { in_app: boolean; email: boolean; push?: boolean }
type Preferences = Record<string, Delivery>
type PreferencesResponse = { data?: { admin_notifications?: Preferences }; message?: string; errors?: Record<string, string[]> }

const notificationTypes = [
  ['new_order', 'Đơn hàng mới'],
  ['delivery_failed', 'Đơn giao thất bại'],
  ['low_stock', 'Sản phẩm sắp hết hàng'],
  ['review_pending', 'Đánh giá chờ duyệt'],
  ['staff_pending', 'Tài khoản nhân viên chờ duyệt'],
  ['weekly_report', 'Báo cáo tuần'],
  ['admin_digest', 'Bản tin tóm tắt'],
  ['task_reminder', 'Nhắc việc cá nhân'],
  ['export_complete', 'Tệp xuất dữ liệu đã sẵn sàng'],
] as const

const defaults: Preferences = Object.fromEntries(notificationTypes.map(([key]) => [key, { in_app: true, email: false, push: false }]))

async function readPreferences(apiUrl: string, accessToken: string, t: (key: string) => string): Promise<Preferences> {
  const response = await adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
  const body = await response.json().catch(() => ({})) as PreferencesResponse
  if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được tùy chọn thông báo.'))
  const saved = body.data?.admin_notifications ?? {}
  return Object.fromEntries(notificationTypes.map(([key]) => [key, { ...defaults[key], ...saved[key] }])) as Preferences
}

export function AccountNotificationsPage({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const queryKey = ['account-preferences', accountId, 'admin_notifications']
  const query = useQuery({ queryKey, queryFn: () => readPreferences(apiUrl, accessToken, t) })
  const pushDevicesQuery = useQuery({ queryKey: ['admin', 'push-subscriptions', accountId], queryFn: async () => { const response = await adminApiFetch(`${apiUrl}/account/push-subscriptions`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); if (!response.ok) return 0; const body = await response.json() as { data?: { subscriptions?: unknown[] } }; return body.data?.subscriptions?.length ?? 0 } })
  const hasPushDevice = (pushDevicesQuery.data ?? 0) > 0
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Preferences | null>(null)
  const savedPreferences = query.data ?? defaults
  const preferences = draft ?? savedPreferences
  const isDirty = JSON.stringify(preferences) !== JSON.stringify(savedPreferences)
  useUnsavedFormGuard(isDirty)
  const mutation = useMutation({
    mutationFn: async (value: Preferences) => {
      const response = await adminApiFetch(`${apiUrl}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_notifications', value }) })
      const body = await response.json().catch(() => ({})) as PreferencesResponse
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không lưu được tùy chọn thông báo.'))
      return value
    },
    onSuccess: (value) => { client.setQueryData(queryKey, value); setDraft(null); setNotice(t('Đã lưu tùy chọn thông báo.')); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không lưu được tùy chọn thông báo.')); setNotice('') },
  })
  return <section className="account-personal-page">
    <section className="panel account-personal-page">
    <header className="panel-heading"><div><h2>{t('Tùy chọn thông báo')}</h2><p>{t('Chọn loại thông báo và nơi nhận. Xem và quản lý lịch sử tại')} <a href="/notifications">{t('trung tâm thông báo')}</a>.</p></div></header>
    {query.isPending && <p role="status">{t('Đang tải tùy chọn…')}</p>}
    {query.isError && <p className="account-settings-error" role="alert">{query.error instanceof Error ? query.error.message : t('Không tải được tùy chọn thông báo.')} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {!query.isPending && !query.isError && <form className="account-notifications-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(preferences) }}>
      <div className="account-notification-row account-notification-header"><strong>{t('Loại thông báo')}</strong><strong>{t('Trong ứng dụng')}</strong><strong>{t('Email')}</strong><strong>{t('Trình duyệt')}</strong></div>
      {notificationTypes.map(([key, label]) => <div className="account-notification-row" key={key}><strong>{t(label)}</strong><label><input type="checkbox" aria-label={t('{{label}}: trong ứng dụng', { label: t(label) })} checked={preferences[key]?.in_app ?? true} onChange={(event) => setDraft({ ...preferences, [key]: { ...preferences[key], in_app: event.target.checked } })} /></label><label><input type="checkbox" aria-label={t('{{label}}: email', { label: t(label) })} checked={preferences[key]?.email ?? false} onChange={(event) => setDraft({ ...preferences, [key]: { ...preferences[key], email: event.target.checked } })} /></label><label><input type="checkbox" aria-label={t('{{label}}: trình duyệt', { label: t(label) })} checked={preferences[key]?.push ?? false} disabled={!hasPushDevice || pushDevicesQuery.isPending} onChange={(event) => setDraft({ ...preferences, [key]: { ...preferences[key], push: event.target.checked } })} /></label></div>)}
      {!hasPushDevice && <p className="account-settings-help">{t('Đăng ký ít nhất một thiết bị bên dưới để bật kênh trình duyệt.')}</p>}
      <button className="primary" type="submit" disabled={mutation.isPending || !isDirty}>{mutation.isPending ? t('Đang lưu…') : t('Lưu thay đổi')}</button>
    </form>}
    </section>
    <SecurityAlertPreferencesPanel apiUrl={apiUrl} accessToken={accessToken} accountId={accountId} />
    <BrowserPushSettingsPanel apiUrl={apiUrl} accessToken={accessToken} accountId={accountId} />
    <DoNotDisturbPanel apiUrl={apiUrl} accessToken={accessToken} accountId={accountId} />
    <DigestPreferencesPanel apiUrl={apiUrl} accessToken={accessToken} accountId={accountId} />
  </section>
}

type SecurityAlerts = { new_device: boolean; credentials_changed: boolean; failed_logins: boolean }
const securityAlertDefaults: SecurityAlerts = { new_device: true, credentials_changed: true, failed_logins: true }

function SecurityAlertPreferencesPanel({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const queryKey = ['account-preferences', accountId, 'security_alerts']
  const query = useQuery({ queryKey, queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json().catch(() => ({})) as { data?: { security_alerts?: Partial<SecurityAlerts> }; message?: string }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được cảnh báo bảo mật.'))
    return { ...securityAlertDefaults, ...body.data?.security_alerts, credentials_changed: true }
  } })
  const sudoStatus = useQuery({
    queryKey: ['account-sudo-mode'],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/sudo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { data?: { active: boolean; expires_at: string | null; requires_two_factor: boolean } }
      return body.data
    },
  })
  const [draft, setDraft] = useState<SecurityAlerts | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [sudoOpen, setSudoOpen] = useState(false)
  const [sudoExpiresAt, setSudoExpiresAt] = useState<string | null>(null)
  const pendingSave = useRef<SecurityAlerts | null>(null)
  const saved = query.data ?? securityAlertDefaults
  const value = draft ?? saved
  const mutation = useMutation({
    mutationFn: async (next: SecurityAlerts) => {
      const response = await adminApiFetch(`${apiUrl}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'security_alerts', value: next }) })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không lưu được cảnh báo bảo mật.'))
      return next
    },
    onSuccess: (next) => { client.setQueryData(queryKey, next); setDraft(null); setNotice(t('Đã lưu cảnh báo bảo mật.')); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không lưu được cảnh báo bảo mật.')); setNotice('') },
  })
  const labels: Array<[keyof SecurityAlerts, string]> = [['new_device', 'Đăng nhập từ thiết bị hoặc IP mới'], ['credentials_changed', 'Đổi email, mật khẩu hoặc xác thực hai bước'], ['failed_logins', 'Có ít nhất 5 lần đăng nhập sai']]
  const submitSecurityPreferences = (next: SecurityAlerts) => {
    const disablesAlert = (['new_device', 'failed_logins'] as const).some((key) => saved[key] && !next[key])
    const expiresAt = sudoExpiresAt ?? sudoStatus.data?.expires_at
    if (disablesAlert && (!sudoStatus.data?.active || !expiresAt || new Date(expiresAt).getTime() <= Date.now())) {
      pendingSave.current = next
      setSudoOpen(true)
      return
    }
    mutation.mutate(next)
  }
  return <section className="panel account-personal-page">
    <header className="panel-heading"><div><h2>{t('Cảnh báo bảo mật')}</h2><p>{t('Gửi thông báo trong ứng dụng và email khi có hoạt động bảo mật.')}</p></div></header>
    {query.isPending && <p role="status">{t('Đang tải…')}</p>}
    {query.isError && <p className="account-settings-error" role="alert">{query.error instanceof Error ? query.error.message : t('Không tải được cảnh báo bảo mật.')} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {!query.isPending && !query.isError && <form className="account-notifications-form" onSubmit={(event) => { event.preventDefault(); submitSecurityPreferences(value) }}>
      {labels.map(([key, label]) => <label className="account-notification-row account-security-alert-row" key={key}><strong>{t(label)}</strong><input type="checkbox" aria-label={t(label)} checked={value[key]} disabled={key === 'credentials_changed'} onChange={(event) => setDraft({ ...value, [key]: event.target.checked })} /></label>)}
      <button className="primary" type="submit" disabled={mutation.isPending || JSON.stringify(value) === JSON.stringify(saved)}>{mutation.isPending ? t('Đang lưu…') : t('Lưu cảnh báo bảo mật')}</button>
    </form>}
    <SudoModeDialog apiUrl={apiUrl} accessToken={accessToken} open={sudoOpen} requiresTwoFactor={sudoStatus.data?.requires_two_factor ?? false} onOpenChange={setSudoOpen} onAuthenticated={(expiresAt) => { setSudoExpiresAt(expiresAt); client.setQueryData(['account-sudo-mode'], { active: true, expires_at: expiresAt, requires_two_factor: sudoStatus.data?.requires_two_factor ?? false }); const pending = pendingSave.current; pendingSave.current = null; if (pending) mutation.mutate(pending) }} />
  </section>
}

type QuietWindow = { days: number[]; start: string; end: string }
type DndSettings = { until: string | null; schedule: QuietWindow[]; allow_urgent: boolean }
const dndDefaults: DndSettings = { until: null, schedule: [], allow_urgent: true }
const weekdays: Array<[number, string]> = [[1, 'Thứ Hai'], [2, 'Thứ Ba'], [3, 'Thứ Tư'], [4, 'Thứ Năm'], [5, 'Thứ Sáu'], [6, 'Thứ Bảy'], [7, 'Chủ nhật']]

function DoNotDisturbPanel({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const queryKey = ['account-preferences', accountId, 'admin_dnd']
  const query = useQuery({ queryKey, queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json().catch(() => ({})) as { data?: { admin_dnd?: Partial<DndSettings> }; message?: string }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được chế độ Không làm phiền.'))
    return { ...dndDefaults, ...body.data?.admin_dnd }
  } })
  const [draft, setDraft] = useState<DndSettings | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0)
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => { window.clearTimeout(initialTimer); window.clearInterval(interval) }
  }, [])
  const saved = query.data ?? dndDefaults
  const value = draft ?? saved
  const schedule = value.schedule[0] ?? { days: [], start: '22:00', end: '07:00' }
  const activeUntil = value.until ? new Date(value.until) : null
  const isActive = Boolean(currentTime && activeUntil && activeUntil.getTime() > currentTime)
  useUnsavedFormGuard(JSON.stringify(value) !== JSON.stringify(saved))
  const mutation = useMutation({
    mutationFn: async (next: DndSettings) => {
      const response = await adminApiFetch(`${apiUrl}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_dnd', value: next }) })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không lưu được chế độ Không làm phiền.'))
      return next
    },
    onSuccess: (next) => { client.setQueryData(queryKey, next); setDraft(null); setNotice(t('Đã lưu chế độ Không làm phiền.')); setError(''); void client.invalidateQueries({ queryKey: ['admin-account-menu-summary', accountId] }) },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không lưu được chế độ Không làm phiền.')); setNotice('') },
  })
  const stageUntil = (until: string | null) => setDraft({ ...value, until })
  const stagePreset = (hours: number) => stageUntil(new Date(Date.now() + hours * 60 * 60 * 1000).toISOString())
  const stageTomorrow = () => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0); stageUntil(tomorrow.toISOString()) }
  const stageIndefinitely = () => stageUntil('9999-12-31T23:59:59.000Z')
  const updateSchedule = (next: QuietWindow | null) => setDraft({ ...value, schedule: next && next.days.length ? [next] : [] })
  const toggleDay = (day: number) => updateSchedule({ ...schedule, days: schedule.days.includes(day) ? schedule.days.filter((item) => item !== day) : [...schedule.days, day].sort((a, b) => a - b) })
  const customLocal = (date: Date | null) => {
    if (!date || Number.isNaN(date.getTime())) return ''
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    return local.toISOString().slice(0, 16)
  }
  return <section className="panel account-personal-page">
    <header className="panel-heading"><div><h2>{t('Không làm phiền')}</h2><p>{t('Email bị tạm dừng trong thời gian yên lặng; thông báo vẫn được lưu trong trung tâm. Lịch dùng múi giờ trong hồ sơ tài khoản.')}</p></div></header>
    {query.isPending && <p role="status">{t('Đang tải…')}</p>}
    {query.isError && <p className="account-settings-error" role="alert">{query.error instanceof Error ? query.error.message : t('Không tải được chế độ Không làm phiền.')} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {!query.isPending && !query.isError && <form className="account-notifications-form account-dnd-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(value) }}>
      <div className="account-dnd-presets"><strong>{isActive ? t('Đang bật đến {{date}}', { date: activeUntil?.toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') }) : value.schedule.length ? t('Đã đặt lịch giờ yên lặng') : t('Đang tắt')}</strong><div><button type="button" className="secondary" onClick={() => stagePreset(1)}>{t('Im lặng 1 giờ')}</button><button type="button" className="secondary" onClick={() => stagePreset(4)}>{t('Im lặng 4 giờ')}</button><button type="button" className="secondary" onClick={stageTomorrow}>{t('Đến 9:00 sáng mai')}</button><button type="button" className="secondary" onClick={stageIndefinitely}>{t('Đến khi bật lại')}</button><button type="button" className="secondary" onClick={() => stageUntil(null)}>{t('Tắt tạm dừng')}</button></div></div>
      <label className="account-dnd-custom">{t('Tùy chỉnh đến lúc')}<input type="datetime-local" value={customLocal(activeUntil)} onChange={(event) => stageUntil(event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
      <fieldset id="dnd" className="account-dnd-schedule"><legend>{t('Lịch giờ yên lặng hàng tuần')}</legend>
        {weekdays.map(([day, label]) => <label key={day}><input type="checkbox" checked={schedule.days.includes(day)} onChange={() => toggleDay(day)} />{t(label)}</label>)}
        <label>{t('Bắt đầu')}<input type="time" value={schedule.start} onChange={(event) => updateSchedule({ ...schedule, start: event.target.value })} /></label>
        <label>{t('Kết thúc')}<input type="time" value={schedule.end} onChange={(event) => updateSchedule({ ...schedule, end: event.target.value })} /></label>
      </fieldset>
      <label className="account-dnd-urgent"><input type="checkbox" checked={value.allow_urgent} onChange={(event) => setDraft({ ...value, allow_urgent: event.target.checked })} />{t('Vẫn gửi email thông báo khẩn; cảnh báo bảo mật luôn được gửi')}</label>
      <button className="primary" type="submit" disabled={mutation.isPending || JSON.stringify(value) === JSON.stringify(saved)}>{mutation.isPending ? t('Đang lưu…') : t('Lưu chế độ Không làm phiền')}</button>
    </form>}
  </section>
}

type DigestPreferences = { frequency: 'off' | 'daily' | 'weekly'; time: string; sections: string[] }
const digestDefaults: DigestPreferences = { frequency: 'off', time: '08:00', sections: ['orders', 'revenue', 'low_stock'] }
const digestOptions = [
  ['orders', 'Đơn hàng mới chờ xử lý'],
  ['revenue', 'Doanh thu thuần'],
  ['low_stock', 'Tồn kho thấp'],
  ['reviews', 'Đánh giá chờ duyệt'],
  ['overdue_tasks', 'Việc cá nhân quá hạn'],
] as const

function DigestPreferencesPanel({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const queryKey = ['account-preferences', accountId, 'admin_digest']
  const query = useQuery({ queryKey, queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json().catch(() => ({})) as { data?: { admin_digest?: Partial<DigestPreferences> }; message?: string }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được cài đặt bản tin tóm tắt.'))
    return { ...digestDefaults, ...body.data?.admin_digest }
  } })
  const [draft, setDraft] = useState<DigestPreferences | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const saved = query.data ?? digestDefaults
  const value = draft ?? saved
  const dirty = JSON.stringify(value) !== JSON.stringify(saved)
  useUnsavedFormGuard(dirty)
  const mutation = useMutation({
    mutationFn: async (next: DigestPreferences) => {
      const response = await adminApiFetch(`${apiUrl}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_digest', value: next }) })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không lưu được cài đặt bản tin tóm tắt.'))
      return next
    },
    onSuccess: (next) => { client.setQueryData(queryKey, next); setDraft(null); setNotice(t('Đã lưu lịch bản tin tóm tắt.')); setError('') },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không lưu được cài đặt bản tin tóm tắt.')); setNotice('') },
  })
  return <section className="panel account-personal-page">
    <header className="panel-heading"><div><h2>{t('Bản tin tóm tắt')}</h2><p>{t('Gửi các mục có dữ liệu vào giờ đã chọn, theo múi giờ hồ sơ. Kênh nhận dùng dòng “Bản tin tóm tắt” ở phần tùy chọn thông báo; bản tin rỗng sẽ được bỏ qua.')}</p></div></header>
    {query.isPending && <p role="status">{t('Đang tải…')}</p>}
    {query.isError && <p className="account-settings-error" role="alert">{query.error instanceof Error ? query.error.message : t('Không tải được cài đặt bản tin tóm tắt.')} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {!query.isPending && !query.isError && <form className="account-notifications-form account-digest-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(value) }}>
      <label>{t('Lịch gửi')}<select value={value.frequency} onChange={(event) => setDraft({ ...value, frequency: event.target.value as DigestPreferences['frequency'] })}><option value="off">{t('Tắt')}</option><option value="daily">{t('Hàng ngày')}</option><option value="weekly">{t('Hàng tuần, sáng thứ Hai')}</option></select></label>
      <label>{t('Giờ gửi')}<input type="time" value={value.time} disabled={value.frequency === 'off'} onChange={(event) => setDraft({ ...value, time: event.target.value })} /></label>
      <fieldset className="account-digest-sections"><legend>{t('Nội dung bản tin')}</legend>{digestOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={value.sections.includes(key)} onChange={(event) => setDraft({ ...value, sections: event.target.checked ? [...value.sections, key] : value.sections.filter((item) => item !== key) })} />{t(label)}</label>)}</fieldset>
      <p className="muted">{t('Chỉ hiển thị mục bạn có quyền xem. Bản tin chỉ được gửi khi có ít nhất một mục cần chú ý.')}</p>
      <button className="primary" type="submit" disabled={mutation.isPending || !dirty}>{mutation.isPending ? t('Đang lưu…') : t('Lưu lịch bản tin')}</button>
    </form>}
  </section>
}
