import { adminApiFetch } from '../../lib/admin-api'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { AdminAuthLayout } from '../auth/AdminAuthLayout'

type Props = { apiUrl: string; token?: string; mode: 'request' | 'sent' | 'reset' | 'done' }

const recoverySchema = (isReset: boolean, t: (key: string) => string) => z.object({
  email: z.string().trim().email(t('Nhập địa chỉ email hợp lệ.')),
  token: z.string(),
  password: z.string(),
  password_confirmation: z.string(),
}).superRefine((values, context) => {
  if (!isReset) return
  if (!values.token.trim()) context.addIssue({ code: 'custom', path: ['token'], message: t('Mã đặt lại mật khẩu là bắt buộc.') })
  if (values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: t('Mật khẩu mới cần ít nhất 8 ký tự.') })
  if (!/[A-Za-z]/.test(values.password)) context.addIssue({ code: 'custom', path: ['password'], message: t('Mật khẩu cần có chữ cái.') })
  if (!/[0-9]/.test(values.password)) context.addIssue({ code: 'custom', path: ['password'], message: t('Mật khẩu cần có chữ số.') })
  if (values.password !== values.password_confirmation) context.addIssue({ code: 'custom', path: ['password_confirmation'], message: t('Mật khẩu nhập lại chưa khớp.') })
})

type RecoveryValues = z.infer<ReturnType<typeof recoverySchema>>
const createResendDeadline = () => Date.now() + 60_000

export function PasswordRecoveryPage({ apiUrl, token, mode }: Props) {
  const { t } = useTranslation()
  const isReset = mode === 'reset'
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(() => {
    const until = Number(sessionStorage.getItem('fashion-admin-recovery-resend-until') ?? 0)
    return Math.max(0, Math.ceil((until - Date.now()) / 1000))
  })
  const emailFromLink = new URLSearchParams(location.search).get('email') ?? ''
  const form = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema(isReset, t)),
    defaultValues: { email: emailFromLink, token: token ?? '', password: '', password_confirmation: '' },
  })
  const confirmDiscard = useUnsavedFormGuard((mode === 'request' || mode === 'reset') && form.formState.isDirty)
  const passwordValue = useWatch({ control: form.control, name: 'password' }) ?? ''
  const resendActive = resendSeconds > 0
  const passwordChecks = [
    { label: t('Ít nhất 8 ký tự'), valid: passwordValue.length >= 8 },
    { label: t('Có chữ cái'), valid: /[A-Za-z]/.test(passwordValue) },
    { label: t('Có chữ số'), valid: /[0-9]/.test(passwordValue) },
    { label: t('Có ký tự đặc biệt (khuyến nghị)'), valid: /[^A-Za-z0-9]/.test(passwordValue) },
  ]
  const passwordStrength = passwordChecks.slice(0, 3).filter((check) => check.valid).length + Number(passwordChecks[3].valid)

  useEffect(() => {
    if (!resendActive) return
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => {
        if (seconds <= 1) {
          sessionStorage.removeItem('fashion-admin-recovery-resend-until')
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendActive])

  const submit = form.handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const payload = isReset
        ? { email: values.email, token: values.token, password: values.password, password_confirmation: values.password_confirmation }
        : { email: values.email }
      const response = await adminApiFetch(`${apiUrl}/auth/${isReset ? 'reset-password' : 'forgot-password'}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(data, response.status, t('Không thể xử lý yêu cầu.'))
      if (isReset) {
        confirmDiscard.clear()
        window.location.assign('/reset-password/done')
      } else {
        sessionStorage.setItem('fashion-admin-recovery-email', values.email)
        sessionStorage.setItem('fashion-admin-recovery-resend-until', String(createResendDeadline()))
        confirmDiscard.clear()
        window.location.assign('/forgot-password/sent')
      }
    } catch (cause) {
      const mapped = applyServerValidationErrors(form, cause)
      setError(mapped ? '' : cause instanceof Error ? t(cause.message) : t('Không thể xử lý yêu cầu.'))
    } finally {
      setBusy(false)
    }
  })

  const resend = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sessionStorage.getItem('fashion-admin-recovery-email') ?? '' }),
      })
      const data = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(data, response.status, t('Không thể gửi lại hướng dẫn.'))
      setMessage(data.message ? t(data.message) : t('Nếu email được đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hòm thư.'))
      sessionStorage.setItem('fashion-admin-recovery-resend-until', String(Date.now() + 60_000))
      setResendSeconds(60)
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể gửi lại hướng dẫn.'))
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'done') return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/">NÉT<span>.</span><small>STUDIO</small></a><p className="eyebrow">{t('BẢO MẬT TÀI KHOẢN')}</p><h1>{t('Mật khẩu đã được cập nhật')}</h1><p className="login-lede">{t('Bạn có thể đăng nhập bằng mật khẩu mới.')}</p><a className="primary login-submit" href="/login">{t('Đăng nhập ngay')}</a></section></AdminAuthLayout>

  if (mode === 'sent') return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/">NÉT<span>.</span><small>STUDIO</small></a><p className="eyebrow">{t('BẢO MẬT TÀI KHOẢN')}</p><h1>{t('Kiểm tra hòm thư')}</h1><p className="login-lede">{t('Nếu email được đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hòm thư. Hãy kiểm tra cả thư rác.')}</p>{message && <p className="reference-notice" role="status">{message}</p>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="secondary login-submit" type="button" onClick={() => void resend()} disabled={busy || resendSeconds > 0}>{busy ? t('Đang gửi...') : resendSeconds > 0 ? t('Gửi lại sau {{seconds}} giây', { seconds: resendSeconds }) : t('Gửi lại hướng dẫn')}</button><p><a href="/login">{t('Quay lại đăng nhập')}</a></p></section></AdminAuthLayout>

  return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/">NÉT<span>.</span><small>STUDIO</small></a><p className="eyebrow">{t('BẢO MẬT TÀI KHOẢN')}</p><h1>{t(isReset ? 'Đặt lại mật khẩu' : 'Quên mật khẩu?')}</h1><p className="login-lede">{t(isReset ? 'Tạo mật khẩu mới cho tài khoản của bạn.' : 'Nhập email để nhận hướng dẫn đặt lại mật khẩu.')}</p><form onSubmit={submit} noValidate>
    {(!isReset || !emailFromLink) && <FormField id="recovery-email" label={t("Email")} error={form.formState.errors.email?.message} required><input type="email" autoComplete="email" {...form.register('email')} /></FormField>}
    {isReset && <><input type="hidden" {...form.register('token')} /><FormField id="recovery-password" label={t('Mật khẩu mới')} error={form.formState.errors.password?.message} required><input type="password" autoComplete="new-password" {...form.register('password')} /></FormField><div className="password-strength" aria-label={t('Độ mạnh mật khẩu: {{strength}} trên 4', { strength: passwordStrength })}><div className="password-strength-bars" aria-hidden="true">{[1, 2, 3, 4].map((level) => <i key={level} className={passwordStrength >= level ? 'is-filled' : ''} />)}</div><span>{t(passwordStrength <= 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : passwordStrength === 3 ? 'Tốt' : 'Mạnh')}</span></div><ul className="password-checklist">{passwordChecks.map((check) => <li key={check.label} data-valid={check.valid}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul><FormField id="recovery-password-confirm" label={t('Nhập lại mật khẩu')} error={form.formState.errors.password_confirmation?.message} required><input type="password" autoComplete="new-password" {...form.register('password_confirmation')} /></FormField></>}
     {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="reference-notice" role="status">{message}</p>}<button className="primary login-submit" disabled={busy}>{busy ? t('Đang xử lý...') : t(isReset ? 'Đặt lại mật khẩu' : 'Gửi hướng dẫn')}</button></form>{isReset && <p><a href="/forgot-password">{t('Yêu cầu đường dẫn đặt lại mới')}</a></p>}<p><a href="/login">{t('Quay lại đăng nhập')}</a></p></section></AdminAuthLayout>
}
