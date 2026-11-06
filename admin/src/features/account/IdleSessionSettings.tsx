import { useEffect, useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

const choices = [
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '60 phút' },
  { value: 120, label: '120 phút' },
  { value: 0, label: 'Không tự đăng xuất' },
]
const lockChoices = [
  { value: 0, label: 'Không tự khóa' },
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '60 phút' },
]

export function IdleSessionSettings({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(30)
  const [autoLock, setAutoLock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    void adminApiFetch(`${apiUrl}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { data?: { admin_session_security?: { idle_timeout_minutes?: number; auto_lock_minutes?: number } }; message?: string }
        if (!response.ok) throw new Error(body.message ? t(body.message) : t('Không tải được tùy chọn phiên.'))
        if (!cancelled) setValue(body.data?.admin_session_security?.idle_timeout_minutes ?? 30)
        if (!cancelled) setAutoLock(body.data?.admin_session_security?.auto_lock_minutes ?? 0)
      })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? t(cause.message) : t('Không tải được tùy chọn phiên.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [apiUrl, accessToken, t])

  async function save(nextTimeout: number, nextAutoLock: number) {
    const previous = { value, autoLock }
    setValue(nextTimeout)
    setAutoLock(nextAutoLock)
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await adminApiFetch(`${apiUrl}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_session_security', value: { idle_timeout_minutes: nextTimeout, auto_lock_minutes: nextAutoLock } }) })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ? t(body.message) : t('Không lưu được tùy chọn phiên.'))
      window.dispatchEvent(new CustomEvent('fashion-admin-session-security-change', { detail: { idleTimeout: nextTimeout, autoLock: nextAutoLock } }))
      setNotice(t('Đã lưu thời gian tự đăng xuất.'))
    } catch (cause) {
      setValue(previous.value)
      setAutoLock(previous.autoLock)
      setError(cause instanceof Error ? t(cause.message) : t('Không lưu được tùy chọn phiên.'))
    } finally {
      setSaving(false)
    }
  }

  return <section className="panel account-settings-form idle-session-settings"><h3>{t('Khóa và đăng xuất tự động')}</h3><p className="account-settings-help">{t('Hoạt động chuột, bàn phím và thao tác trên tab khác sẽ gia hạn thời gian. Hộp nhắc xuất hiện một phút trước khi đăng xuất. Khóa màn hình giữ nguyên phiên và dữ liệu đang nhập.')}</p><label htmlFor="admin-idle-timeout">{t('Tự đăng xuất sau khi không hoạt động')}</label><select id="admin-idle-timeout" value={value} disabled={loading || saving} onChange={(event) => void save(Number(event.target.value), autoLock)}>{choices.map((choice) => <option value={choice.value} key={choice.value}>{t(choice.label)}</option>)}</select><label htmlFor="admin-auto-lock">{t('Tự khóa màn hình sau khi không hoạt động')}</label><select id="admin-auto-lock" value={autoLock} disabled={loading || saving} onChange={(event) => void save(value, Number(event.target.value))}>{lockChoices.map((choice) => <option value={choice.value} key={choice.value}>{t(choice.label)}</option>)}</select>{loading && <p role="status">{t('Đang tải tùy chọn…')}</p>}{saving && <p role="status">{t('Đang lưu…')}</p>}{error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}</section>
}
