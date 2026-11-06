import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { adminRoleLabels } from './roles'
import { AdminAuthLayout } from '../auth/AdminAuthLayout'
import { formatDateTime } from '../../lib/date-format'

const schema = (t: (key: string) => string) => z.object({ name: z.string().trim().min(2, t('Họ tên tối thiểu 2 ký tự.')).max(160), password: z.string().min(10, t('Mật khẩu tối thiểu 10 ký tự.')), password_confirmation: z.string(), terms: z.boolean().refine((value) => value, t('Bạn cần đồng ý điều khoản.')) }).refine((value) => value.password === value.password_confirmation, { path: ['password_confirmation'], message: t('Mật khẩu xác nhận chưa khớp.') })
type InviteDetails = { email: string; role: string; expires_at: string }
type Values = z.infer<ReturnType<typeof schema>>

export function StaffInvitationPage({ apiUrl, token, onAuthenticated }: { apiUrl: string; token: string; onAuthenticated: (accessToken: string) => void }) {
  const { t } = useTranslation()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<Values>({ resolver: zodResolver(schema(t)), defaultValues: { name: '', password: '', password_confirmation: '', terms: false } })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)

  useEffect(() => {
    let active = true
    adminApiFetch(`${apiUrl}/staff-invitations/${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } })
      .then(async (response) => { const body = await response.json() as { data?: InviteDetails; message?: string }; if (!response.ok || !body.data) throw new Error(t(body.message ?? 'Lời mời không hợp lệ hoặc đã hết hạn.')); if (active) setInvite(body.data) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? t(cause.message) : t('Không tải được lời mời.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [apiUrl, token, t])

  const accept = form.handleSubmit(async (values) => {
    if (!invite) return
    setBusy(true); setError('')
    try {
      const accepted = await adminApiFetch(`${apiUrl}/staff-invitations/${encodeURIComponent(token)}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(values) })
      const acceptedBody = await accepted.json() as { message?: string; errors?: Record<string, string[]> }
      if (!accepted.ok) throw new Error(t(acceptedBody.errors ? Object.values(acceptedBody.errors).flat().join(' ') : acceptedBody.message ?? 'Không thể nhận lời mời.'))
      confirmDiscard.clear()
      const login = await adminApiFetch(`${apiUrl}/admin/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: invite.email, password: values.password }) })
      const loginBody = await login.json() as { data?: { access_token?: string }; message?: string }
      if (loginBody.data?.access_token) onAuthenticated(loginBody.data.access_token)
      else { setError(t(loginBody.message ?? 'Đã nhận lời mời. Hãy đăng nhập để tiếp tục.')); window.setTimeout(() => { location.href = '/login' }, 1800) }
    } catch (cause) { setError(cause instanceof Error ? t(cause.message) : t('Không thể nhận lời mời.')) }
    finally { setBusy(false) }
  })

  return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/">FASHION<span>.</span><small>STORE</small></a><p className="eyebrow">{t('LỜI MỜI NHÂN VIÊN')}</p><h1>{t('Tham gia cửa hàng')}</h1>{loading ? <p role="status">{t('Đang kiểm tra lời mời…')}</p> : invite ? <><p className="login-lede">{t('Lời mời được gửi đến {{email}} với vai trò {{role}}. Liên kết hết hạn {{date}}.', { email: invite.email, role: t(adminRoleLabels[invite.role] ?? invite.role), date: formatDateTime(invite.expires_at) })}</p><form onSubmit={accept}><FormField id="invite-name" label={t('Họ và tên')} required error={form.formState.errors.name?.message}><input autoComplete="name" {...form.register('name')} /></FormField><FormField id="invite-password" label={t('Mật khẩu mới')} required error={form.formState.errors.password?.message}><input type="password" autoComplete="new-password" {...form.register('password')} /></FormField><FormField id="invite-password-confirm" label={t('Nhập lại mật khẩu')} required error={form.formState.errors.password_confirmation?.message}><input type="password" autoComplete="new-password" {...form.register('password_confirmation')} /></FormField><label className="login-remember"><input type="checkbox" {...form.register('terms')} /> <span>{t('Tôi đồng ý điều khoản sử dụng')}</span></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary login-submit" disabled={busy || !form.formState.isDirty}>{busy ? t('Đang nhận lời mời…') : t('Nhận lời mời')}</button></form></> : <p className="auth-error" role="alert">{error}</p>}</section></AdminAuthLayout>
}
