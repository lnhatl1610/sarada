import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormField } from '../../components/shared/form-field'
import { AdminOtpInput } from '../../components/shared/AdminOtpInput'
import { useTranslation } from 'react-i18next'
import { adminApiFetch } from '../../lib/admin-api'

type AuthResponse = {
  data?: { access_token?: string; two_factor_required?: boolean; challenge_token?: string }
  message?: string
  errors?: Record<string, string[]>
}

type Props = {
  apiUrl: string
  email: string
  open: boolean
  onAuthenticated: (accessToken: string) => void
}

export function SessionReauthDialog({ apiUrl, email, open, onAuthenticated }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [manualEmail, setManualEmail] = useState('')
  const accountEmail = email || manualEmail
  const [password, setPassword] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [code, setCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && dialog && !dialog.open) dialog.showModal()
    if (!open && dialog?.open) dialog.close()
    if (open) window.requestAnimationFrame(() => (challengeToken ? document.getElementById(useRecoveryCode ? 'session-reauth-recovery' : 'session-reauth-code') : passwordRef.current)?.focus())
  }, [open, challengeToken, useRecoveryCode])

  const finish = (body: AuthResponse) => {
    if (!body.data?.access_token) throw new Error(body.message ?? t('Không thể khôi phục phiên đăng nhập.'))
    setPassword('')
    setCode('')
    setRecoveryCode('')
    setChallengeToken('')
    onAuthenticated(body.data.access_token)
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accountEmail || !password || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl.replace(/\/$/, '')}/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, password }),
      })
      const body = await response.json().catch(() => ({})) as AuthResponse
      if (!response.ok) throw new Error(body.errors?.email?.[0] ?? body.errors?.password?.[0] ?? body.message ?? t('Thông tin đăng nhập không chính xác.'))
      if (response.status === 202 && body.data?.two_factor_required && body.data.challenge_token) {
        setChallengeToken(body.data.challenge_token)
        setPassword('')
        return
      }
      finish(body)
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể khôi phục phiên. Hãy thử lại.'))
    } finally {
      setBusy(false)
    }
  }

  const submitTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!challengeToken || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl.replace(/\/$/, '')}/admin/auth/two-factor/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_token: challengeToken, ...(useRecoveryCode ? { recovery_code: recoveryCode } : { code }) }),
      })
      const body = await response.json().catch(() => ({})) as AuthResponse
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? t('Mã xác thực không hợp lệ.'))
      finish(body)
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể xác thực. Hãy thử lại.'))
    } finally {
      setBusy(false)
    }
  }

  return <dialog ref={dialogRef} className="account-dialog session-reauth-dialog" aria-labelledby="session-reauth-title" aria-describedby="session-reauth-description" onCancel={(event) => event.preventDefault()}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('BẢO MẬT TÀI KHOẢN')}</p><h2 id="session-reauth-title">{t('Phiên đăng nhập đã hết hạn')}</h2></div></div>
    <p id="session-reauth-description" className="account-dialog-description">{t('Nhập lại mật khẩu để tiếp tục tại trang hiện tại. Trang đang mở sẽ được giữ nguyên.')}</p>
    {challengeToken ? <form className="account-password-form" onSubmit={(event) => void submitTwoFactor(event)} noValidate>
      <p className="session-reauth-email">{accountEmail}</p>
      {useRecoveryCode ? <FormField id="session-reauth-recovery" label={t('Mã khôi phục')} required><input autoComplete="one-time-code" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 14))} required /></FormField> : <FormField id="session-reauth-code" label={t('Mã xác thực 6 số')} required><AdminOtpInput id="session-reauth-code" label={t('Mã xác thực')} value={code} onChange={setCode} autoFocus /></FormField>}
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="link-button" type="button" onClick={() => { setChallengeToken(''); setUseRecoveryCode(false); setCode(''); setRecoveryCode(''); setError('') }} disabled={busy}>{t('Nhập lại mật khẩu')}</button><button className="primary" type="submit" disabled={busy || (useRecoveryCode ? recoveryCode.length !== 14 : code.length !== 6)}>{busy ? t('Đang xác thực…') : t('Xác thực và tiếp tục')}</button></div>
      <button className="link-button" type="button" onClick={() => { setUseRecoveryCode((current) => !current); setError('') }} disabled={busy}>{useRecoveryCode ? t('Dùng mã từ ứng dụng xác thực') : t('Dùng mã khôi phục')}</button>
    </form> : <form className="account-password-form" onSubmit={(event) => void submitPassword(event)} noValidate>
      {email ? <p className="session-reauth-email">{email}</p> : <FormField id="session-reauth-email" label={t('Email tài khoản')} required><input type="email" autoComplete="username" value={accountEmail} onChange={(event) => setManualEmail(event.target.value)} required /></FormField>}
      <FormField id="session-reauth-password" label={t('Mật khẩu')} required><input ref={passwordRef} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="primary" type="submit" disabled={busy || !accountEmail || !password}>{busy ? t('Đang xác thực…') : t('Tiếp tục làm việc')}</button></div>
    </form>}
  </dialog>
}
