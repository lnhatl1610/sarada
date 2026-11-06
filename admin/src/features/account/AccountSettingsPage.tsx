/* eslint-disable react-hooks/incompatible-library -- React Hook Form provides the live password value for the strength meter and powers the account forms. */
import { adminApiFetch } from '../../lib/admin-api'
import { mediaUrl } from '../../lib/media-url'
import { formatDateTime } from '../../lib/date-format'
import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { FormField, PasswordVisibilityToggle } from '../../components/shared/form-field'
import { ImageUploader } from '../../components/shared/image-uploader'
import { publishAdminPageSize, useAdminPageSize } from '../../components/shared/admin-page-size'
import { TwoFactorPanel } from './TwoFactorPanel'
import { AvatarCropDialog } from './AvatarCropDialog'
import { useListUrlState } from '../../lib/use-list-url-state'
import { SudoModeDialog } from './SudoModeDialog'
import { IdleSessionSettings } from './IdleSessionSettings'
import { useTranslation } from 'react-i18next'

type Account = { id: number; name: string; email: string; must_change_password?: boolean; status?: string; created_at?: string | null; updated_at?: string | null; creator_name?: string | null; last_login_at?: string | null; pending_email?: string | null; phone?: string | null; avatar?: string | null; gender?: string | null; birthday?: string | null; email_verified?: boolean; staff_code?: string | null; role?: string; job_title?: string | null; department?: string | null; bio?: string | null; signature?: string | null; timezone?: string | null; presence_status?: string }
type Session = { id: number; name: string; created_at: string; last_used_at: string | null; is_current: boolean; ip: string | null; device_info: string | null; browser: string; browser_version: string | null; operating_system: string; device_type: string }
type SessionPageMeta = { current_page: number; last_page: number; per_page: number; total: number }
const profileSchema = z.object({ name: z.string().trim().min(2, 'Nhập ít nhất 2 ký tự.').max(255, 'Tối đa 255 ký tự.'), phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.').or(z.literal('')), gender: z.enum(['', 'male', 'female', 'other']), birthday: z.string(), job_title: z.string().max(100, 'Tối đa 100 ký tự.'), department: z.enum(['', 'operations', 'warehouse', 'customer_service', 'marketing', 'accounting', 'other']), bio: z.string().max(500, 'Tối đa 500 ký tự.'), signature: z.string().max(300, 'Tối đa 300 ký tự.'), timezone: z.string() })
const passwordSchema = z.object({ password: z.string().min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.').regex(/[A-Za-z]/, 'Cần có chữ cái.').regex(/[0-9]/, 'Cần có chữ số.'), password_confirmation: z.string(), logout_other_devices: z.boolean() }).refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Mật khẩu nhập lại chưa khớp.' })
type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>
const maxBirthday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const accountStatusLabels: Record<string, string> = { active: 'Đang hoạt động', pending_approval: 'Chờ duyệt', blocked: 'Đã khóa' }
const avatarFallbackColors = ['#6f4e7c', '#286c78', '#a45f45', '#516b45', '#405b90', '#8a6740']
function PasswordStrengthIndicator({ value, current, t }: { value: string; current: string; t: (key: string) => string }) {
  const checks = [
    value.length >= 8,
    /[A-Za-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ]
  const score = checks.filter(Boolean).length
  const label = !value ? t('Chưa nhập') : score <= 1 ? t('Yếu') : score === 2 ? t('Trung bình') : score === 3 ? t('Tốt') : t('Mạnh')

  return <div className="account-password-strength">
    <div className="account-password-strength-track" role="meter" aria-label={t('Độ mạnh mật khẩu')} aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={label}>
      <span data-strength={score} style={{ width: `${score * 25}%` }} />
    </div>
    <small>{t('Độ mạnh:')} {label}</small>
    <ul className="account-password-checklist" aria-label={t('Tiêu chí mật khẩu')}>
      <li aria-checked={checks[0]} role="checkbox">{checks[0] ? '✓' : '○'} {t('Ít nhất 8 ký tự')}</li>
      <li aria-checked={checks[1]} role="checkbox">{checks[1] ? '✓' : '○'} {t('Có chữ cái')}</li>
      <li aria-checked={checks[2]} role="checkbox">{checks[2] ? '✓' : '○'} {t('Có chữ số')}</li>
      <li aria-checked={checks[3]} role="checkbox">{checks[3] ? '✓' : '○'} {t('Có ký tự đặc biệt (khuyến nghị)')}</li>
      <li aria-checked={Boolean(value) && value !== current} role="checkbox">{value && value !== current ? '✓' : '○'} {t('Khác mật khẩu hiện tại')}</li>
    </ul>
  </div>
}

export function AccountSettingsPage({ apiUrl, accessToken, onAccountUpdated, initialTab = 'profile', mustChangePassword = false }: { apiUrl: string; accessToken: string; onAccountUpdated: (account: Partial<Account>) => void; initialTab?: 'profile' | 'security' | 'sessions'; mustChangePassword?: boolean }) {
  const { t } = useTranslation()
  const [account, setAccount] = useState<Account | null>(null)
  const [sudoOpen, setSudoOpen] = useState(false)
  const [sudoRequiresTwoFactor, setSudoRequiresTwoFactor] = useState(false)
  const [sudoExpiresAt, setSudoExpiresAt] = useState<string | null>(null)
  const pendingSudoAction = useRef<(() => void | Promise<void>) | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsMeta, setSessionsMeta] = useState<SessionPageMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [currentSessionIp, setCurrentSessionIp] = useState<string | null>(null)
  const { state: sessionsUrlState, setValue: setSessionsUrlValue } = useListUrlState('account_sessions', { page: '1', sort: '-last_used_at' })
  const sessionPageSize = useAdminPageSize()
  const sessionPage = Math.max(1, Number.parseInt(sessionsUrlState.page, 10) || 1)
  const sessionSort = sessionsUrlState.sort || '-last_used_at'
  const sessionSortBy = sessionSort.startsWith('-') ? sessionSort.slice(1) : sessionSort
  const sessionSortDirection = sessionSort.startsWith('-') ? 'desc' : 'asc'
  const [sessionActionPath, setSessionActionPath] = useState<string | null>(null)
  const [reportedSessionId, setReportedSessionId] = useState<number | null>(null)
  const [confirmAvatarDelete, setConfirmAvatarDelete] = useState(false)
  const [tab, setTab] = useState<'profile' | 'security' | 'sessions'>(initialTab)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarFallbackColor, setAvatarFallbackColor] = useState(avatarFallbackColors[0])
  const [busy, setBusy] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<Record<string, boolean>>({})
  const profile = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values: { name: account?.name ?? '', phone: account?.phone ?? '', gender: (account?.gender as ProfileValues['gender']) ?? '', birthday: account?.birthday ?? '', job_title: account?.job_title ?? '', department: (account?.department as ProfileValues['department']) ?? '', bio: account?.bio ?? '', signature: account?.signature ?? '', timezone: account?.timezone ?? 'Asia/Ho_Chi_Minh' } })
  const profileDraftKey = account ? `fashion-store:admin-profile-draft:${account.id}` : null
  const { watch: watchProfile, getValues: getProfileValues, reset: resetProfile } = profile
  const profileIsDirty = profile.formState.isDirty
  const profilePreview = watchProfile()
  useEffect(() => {
    if (!profileDraftKey) return
    try {
      const draft = sessionStorage.getItem(profileDraftKey)
      if (draft) resetProfile({ ...getProfileValues(), ...JSON.parse(draft) as Partial<ProfileValues> })
    } catch { try { sessionStorage.removeItem(profileDraftKey) } catch { /* Storage can be unavailable in private browsing. */ } }
  }, [profileDraftKey, getProfileValues, resetProfile])
  useEffect(() => {
    if (!profileDraftKey) return
    const subscription = watchProfile((values) => {
      try { if (profileIsDirty) sessionStorage.setItem(profileDraftKey, JSON.stringify(values)); else sessionStorage.removeItem(profileDraftKey) } catch { /* Storage can be unavailable in private browsing. */ }
    })
    return () => subscription.unsubscribe()
  }, [profileDraftKey, watchProfile, profileIsDirty])
  const password = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { logout_other_devices: true } })
  const passwordDraft = password.watch('password') ?? ''
  const currentPasswordDraft = ''
  const hasUnsavedChanges = profile.formState.isDirty || password.formState.isDirty
  const confirmAccountDiscard = useUnsavedFormGuard(hasUnsavedChanges)
  const confirmAvatarDiscard = useUnsavedFormGuard(Boolean(avatarFile))
  const passwordVisibilityAction = (name: string, inputId: string) => <PasswordVisibilityToggle inputId={inputId} visible={Boolean(visiblePasswordFields[name])} onToggle={() => setVisiblePasswordFields((current) => ({ ...current, [name]: !current[name] }))} />
  const call = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    const response = await adminApiFetch(`${apiUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(init.body instanceof FormData ? {} : init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const body = await response.json().catch(() => ({})) as { data?: T; meta?: SessionPageMeta; message?: string; errors?: Record<string, string[]> }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể cập nhật tài khoản.'))
    return body
  }, [apiUrl, accessToken, t])
  const requireSudo = (action: () => void | Promise<void>) => {
    if (sudoExpiresAt && new Date(sudoExpiresAt).getTime() > Date.now()) { void action(); return }
    pendingSudoAction.current = action
    setSudoOpen(true)
  }
  useEffect(() => {
    let active = true
    void adminApiFetch(`${apiUrl}/account/sudo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then((response) => response.json())
      .then((body: { data?: { active: boolean; expires_at: string | null; requires_two_factor: boolean } }) => {
        if (!active || !body.data) return
        setSudoExpiresAt(body.data.active ? body.data.expires_at : null)
        setSudoRequiresTwoFactor(body.data.requires_two_factor)
      }).catch(() => undefined)
    return () => { active = false }
  }, [apiUrl, accessToken])
  const load = useCallback(async () => {
    setLoadingAccount(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(sessionPage), per_page: String(sessionPageSize), sort: sessionSort })
      const [profileBody, sessionBody] = await Promise.all([call<Account>('/account'), call<Session[]>(`/account/sessions?${params}`)])
      if (profileBody.data) setAccount(profileBody.data)
      setSessions(sessionBody.data ?? [])
      if (sessionBody.meta) {
        if (sessionPage > sessionBody.meta.last_page) { setSessionsUrlValue('page', String(sessionBody.meta.last_page)); return }
        setSessionsMeta(sessionBody.meta)
      } else setSessionsMeta({ current_page: 1, last_page: 1, per_page: sessionPageSize, total: sessionBody.data?.length ?? 0 })
      const currentSession = sessionBody.data?.find((session) => session.is_current)
      if (currentSession) setCurrentSessionIp(currentSession.ip)
    }
    catch (e) { setError(e instanceof Error ? t(e.message) : t('Không tải được tài khoản.')) }
    finally { setLoadingAccount(false) }
  }, [call, sessionPage, sessionPageSize, sessionSort, setSessionsUrlValue, t])
  // This effect loads account data after the authenticated user or API URL changes.
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (new URLSearchParams(location.search).get('email_verified') === '1') setNotice(t('Email đăng nhập mới đã được xác minh.')) }, [t])
  const accountId = account?.id
  useEffect(() => {
    if (!accountId) return
    try {
      const savedColor = localStorage.getItem(`fashion-store:admin-avatar-fallback:${accountId}`)
      if (savedColor && avatarFallbackColors.includes(savedColor)) setAvatarFallbackColor(savedColor)
    } catch { /* Local preferences can be unavailable in private browsing. */ }
  }, [accountId])
  useEffect(() => {
    const syncTabFromPath = () => setTab(window.location.pathname.endsWith('/security') ? 'security' : window.location.pathname.endsWith('/sessions') ? 'sessions' : 'profile')
    window.addEventListener('popstate', syncTabFromPath)
    return () => window.removeEventListener('popstate', syncTabFromPath)
  }, [])
  useEffect(() => { if (mustChangePassword) setTab('security') }, [mustChangePassword])
  const saveProfile = profile.handleSubmit(async (values) => {
    setBusy(true); setError(''); setNotice('')
    try { const body = await call<Partial<Account>>('/account/profile', { method: 'PUT', body: JSON.stringify({ ...values, phone: values.phone || null, gender: values.gender || null, birthday: values.birthday || null, job_title: values.job_title || null, department: values.department || null, bio: values.bio || null, signature: values.signature || null }) }); if (body.data) { setAccount((old) => ({ ...old!, ...body.data })); onAccountUpdated(body.data) } profile.reset(values); if (profileDraftKey) sessionStorage.removeItem(profileDraftKey); setNotice(t('Đã lưu hồ sơ.')) }
    catch (e) { applyServerValidationErrors(profile, e); setError(e instanceof Error ? t(e.message) : t('Không lưu được hồ sơ.')) } finally { setBusy(false) }
  })
  const cancelProfileEdits = () => {
    if (!profile.formState.isDirty || !confirmAccountDiscard()) return
    profile.reset({ name: account?.name ?? '', phone: account?.phone ?? '', gender: (account?.gender as ProfileValues['gender']) ?? '', birthday: account?.birthday ?? '', job_title: account?.job_title ?? '', department: (account?.department as ProfileValues['department']) ?? '', bio: account?.bio ?? '', signature: account?.signature ?? '', timezone: account?.timezone ?? 'Asia/Ho_Chi_Minh' })
    if (profileDraftKey) sessionStorage.removeItem(profileDraftKey)
  }
  const savePassword = password.handleSubmit((values) => {
    setBusy(true); setError(''); setNotice('')
    requireSudo(async () => {
      try { await call('/account/password', { method: 'PUT', body: JSON.stringify(values) }); password.reset({ logout_other_devices: true }); onAccountUpdated({ must_change_password: false }); setNotice(values.logout_other_devices ? t('Đã đổi mật khẩu. Các thiết bị khác đã đăng xuất.') : t('Đã đổi mật khẩu. Các thiết bị khác vẫn được giữ đăng nhập. Email thông báo đã được gửi.')); await load() }
      catch (e) { applyServerValidationErrors(password, e); setError(e instanceof Error ? t(e.message) : t('Không đổi được mật khẩu.')) }
      finally { setBusy(false) }
    })
  })
  const uploadAvatar = async (file: File) => { setBusy(true); setAvatarError(''); setError(''); setNotice(''); try { const data = new FormData(); data.append('avatar', file); const body = await call<{ avatar: string }>('/account/avatar', { method: 'POST', body: data }); if (body.data) { setAccount((old) => ({ ...old!, avatar: body.data?.avatar })); onAccountUpdated(body.data) } confirmAvatarDiscard.clear(); setAvatarFile(null); setNotice(t('Đã cập nhật ảnh đại diện.')); return true } catch (e) { setAvatarError(e instanceof Error ? t(e.message) : t('Không tải được ảnh.')); return false } finally { setBusy(false) } }
  const closeAvatarCrop = () => { if (confirmAvatarDiscard()) setAvatarFile(null) }
  const sessionAction = (path: string) => setSessionActionPath(path)
  const deleteAvatar = async () => {
    setBusy(true)
    setAvatarError('')
    try {
      await call('/account/avatar', { method: 'DELETE' })
      setAccount((old) => ({ ...old!, avatar: null }))
      onAccountUpdated({ avatar: null })
      setNotice(t('Đã xóa ảnh đại diện.'))
      setConfirmAvatarDelete(false)
    } catch (e) {
      setAvatarError(e instanceof Error ? t(e.message) : t('Không xóa được ảnh.'))
    } finally {
      setBusy(false)
    }
  }
  const confirmSessionAction = async () => {
    if (!sessionActionPath) return
    setBusy(true); setError(''); setNotice('')
    try { await call(sessionActionPath, { method: 'DELETE' }); setSessionActionPath(null); await load(); setNotice(t('Đã cập nhật phiên đăng nhập.')) }
    catch (e) { setError(e instanceof Error ? t(e.message) : t('Không cập nhật được phiên.')) }
    finally { setBusy(false) }
  }
  const confirmReportSession = async () => {
    if (!reportedSessionId) return
    setBusy(true); setError(''); setNotice('')
    try {
      await call(`/account/sessions/${reportedSessionId}/report`, { method: 'POST' })
      setReportedSessionId(null)
      onAccountUpdated({ must_change_password: true })
      setTab('security')
      await load()
      setNotice(t('Phiên lạ đã bị thu hồi. Hãy đổi mật khẩu ngay và bật xác thực hai yếu tố.'))
    } catch (e) { setError(e instanceof Error ? t(e.message) : t('Không báo cáo được phiên đăng nhập.')) }
    finally { setBusy(false) }
  }
  const sessionColumns: DataTableColumn<Session>[] = [
    { id: 'device', header: t('THIẾT BỊ / TRÌNH DUYỆT'), sortable: true, sortKey: 'device_info', cell: (session) => <span><strong>{session.browser}{session.browser_version ? ` ${session.browser_version}` : ''}</strong><small>{session.name || t(session.device_type)}</small></span> },
    { id: 'operating_system', header: t('HỆ ĐIỀU HÀNH'), cell: (session) => `${t(session.operating_system)} · ${t(session.device_type)}` },
    { id: 'ip', header: t('ĐỊA CHỈ IP'), sortable: true, sortKey: 'ip', cell: (session) => session.ip || t('Không có dữ liệu') },
    { id: 'created_at', header: t('ĐĂNG NHẬP LÚC'), sortable: true, sortKey: 'created_at', cell: (session) => formatDateTime(session.created_at) },
    { id: 'last_used_at', header: t('HOẠT ĐỘNG GẦN NHẤT'), sortable: true, sortKey: 'last_used_at', cell: (session) => session.last_used_at ? formatDateTime(session.last_used_at) : t('Chưa ghi nhận') },
    { id: 'status', header: t('TRẠNG THÁI'), cell: (session) => session.is_current ? <span className="profile-role-badge">{t('Thiết bị này')}</span> : t('Đang hoạt động') },
    { id: 'actions', header: t('THAO TÁC'), cell: (session) => !session.is_current ? <RowActionsMenu label={t('Thao tác phiên đăng nhập {{name}}', { name: session.name })} actions={[{ id: 'revoke', label: t('Đăng xuất thiết bị'), destructive: true, onSelect: () => void sessionAction(`/account/sessions/${session.id}`) }, { id: 'report', label: t('Báo cáo phiên lạ'), destructive: true, onSelect: () => setReportedSessionId(session.id) }]} /> : '—' },
  ]
  const hasOtherSessionIp = Boolean(currentSessionIp && sessions.some((session) => !session.is_current && session.ip && session.ip !== currentSessionIp))
  const resendVerification = async () => { try { await call('/account/email/verification-notification', { method: 'POST' }); setNotice(t('Đã gửi email xác thực.')) } catch (e) { setError(e instanceof Error ? t(e.message) : t('Không gửi được email.')) } }

  return <section className="account-settings-page">
    <SudoModeDialog apiUrl={apiUrl} accessToken={accessToken} open={sudoOpen} requiresTwoFactor={sudoRequiresTwoFactor} onOpenChange={setSudoOpen} onAuthenticated={(expiresAt) => { setSudoExpiresAt(expiresAt); const action = pendingSudoAction.current; pendingSudoAction.current = null; void action?.() }} />
    <div className="panel account-settings-intro"><div><p className="eyebrow">{t('TÀI KHOẢN CỦA BẠN')}</p><h2>{t('Cài đặt tài khoản')}</h2><p>{t('Quản lý thông tin cá nhân và bảo mật đăng nhập.')}</p></div><span className="profile-role-badge">{account?.role ? t(account.role) : t('Đang tải vai trò')}</span></div>
    {error && <p className="account-settings-error" role="alert">{error}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {mustChangePassword && <section className="panel account-settings-form" aria-labelledby="forced-password-heading"><form onSubmit={savePassword}><h3 id="forced-password-heading">{t('Cần đổi mật khẩu để bảo vệ tài khoản')}</h3><p>{t('Bạn đã báo cáo một phiên đăng nhập lạ. Hãy đặt mật khẩu mới trước khi tiếp tục và bật xác thực hai yếu tố sau đó.')}</p><FormField id="forced-password-new" label={t('Mật khẩu mới')} required error={password.formState.errors.password?.message ? t(password.formState.errors.password.message) : undefined} controlAction={passwordVisibilityAction('new', 'forced-password-new')}><input id="forced-password-new" type={visiblePasswordFields.new ? 'text' : 'password'} autoComplete="new-password" {...password.register('password')} /></FormField><PasswordStrengthIndicator value={passwordDraft} current={currentPasswordDraft} t={t} /><FormField id="forced-password-confirm" label={t('Nhập lại mật khẩu')} required error={password.formState.errors.password_confirmation?.message ? t(password.formState.errors.password_confirmation.message) : undefined} controlAction={passwordVisibilityAction('confirm', 'forced-password-confirm')}><input id="forced-password-confirm" type={visiblePasswordFields.confirm ? 'text' : 'password'} autoComplete="new-password" {...password.register('password_confirmation')} /></FormField><button className="primary" disabled={busy || !password.formState.isDirty}>{t('Cập nhật mật khẩu')}</button></form></section>}
    {!mustChangePassword && tab === 'profile' && <form id="account-panel-profile" aria-labelledby="account-nav-profile" className="panel account-settings-form" onSubmit={saveProfile}>
      <div className="account-avatar-row"><span className="avatar profile-menu-avatar account-avatar-preview"><span className="avatar-fallback" style={{ backgroundColor: avatarFallbackColor }}>{account?.name.slice(0, 1).toUpperCase() ?? '?'}</span>{account?.avatar && <img src={mediaUrl(apiUrl, account.avatar)} alt={t('Ảnh đại diện')} onError={(event) => { event.currentTarget.style.display = 'none' }} />}</span><div className="account-avatar-controls"><ImageUploader label={t('Ảnh đại diện')} helperText={t('JPG, PNG hoặc WebP, tối đa 2 MB. Bạn có thể căn chỉnh vùng cắt vuông trước khi tải lên.')} multiple={false} disabled={busy} error={avatarError} onFiles={(files) => { if (files[0]) { setAvatarError(''); setAvatarFile(files[0]) } }} /><button className="link-button" type="button" disabled={!account?.avatar || busy} onClick={() => { setAvatarError(''); setConfirmAvatarDelete(true) }}>{t('Xóa ảnh đại diện')}</button>{!account?.avatar && <div className="account-avatar-colors" role="group" aria-label={t('Màu nền chữ cái đầu')}><span>{t('Màu nền chữ cái đầu')}</span>{avatarFallbackColors.map((color) => <button key={color} type="button" aria-label={t('Chọn màu {{color}}', { color })} aria-pressed={avatarFallbackColor === color} style={{ backgroundColor: color }} onClick={() => { setAvatarFallbackColor(color); try { if (account) { localStorage.setItem(`fashion-store:admin-avatar-fallback:${account.id}`, color); window.dispatchEvent(new CustomEvent('admin-avatar-fallback-change', { detail: { userId: account.id, color } })) } } catch { /* Local preferences can be unavailable in private browsing. */ } }} />)}</div>}</div></div>
      <div className="account-profile-readonly" aria-label={t('Thông tin tài khoản chỉ đọc')}><div><span>{t("Email")}</span><strong>{account?.email ?? '—'}</strong></div><div><span>{t('Vai trò')}</span><strong>{account?.role ?? '—'}</strong></div><div><span>{t('Mã nhân viên')}</span><strong>{account?.staff_code ?? '—'}</strong></div><div><span>{t('Trạng thái tài khoản')}</span><strong data-status={account?.status ?? 'unknown'}>{account ? t(accountStatusLabels[account.status ?? ''] ?? account.status ?? 'Không xác định') : '—'}</strong></div><div><span>{t('Ngày tạo')}</span><strong>{account?.created_at ? formatDateTime(account.created_at) : '—'}</strong></div><div><span>{t('Cập nhật gần nhất')}</span><strong>{account?.updated_at ? formatDateTime(account.updated_at) : '—'}</strong></div><div><span>{t('Người tạo tài khoản')}</span><strong>{account?.creator_name ?? '—'}</strong></div><div><span>{t('Lần đăng nhập gần nhất')}</span><strong>{account?.last_login_at ? formatDateTime(account.last_login_at) : t('Chưa ghi nhận')}</strong></div></div>
      <div className="account-settings-fields"><FormField id="account-profile-name" label={t('Họ và tên')} required error={profile.formState.errors.name?.message ? t(profile.formState.errors.name.message) : undefined}><input autoComplete="name" maxLength={255} {...profile.register('name')} /></FormField><FormField id="account-profile-phone" label={t('Số điện thoại')} error={profile.formState.errors.phone?.message ? t(profile.formState.errors.phone.message) : undefined}><input autoComplete="tel" {...profile.register('phone')} /></FormField><FormField id="account-profile-gender" label={t('Giới tính')} error={profile.formState.errors.gender?.message ? t(profile.formState.errors.gender.message) : undefined}><select {...profile.register('gender')}><option value="">{t('Chưa chọn')}</option><option value="female">{t('Nữ')}</option><option value="male">{t('Nam')}</option><option value="other">{t('Khác')}</option></select></FormField><FormField id="account-profile-birthday" label={t('Ngày sinh')} error={profile.formState.errors.birthday?.message ? t(profile.formState.errors.birthday.message) : undefined}><input type="date" max={maxBirthday} {...profile.register('birthday')} /></FormField><FormField id="account-profile-job-title" label={t('Chức danh')} error={profile.formState.errors.job_title?.message ? t(profile.formState.errors.job_title.message) : undefined}><input maxLength={100} {...profile.register('job_title')} /></FormField><FormField id="account-profile-department" label={t('Phòng ban')} error={profile.formState.errors.department?.message ? t(profile.formState.errors.department.message) : undefined}><select {...profile.register('department')}><option value="">{t('Chưa chọn')}</option><option value="operations">{t('Vận hành')}</option><option value="warehouse">{t('Kho')}</option><option value="customer_service">{t('Chăm sóc khách hàng')}</option><option value="marketing">{t("Tiếp thị")}</option><option value="accounting">{t('Kế toán')}</option><option value="other">{t('Khác')}</option></select></FormField><FormField id="account-profile-timezone" label={t('Múi giờ')} error={profile.formState.errors.timezone?.message ? t(profile.formState.errors.timezone.message) : undefined}><input placeholder="Asia/Ho_Chi_Minh" {...profile.register('timezone')} /></FormField><FormField id="account-profile-bio" label={t('Giới thiệu')} error={profile.formState.errors.bio?.message ? t(profile.formState.errors.bio.message) : undefined}><textarea rows={3} maxLength={500} {...profile.register('bio')} /></FormField><FormField id="account-profile-signature" label={t('Chữ ký')} error={profile.formState.errors.signature?.message ? t(profile.formState.errors.signature.message) : undefined}><textarea rows={2} maxLength={300} {...profile.register('signature')} /></FormField></div>
      <aside className="account-profile-preview" aria-label={t('Xem trước cách đồng nghiệp thấy tôi')}><span className="avatar profile-menu-avatar"><span className="avatar-fallback" style={{ backgroundColor: avatarFallbackColor }}>{profilePreview.name.trim().slice(0, 1).toUpperCase() || '?'}</span>{account?.avatar && <img src={mediaUrl(apiUrl, account.avatar)} alt="" />}</span><div><small>{t('Xem trước hồ sơ')}</small><strong>{profilePreview.name || t('Họ và tên')}</strong><span>{profilePreview.job_title || t('Chưa có chức danh')}</span><span>{t(account?.presence_status ?? 'available')}</span></div></aside>
      <div className="account-dialog-actions"><button className="secondary" type="button" disabled={!profile.formState.isDirty || busy} onClick={cancelProfileEdits}>{t('Hủy')}</button><button className="primary" disabled={!profile.formState.isDirty || busy}>{busy ? t('Đang lưu…') : t('Lưu hồ sơ')}</button></div>
    </form>}
    {!mustChangePassword && tab === 'security' && <div id="account-panel-security" role="tabpanel" tabIndex={0} aria-labelledby="account-tab-security"><IdleSessionSettings apiUrl={apiUrl} accessToken={accessToken} /><div className="account-security-grid"><section id="email" className="panel account-settings-form"><div className="panel-heading"><div><h3>{t('Email đăng nhập')}</h3><p>{account?.email}</p></div><span className="profile-role-badge">{account?.email_verified ? t('Đã xác thực') : t('Chưa xác thực')}</span></div>{account?.pending_email && <p role="status" className="account-settings-notice">{t('Đang chờ xác nhận email mới:')} <strong>{account.pending_email}</strong>. {t('Email hiện tại vẫn được dùng cho tới khi xác minh.')}</p>}{!account?.email_verified && <button type="button" className="secondary" onClick={() => void resendVerification()}>{t('Gửi lại email xác thực')}</button>}<EmailForm apiUrl={apiUrl} accessToken={accessToken} initialEmail={account?.email ?? ''} requireSudo={requireSudo} onChanged={(pendingEmail) => { setAccount((old) => ({ ...old!, pending_email: pendingEmail })); setNotice(t('Đã gửi liên kết xác nhận tới {{email}}. Email hiện tại vẫn đang hoạt động.', { email: pendingEmail })) }} onError={setError} /></section><form id="password" className="panel account-settings-form" onSubmit={savePassword}><h3>{t('Đổi mật khẩu')}</h3><FormField id="account-password-new" label={t('Mật khẩu mới')} required error={password.formState.errors.password?.message ? t(password.formState.errors.password.message) : undefined} controlAction={passwordVisibilityAction('new', 'account-password-new')}><input id="account-password-new" type={visiblePasswordFields.new ? 'text' : 'password'} autoComplete="new-password" {...password.register('password')} /></FormField><PasswordStrengthIndicator value={passwordDraft} current={currentPasswordDraft} t={t} /><FormField id="account-password-confirm" label={t('Nhập lại mật khẩu')} required error={password.formState.errors.password_confirmation?.message ? t(password.formState.errors.password_confirmation.message) : undefined} controlAction={passwordVisibilityAction('confirm', 'account-password-confirm')}><input id="account-password-confirm" type={visiblePasswordFields.confirm ? 'text' : 'password'} autoComplete="new-password" {...password.register('password_confirmation')} /></FormField><label className="account-logout-devices-option"><input type="checkbox" {...password.register('logout_other_devices')} /> {t('Đăng xuất các thiết bị khác sau khi đổi mật khẩu')}</label><p className="account-settings-help">{t('Mặc định bật để bảo vệ tài khoản. Chúng tôi sẽ gửi email thông báo sau khi đổi mật khẩu.')}</p><button className="primary" disabled={busy || !password.formState.isDirty}>{t('Cập nhật mật khẩu')}</button></form></div><TwoFactorPanel apiUrl={apiUrl} accessToken={accessToken} requireSudo={requireSudo} /></div>}
    {!mustChangePassword && tab === 'sessions' && <section id="account-panel-sessions" role="tabpanel" tabIndex={0} aria-labelledby="account-tab-sessions" className="panel account-settings-sessions"><div className="panel-heading"><div><h3>{t('Thiết bị đã đăng nhập')}</h3><p>{t('Đăng xuất thiết bị bạn không còn sử dụng.')}</p></div><button className="secondary" type="button" disabled={sessionsMeta.total < 2 || busy} onClick={() => void sessionAction('/account/sessions')}>{t('Đăng xuất thiết bị khác')}</button></div>{hasOtherSessionIp && <p className="account-session-ip-warning" role="status">{t('Có phiên đăng nhập đang hoạt động từ địa chỉ IP khác với thiết bị hiện tại. Nếu bạn không nhận ra thiết bị hoặc vị trí kết nối, hãy đăng xuất phiên đó hoặc tất cả thiết bị khác.')}</p>}<DataTable columns={sessionColumns} rows={sessions} rowKey={(session) => session.id} loading={loadingAccount} error={error || null} onRetry={() => void load()} emptyTitle={t('Chưa có phiên đăng nhập')} emptyDescription={t('Các phiên đang hoạt động sẽ xuất hiện tại đây.')} page={sessionsMeta.current_page} pageCount={sessionsMeta.last_page} totalRows={sessionsMeta.total} pageSize={sessionPageSize} onPageChange={(nextPage) => setSessionsUrlValue('page', String(nextPage))} onPageSizeChange={(nextSize) => { setSessionsUrlValue('page', '1'); publishAdminPageSize(nextSize, 'table') }} sortBy={sessionSortBy} sortDirection={sessionSortDirection} onSortChange={(key, direction) => { setSessionsUrlValue('sort', direction === 'none' ? '-last_used_at' : direction === 'desc' ? `-${key}` : key); setSessionsUrlValue('page', '1') }} /></section>}
    <ConfirmDialog open={Boolean(sessionActionPath)} title={t('Đăng xuất phiên đã chọn?')} description={sessionActionPath === '/account/sessions' ? t('Tất cả thiết bị khác sẽ cần đăng nhập lại.') : t('Thiết bị này sẽ cần đăng nhập lại.')} confirmLabel={t('Đăng xuất')} onConfirm={() => void confirmSessionAction()} onOpenChange={(next) => { if (!next && !busy) setSessionActionPath(null) }} busy={busy} />
    <ConfirmDialog open={reportedSessionId !== null} title={t('Báo cáo phiên đăng nhập lạ?')} description={t('Phiên này sẽ bị thu hồi ngay. Bạn sẽ cần đổi mật khẩu trước khi tiếp tục; sau đó hãy bật xác thực hai yếu tố.')} confirmLabel={t('Thu hồi và bảo vệ tài khoản')} onConfirm={() => void confirmReportSession()} onOpenChange={(next) => { if (!next && !busy) setReportedSessionId(null) }} busy={busy} />
    <ConfirmDialog open={confirmAvatarDelete} title={t('Xóa ảnh đại diện?')} description={<>{avatarError ? <p role="alert" className="account-form-error">{avatarError}</p> : t('Ảnh đại diện hiện tại sẽ bị xóa khỏi tài khoản của bạn.')}</>} confirmLabel={t('Xóa ảnh')} onConfirm={() => void deleteAvatar()} onOpenChange={(next) => { if (!next && !busy) { setConfirmAvatarDelete(false); setAvatarError('') } }} busy={busy} />
    {avatarFile && <AvatarCropDialog file={avatarFile} busy={busy} error={avatarError} onCrop={uploadAvatar} onCancel={closeAvatarCrop} />}
  </section>
}

function EmailForm({ apiUrl, accessToken, initialEmail, requireSudo, onChanged, onError }: { apiUrl: string; accessToken: string; initialEmail: string; requireSudo: (action: () => void | Promise<void>) => void; onChanged: (pendingEmail: string) => void; onError: (message: string) => void }) {
  const { t } = useTranslation()
  const schema = z.object({ email: z.string().email(t('Nhập email hợp lệ.')) })
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema), values: { email: initialEmail } })
  useUnsavedFormGuard(form.formState.isDirty)
  return <form className="account-settings-inline-form" onSubmit={form.handleSubmit((values) => requireSudo(async () => { try { const response = await adminApiFetch(`${apiUrl}/account/email`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const body = await response.json() as { data?: { email: string; pending_email?: string }; message?: string; errors?: Record<string, string[]> }; if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể yêu cầu đổi email.')); onChanged(body.data?.pending_email ?? values.email); form.reset({ email: body.data?.email ?? initialEmail }) } catch (e) { applyServerValidationErrors(form, e); onError(e instanceof Error ? t(e.message) : t('Không thể yêu cầu đổi email.')) } }))}><FormField id="account-email-new" label={t('Email mới')} required error={form.formState.errors.email?.message ? t(form.formState.errors.email.message) : undefined}><input type="email" autoComplete="email" {...form.register('email')} /></FormField><button className="primary" disabled={!form.formState.isDirty || form.formState.isSubmitting}>{t('Gửi liên kết xác nhận')}</button></form>
}
