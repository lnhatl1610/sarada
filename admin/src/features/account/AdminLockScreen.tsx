import { useEffect, useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { AdminOtpInput } from '../../components/shared/AdminOtpInput'
import { FormField } from '../../components/shared/form-field'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type Props = { apiUrl: string; accessToken: string; name: string; email: string; onUnlock: () => void; onLogout: () => void | Promise<void> }

export function AdminLockScreen({ apiUrl, accessToken, name, email, onUnlock, onLogout }: Props) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try { return Number(sessionStorage.getItem('fashion-admin-unlock-failures') ?? 0) } catch { return 0 }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void adminApiFetch(`${apiUrl}/account/sudo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { data?: { requires_two_factor?: boolean } }
        if (response.ok) setRequiresTwoFactor(body.data?.requires_two_factor ?? false)
      })
  }, [apiUrl, accessToken])

  async function rejectAttempt(message: string) {
    const attempts = failedAttempts + 1
    setFailedAttempts(attempts)
    try { sessionStorage.setItem('fashion-admin-unlock-failures', String(attempts)) } catch { /* storage may be disabled */ }
    setError(attempts >= 5 ? t('Đã nhập sai 5 lần. Phiên sẽ đăng xuất.') : t('{{message}} Còn {{count}} lần thử.', { message: t(message), count: 5 - attempts }))
    if (attempts >= 5) await onLogout()
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !password || (requiresTwoFactor && code.length !== 6)) return
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/account/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: password, ...(requiresTwoFactor ? { two_factor_code: code } : {}) }) })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) {
        if (response.status === 422 || response.status === 429) await rejectAttempt(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? t('Không xác thực được.'))
        else setError(t(body.message ?? 'Không thể mở khóa. Hãy thử lại.'))
        return
      }
      setPassword('')
      setCode('')
      setFailedAttempts(0)
      try { sessionStorage.removeItem('fashion-admin-unlock-failures') } catch { /* storage may be disabled */ }
      onUnlock()
    } catch {
      setError(t('Không kết nối được máy chủ. Hãy thử lại.'))
    } finally {
      setBusy(false)
    }
  }

  return <div className="admin-lock-backdrop"><section className="admin-lock-card" role="dialog" aria-modal="true" aria-labelledby="admin-lock-title"><span className="admin-lock-icon"><LockKeyhole aria-hidden="true" /></span><p className="eyebrow">{t('PHIÊN QUẢN TRỊ ĐANG ĐƯỢC GIỮ')}</p><h1 id="admin-lock-title">{t('Màn hình đã khóa')}</h1><p className="admin-lock-user">{name} · {email}</p><p className="admin-lock-description">{t('Phiên đăng nhập và dữ liệu đang làm vẫn được giữ. Xác thực để tiếp tục.')}</p><form onSubmit={(event) => void submitPassword(event)}><FormField id="admin-unlock-password" label={t('Mật khẩu')} required><input autoFocus autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField>{requiresTwoFactor && <AdminOtpInput id="admin-unlock-code" label={t('Mã xác thực 6 số')} value={code} onChange={setCode} />}{error && <p className="account-form-error" role="alert">{error}</p>}<button className="primary admin-lock-submit" type="submit" disabled={busy || !password || (requiresTwoFactor && code.length !== 6)}>{busy ? t('Đang xác thực…') : t('Mở khóa')}</button></form><button className="link-button admin-lock-logout" type="button" disabled={busy} onClick={() => void onLogout()}>{t('Đăng xuất')}</button></section></div>
}
