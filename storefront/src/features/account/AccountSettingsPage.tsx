import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useBlocker } from 'react-router'
import './SessionRevocationDialog.css'
import { PersonalDataExportPanel } from './PersonalDataExportPanel'
import { AccountPhoneChangePanel } from './AccountPhoneChangePanel'
import { AvatarCropDialog } from './AvatarCropDialog'
import { PasskeySettingsPanel } from './PasskeySettingsPanel'
import {
  deleteAccount,
  deleteAccountAvatar,
  getAccountProfile,
  getAccountSessions,
  requestAccountEmailChange,
  resendAccountVerification,
  revokeAccountSession,
  revokeOtherAccountSessions,
  updateAccountPassword,
  updateAccountProfile,
  uploadAccountAvatar,
  AccountValidationError,
  type AccountProfile,
  type AccountSession,
} from './account-settings-api'

type Account = AccountProfile
type Session = AccountSession
type AccountSettingsData = { account: Account; sessions: Session[] }
type SessionRevocation = { path: '/account/sessions' | `/account/sessions/${number}`; mode: 'single' | 'others'; deviceName?: string; deviceDetails?: string }
const accountSettingsQueryKey = (customerId: number | null) => ['account', 'settings', customerId] as const
function sessionDeviceLabel(session: Session): string {
  return [session.browser && `${session.browser}${session.browser_version ? ` ${session.browser_version}` : ''}`, session.operating_system, session.device_type].filter(Boolean).join(' · ')
}
const measurement = (min: number, max: number, unit: string) => z.string().refine((value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max), `Nhập số đo từ ${min} đến ${max} ${unit}.`)
const profileSchema = z.object({ name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự.').max(255, 'Tối đa 255 ký tự.'), gender: z.enum(['', 'male', 'female', 'other']), birthday: z.string(), height_cm: measurement(50, 250, 'cm'), weight_kg: measurement(10, 300, 'kg'), bust_cm: measurement(30, 200, 'cm'), waist_cm: measurement(30, 200, 'cm'), hip_cm: measurement(30, 200, 'cm') })
const emailSchema = z.object({ email: z.string().email('Nhập email hợp lệ.'), current_password: z.string().min(1, 'Nhập mật khẩu hiện tại.') })
const passwordSchema = z.object({ current_password: z.string().min(1, 'Nhập mật khẩu hiện tại.'), password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').regex(/[A-Za-z]/, 'Cần có chữ cái.').regex(/[0-9]/, 'Cần có chữ số.'), password_confirmation: z.string() }).refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Mật khẩu nhập lại chưa khớp.' })
const deleteSchema = z.object({ password: z.string().min(1, 'Nhập mật khẩu để xác nhận.') })
type ProfileValues = z.infer<typeof profileSchema>
type EmailValues = z.infer<typeof emailSchema>
type PasswordValues = z.infer<typeof passwordSchema>
const maxBirthday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

export function AccountSettingsPage({ accessToken, customerId, onAccountUpdated, onDeleted }: { accessToken: string; customerId: number | null; onAccountUpdated: (account: Partial<Account>) => void; onDeleted: () => void }) {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({
    queryKey: accountSettingsQueryKey(customerId),
    queryFn: async ({ signal }) => {
      const [account, sessions] = await Promise.all([
        getAccountProfile(accessToken, signal),
        getAccountSessions(accessToken, signal),
      ])
      return { account, sessions }
    },
    enabled: Boolean(accessToken && customerId),
  })
  const account = settingsQuery.data?.account ?? null
  const sessions = settingsQuery.data?.sessions ?? []
  const [tab, setTab] = useState<'profile' | 'phone' | 'email' | 'password' | 'passkeys' | 'sessions' | 'privacy' | 'delete'>('profile')
  const [emailFieldReady, setEmailFieldReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sessionRevocation, setSessionRevocation] = useState<SessionRevocation | null>(null)
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false)
  const [avatarDeletionOpen, setAvatarDeletionOpen] = useState(false)
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null)
  const sessionRevocationDialogRef = useRef<HTMLDialogElement>(null)
  const sessionRevocationCancelRef = useRef<HTMLButtonElement>(null)
  const sessionHeadingRef = useRef<HTMLHeadingElement>(null)
  const sessionRevocationTriggerRef = useRef<HTMLElement | null>(null)
  const accountDeletionDialogRef = useRef<HTMLDialogElement>(null)
  const accountDeletionCancelRef = useRef<HTMLButtonElement>(null)
  const accountDeletionTriggerRef = useRef<HTMLButtonElement | null>(null)
  const accountDeletionPasswordRef = useRef<HTMLInputElement>(null)
  const avatarDeletionDialogRef = useRef<HTMLDialogElement>(null)
  const avatarDeletionCancelRef = useRef<HTMLButtonElement>(null)
  const avatarDeletionTriggerRef = useRef<HTMLButtonElement | null>(null)
  const avatarDeletionCompletedRef = useRef(false)
  const accountSettingsHeadingRef = useRef<HTMLHeadingElement>(null)
  const navigationBlockerDialogRef = useRef<HTMLDialogElement>(null)
  const navigationBlockerCancelRef = useRef<HTMLButtonElement>(null)
  const navigationBlockerTriggerRef = useRef<HTMLElement | null>(null)
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', gender: '', birthday: '', height_cm: '', weight_kg: '', bust_cm: '', waist_cm: '', hip_cm: '' },
  })
  const { reset: resetProfileForm } = profileForm
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', current_password: '' },
  })
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { current_password: '', password: '', password_confirmation: '' } })
  const deleteForm = useForm<{ password: string }>({ resolver: zodResolver(deleteSchema), defaultValues: { password: '' } })
  useEffect(() => {
    if (!account) return
    resetProfileForm({
      name: account.name ?? '',
      gender: (account.gender as ProfileValues['gender']) ?? '',
      birthday: account.birthday ?? '',
      height_cm: account.height_cm?.toString() ?? '',
      weight_kg: account.weight_kg?.toString() ?? '',
      bust_cm: account.bust_cm?.toString() ?? '',
      waist_cm: account.waist_cm?.toString() ?? '',
      hip_cm: account.hip_cm?.toString() ?? '',
    })
  }, [account, resetProfileForm])
  const deletePasswordField = deleteForm.register('password')
  const newPassword = useWatch({ control: passwordForm.control, name: 'password' })
  const currentPassword = useWatch({ control: passwordForm.control, name: 'current_password' })
  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', valid: newPassword.length >= 8 },
    { label: 'Có chữ cái', valid: /[A-Za-z]/.test(newPassword) },
    { label: 'Có chữ số', valid: /[0-9]/.test(newPassword) },
    { label: 'Nên có ký tự đặc biệt', valid: /[^A-Za-z0-9]/.test(newPassword) },
    { label: 'Khác mật khẩu hiện tại', valid: Boolean(newPassword) && newPassword !== currentPassword },
  ]
  const passwordStrength = passwordChecks.slice(0, 4).filter((check) => check.valid).length
  const hasUnsavedChanges = profileForm.formState.isDirty || emailForm.formState.isDirty || passwordForm.formState.isDirty || deleteForm.formState.isDirty
  const navigationBlocker = useBlocker(hasUnsavedChanges)
  useEffect(() => {
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeave)
    return () => window.removeEventListener('beforeunload', warnBeforeLeave)
  }, [hasUnsavedChanges])
  useEffect(() => {
    const dialog = navigationBlockerDialogRef.current
    if (!dialog) return
    if (navigationBlocker.state === 'blocked') {
      const activeElement = document.activeElement
      navigationBlockerTriggerRef.current = activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : accountSettingsHeadingRef.current
      if (!dialog.open) {
        dialog.showModal()
        navigationBlockerCancelRef.current?.focus()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  }, [navigationBlocker.state])
  useEffect(() => {
    const dialog = sessionRevocationDialogRef.current
    if (!dialog) return
    if (sessionRevocation && !dialog.open) {
      dialog.showModal()
      sessionRevocationCancelRef.current?.focus()
    } else if (!sessionRevocation && dialog.open) {
      dialog.close()
    }
  }, [sessionRevocation])
  useEffect(() => {
    const dialog = accountDeletionDialogRef.current
    if (!dialog) return
    if (accountDeletionOpen && !dialog.open) {
      dialog.showModal()
      accountDeletionCancelRef.current?.focus()
    } else if (!accountDeletionOpen && dialog.open) {
      dialog.close()
    }
  }, [accountDeletionOpen])
  useEffect(() => {
    const dialog = avatarDeletionDialogRef.current
    if (!dialog) return
    if (avatarDeletionOpen && !dialog.open) {
      dialog.showModal()
      avatarDeletionCancelRef.current?.focus()
    } else if (!avatarDeletionOpen && dialog.open) {
      dialog.close()
    }
  }, [avatarDeletionOpen])
  const submitMutation = useMutation({
    mutationFn: async ({ path, values }: { path: 'profile' | 'email' | 'password' | 'delete'; values: ProfileValues | EmailValues | PasswordValues | { password: string } }) => {
      setError(''); setMessage('')
      if (path === 'profile') {
        const input = values as ProfileValues
        const body = await updateAccountProfile(accessToken, { ...input, gender: input.gender || null, birthday: input.birthday || null, height_cm: input.height_cm ? Number(input.height_cm) : null, weight_kg: input.weight_kg ? Number(input.weight_kg) : null, bust_cm: input.bust_cm ? Number(input.bust_cm) : null, waist_cm: input.waist_cm ? Number(input.waist_cm) : null, hip_cm: input.hip_cm ? Number(input.hip_cm) : null })
        queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? { ...old, account: { ...old.account, ...body.data } } : old); onAccountUpdated(body.data)
        profileForm.reset({ name: body.data.name ?? '', gender: (body.data.gender ?? '') as ProfileValues['gender'], birthday: body.data.birthday ?? '', height_cm: body.data.height_cm?.toString() ?? '', weight_kg: body.data.weight_kg?.toString() ?? '', bust_cm: body.data.bust_cm?.toString() ?? '', waist_cm: body.data.waist_cm?.toString() ?? '', hip_cm: body.data.hip_cm?.toString() ?? '' })
        setMessage('Đã lưu hồ sơ.')
      }
      if (path === 'email') {
        const body = await requestAccountEmailChange(accessToken, values as EmailValues)
        queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? { ...old, account: { ...old.account, email_verified: body.data.email_verified, pending_email: body.data.pending_email } } : old)
        onAccountUpdated({ email: body.data.email }); emailForm.reset({ email: '', current_password: '' }); setMessage(body.message)
      }
      if (path === 'password') { const body = await updateAccountPassword(accessToken, values as PasswordValues); passwordForm.reset(); setMessage(body.message); await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(customerId) }) }
      if (path === 'delete') { const body = await deleteAccount(accessToken, (values as { password: string }).password); setMessage(body.message); queryClient.removeQueries({ queryKey: accountSettingsQueryKey(customerId) }); deleteForm.reset({ password: '' }); setAccountDeletionOpen(false); onDeleted() }
    },
    onError: (e, { path }) => {
      if (e instanceof AccountValidationError) {
        const unmapped: string[] = []
        for (const [field, messages] of Object.entries(e.fields)) {
          const message = messages[0] ?? 'Giá trị chưa hợp lệ.'
          if (path === 'profile' && ['name', 'gender', 'birthday', 'height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hip_cm'].includes(field)) {
            profileForm.setError(field as keyof ProfileValues, { type: 'server', message })
          } else if (path === 'email' && ['email', 'current_password'].includes(field)) {
            emailForm.setError(field as keyof EmailValues, { type: 'server', message })
          } else if (path === 'password' && ['current_password', 'password', 'password_confirmation'].includes(field)) {
            passwordForm.setError(field as keyof PasswordValues, { type: 'server', message })
          } else if (path === 'delete' && field === 'password') {
            deleteForm.setError('password', { type: 'server', message })
            setAccountDeletionOpen(false)
            window.requestAnimationFrame(() => accountDeletionPasswordRef.current?.focus())
          } else {
            unmapped.push(`${field}: ${message}`)
          }
        }
        setError(unmapped.join(' · '))
      } else {
        setError(e instanceof Error ? e.message : 'Không thể cập nhật tài khoản.')
      }
    },
  })
  const submit = (path: 'profile' | 'email' | 'password' | 'delete', values: ProfileValues | EmailValues | PasswordValues | { password: string }) => submitMutation.mutate({ path, values })
  const avatarUploadMutation = useMutation({
    mutationFn: (file: File) => uploadAccountAvatar(accessToken, file),
    onMutate: () => { setError(''); setMessage('') },
    onSuccess: (body) => {
      queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? { ...old, account: { ...old.account, avatar: body.data.avatar } } : old)
      onAccountUpdated(body.data); setMessage('Đã cập nhật ảnh đại diện.')
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Không tải được ảnh.'),
  })
  const accountActionMutation = useMutation({
    mutationFn: async (path: '/account/avatar' | '/account/sessions' | `/account/sessions/${number}`) => {
      setError(''); setMessage('')
      const body = path === '/account/avatar' ? await deleteAccountAvatar(accessToken) : path === '/account/sessions' ? await revokeOtherAccountSessions(accessToken) : await revokeAccountSession(accessToken, Number(path.split('/').at(-1)))
      if (path === '/account/avatar') {
        queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? { ...old, account: { ...old.account, avatar: null } } : old)
        onAccountUpdated({ avatar: null })
        setMessage('message' in body ? body.message : 'Đã cập nhật.')
        avatarDeletionCompletedRef.current = true
        setAvatarDeletionOpen(false)
      } else {
        queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? {
          ...old,
          sessions: path === '/account/sessions'
            ? old.sessions.filter((session) => session.is_current)
            : old.sessions.filter((session) => session.id !== Number(path.split('/').at(-1))),
        } : old)
        void queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(customerId) })
        setMessage('message' in body ? body.message : 'Đã cập nhật.')
        sessionRevocationTriggerRef.current = sessionHeadingRef.current
        setSessionRevocation(null)
      }
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Không thể thực hiện thao tác.'),
  })
  const resendVerificationMutation = useMutation({
    mutationFn: () => resendAccountVerification(accessToken),
    onMutate: () => { setError(''); setMessage('') },
    onSuccess: (body) => setMessage(body.message),
    onError: (e) => setError(e instanceof Error ? e.message : 'Không gửi được email.'),
  })
  const busy = submitMutation.isPending || avatarUploadMutation.isPending || accountActionMutation.isPending || resendVerificationMutation.isPending
  const uploadAvatar = (file?: File, input?: HTMLInputElement) => {
    if (input) input.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 2 MB.')
      return
    }
    setError('')
    setMessage('')
    setAvatarCropFile(file)
  }
  const cancelAvatarCrop = () => {
    setAvatarCropFile(null)
  }
  const uploadCroppedAvatar = async (file: File): Promise<boolean> => {
    try {
      await avatarUploadMutation.mutateAsync(file)
      cancelAvatarCrop()
      return true
    } catch {
      return false
    }
  }
  const requestAvatarDeletion = (trigger: HTMLButtonElement) => {
    avatarDeletionTriggerRef.current = trigger
    setError('')
    setMessage('')
    avatarDeletionCompletedRef.current = false
    setAvatarDeletionOpen(true)
  }
  const closeAvatarDeletion = () => {
    if (!accountActionMutation.isPending) {
      setError('')
      setAvatarDeletionOpen(false)
    }
  }
  const requestSessionRevocation = (path: SessionRevocation['path'], trigger: HTMLButtonElement, session?: Session) => {
    sessionRevocationTriggerRef.current = trigger
    setError('')
    setMessage('')
    setSessionRevocation(path === '/account/sessions'
      ? { path, mode: 'others' }
      : { path, mode: 'single', deviceName: session?.name || 'Trình duyệt / thiết bị', deviceDetails: session ? sessionDeviceLabel(session) : '' })
  }
  const closeSessionRevocation = () => {
    if (!accountActionMutation.isPending) setSessionRevocation(null)
  }
  const closeAccountDeletion = () => {
    if (submitMutation.isPending) return
    deleteForm.reset({ password: '' })
    setError('')
    setAccountDeletionOpen(false)
  }
  const labels = { name: 'Họ và tên', phone: 'Số điện thoại', gender: 'Giới tính', birthday: 'Ngày sinh', height_cm: 'Chiều cao (cm)', weight_kg: 'Cân nặng (kg)', bust_cm: 'Vòng ngực (cm)', waist_cm: 'Vòng eo (cm)', hip_cm: 'Vòng hông (cm)', email: 'Email mới', current_password: 'Mật khẩu hiện tại', password: 'Mật khẩu mới', password_confirmation: 'Nhập lại mật khẩu', password_delete: 'Mật khẩu xác nhận' }
  if (!account && settingsQuery.isError) return <div className="container subpage account-page"><Link className="back-link" to="/account">← Tài khoản</Link><div className="auth-error" role="alert"><p>{settingsQuery.error.message}</p><button className="button dark" type="button" onClick={() => void settingsQuery.refetch()}>{"Th\u1eed l\u1ea1i"}</button></div></div>
  if (!account) return <div className="container subpage account-page"><Link className="back-link" to="/account">← Tài khoản</Link><p className="state" role="status">Đang tải cài đặt tài khoản…</p></div>
  return <div className="container subpage account-page account-settings">
    <p className="eyebrow">THÔNG TIN VÀ BẢO MẬT</p><h1 ref={accountSettingsHeadingRef} tabIndex={-1}>Cài đặt tài khoản</h1>
    <nav className="account-settings-nav" aria-label="Mục cài đặt">{Object.entries({ profile: 'Hồ sơ', phone: 'Số điện thoại', email: 'Email', password: 'Mật khẩu', passkeys: 'Passkey', sessions: 'Phiên đăng nhập', privacy: 'Quyền riêng tư', delete: 'Xóa tài khoản' }).map(([key, label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} aria-current={tab === key ? 'page' : undefined} onClick={() => { setTab(key as typeof tab); setError(''); setMessage('') }}>{label}</button>)}</nav>
    {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="account-settings-message" role="status">{message}</p>}
    {tab === 'profile' && <section className="account-settings-card"><div className="account-settings-avatar">{account.avatar ? <img src={account.avatar} alt="Ảnh đại diện" /> : account.name.slice(0, 1).toUpperCase()}</div><div className="account-settings-avatar-actions"><label className="button light">Chọn ảnh<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadAvatar(e.target.files?.[0], e.currentTarget)} /></label><button className="link-button" type="button" disabled={!account?.avatar || busy} onClick={(event) => requestAvatarDeletion(event.currentTarget)}>Xóa ảnh</button><small>JPG, PNG, WebP; tối đa 2 MB. Có thể cắt ảnh vuông trước khi tải lên.</small></div><form className="auth-form account-settings-form" onSubmit={profileForm.handleSubmit((values) => void submit('profile', values))}><label>{labels.name}<input id="account-profile-name" aria-invalid={Boolean(profileForm.formState.errors.name)} aria-describedby={profileForm.formState.errors.name ? 'account-profile-name-error' : undefined} {...profileForm.register('name')} autoComplete="name" />{profileForm.formState.errors.name && <small id="account-profile-name-error" role="alert" className="field-error">{profileForm.formState.errors.name.message}</small>}</label><label>Số điện thoại<input id="account-profile-phone" type="tel" autoComplete="tel" value={account.phone ?? ''} readOnly aria-describedby="account-profile-phone-status" /></label><p id="account-profile-phone-status" className="account-settings-hint">{account.phone ? account.phone_verified_at ? 'Đã xác minh' : 'Chưa xác minh' : 'Chưa thêm số điện thoại.'} <button className="link-button" type="button" onClick={() => setTab('phone')}>{account.phone_verified_at ? 'Đổi số' : account.phone ? 'Xác minh số' : 'Thêm số điện thoại'}</button></p><label>{labels.gender}<select id="account-profile-gender" aria-invalid={Boolean(profileForm.formState.errors.gender)} aria-describedby={profileForm.formState.errors.gender ? 'account-profile-gender-error' : undefined} {...profileForm.register('gender')}><option value="">Chưa chọn</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select>{profileForm.formState.errors.gender && <small id="account-profile-gender-error" role="alert" className="field-error">{profileForm.formState.errors.gender.message}</small>}</label><label>{labels.birthday}<input id="account-profile-birthday" aria-invalid={Boolean(profileForm.formState.errors.birthday)} aria-describedby={profileForm.formState.errors.birthday ? 'account-profile-birthday-error' : undefined} {...profileForm.register('birthday')} type="date" max={maxBirthday} />{profileForm.formState.errors.birthday && <small id="account-profile-birthday-error" role="alert" className="field-error">{profileForm.formState.errors.birthday.message}</small>}</label><label>{labels.height_cm}<input id="account-profile-height" type="number" min="50" max="250" step="0.1" inputMode="decimal" {...profileForm.register('height_cm')} /></label><label>{labels.weight_kg}<input id="account-profile-weight" type="number" min="10" max="300" step="0.1" inputMode="decimal" {...profileForm.register('weight_kg')} /></label><label>{labels.bust_cm}<input id="account-profile-bust" type="number" min="30" max="200" step="0.1" inputMode="decimal" {...profileForm.register('bust_cm')} /></label><label>{labels.waist_cm}<input id="account-profile-waist" type="number" min="30" max="200" step="0.1" inputMode="decimal" {...profileForm.register('waist_cm')} /></label><label>{labels.hip_cm}<input id="account-profile-hip" type="number" min="30" max="200" step="0.1" inputMode="decimal" {...profileForm.register('hip_cm')} /></label>{Object.values(profileForm.formState.errors).some(Boolean) && <div role="alert">{Object.values(profileForm.formState.errors).map((fieldError, index) => fieldError?.message ? <p key={index}>{fieldError.message}</p> : null)}</div>}<button className="button dark" disabled={!profileForm.formState.isDirty || busy}>Lưu hồ sơ</button></form></section>}
    {tab === 'phone' && <AccountPhoneChangePanel accessToken={accessToken} currentPhone={account.phone ?? null} onVerified={(updated) => { queryClient.setQueryData<AccountSettingsData>(accountSettingsQueryKey(customerId), (old) => old ? { ...old, account: { ...old.account, ...updated } } : old); onAccountUpdated(updated) }} />}
    {tab === 'passkeys' && <PasskeySettingsPanel accessToken={accessToken} customerId={customerId} />}
    {tab === 'email' && <section className="account-settings-card"><img className="account-email-illustration" src="/illustrations/email-notice.svg" alt="" /><h2>Email đăng nhập</h2><p>{account?.email} · {account?.email_verified ? 'Đã xác thực' : 'Chưa xác thực'}</p>{!account?.email_verified && <button className="button light" type="button" disabled={busy} onClick={() => resendVerificationMutation.mutate()}>Gửi lại email xác thực</button>}<form className="auth-form account-settings-form" autoComplete="off" onSubmit={emailForm.handleSubmit((values) => void submit('email', values))}><label>{labels.email}<input id="account-email" aria-invalid={Boolean(emailForm.formState.errors.email)} aria-describedby={emailForm.formState.errors.email ? 'account-email-error' : undefined} {...emailForm.register('email')} type="email" readOnly={!emailFieldReady} onFocus={() => setEmailFieldReady(true)} autoComplete="off" />{emailForm.formState.errors.email && <small id="account-email-error" role="alert" className="field-error">{emailForm.formState.errors.email.message}</small>}</label><label>{labels.current_password}<input id="account-email-current-password" aria-invalid={Boolean(emailForm.formState.errors.current_password)} aria-describedby={emailForm.formState.errors.current_password ? 'account-email-current-password-error' : undefined} {...emailForm.register('current_password')} type="password" autoComplete="current-password" />{emailForm.formState.errors.current_password && <small id="account-email-current-password-error" role="alert" className="field-error">{emailForm.formState.errors.current_password.message}</small>}</label><button className="button dark" disabled={busy}>Đổi email</button></form></section>}
    {tab === 'password' && <section className="account-settings-card"><h2>Đổi mật khẩu</h2><p>Mật khẩu cần ít nhất 8 ký tự, có chữ và số.</p><div className="recovery-strength" role="meter" aria-label="Độ mạnh mật khẩu" aria-valuemin={0} aria-valuemax={4} aria-valuenow={passwordStrength} aria-valuetext={passwordStrength <= 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : passwordStrength === 3 ? 'Tốt' : 'Mạnh'}><div>{[1, 2, 3, 4].map((level) => <i key={level} className={passwordStrength >= level ? 'filled' : ''} />)}</div><span>{passwordStrength <= 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : passwordStrength === 3 ? 'Tốt' : 'Mạnh'}</span></div><ul className="recovery-checklist">{passwordChecks.map((check) => <li key={check.label} data-valid={check.valid}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul><form className="auth-form account-settings-form" onSubmit={passwordForm.handleSubmit((values) => void submit('password', values))}><label>{labels.current_password}<input id="account-password-current-password" aria-invalid={Boolean(passwordForm.formState.errors.current_password)} aria-describedby={passwordForm.formState.errors.current_password ? 'account-password-current-password-error' : undefined} {...passwordForm.register('current_password')} type="password" autoComplete="current-password" />{passwordForm.formState.errors.current_password && <small id="account-password-current-password-error" role="alert" className="field-error">{passwordForm.formState.errors.current_password.message}</small>}</label><label>{labels.password}<input id="account-password-new-password" aria-invalid={Boolean(passwordForm.formState.errors.password)} aria-describedby={passwordForm.formState.errors.password ? 'account-password-new-password-error' : undefined} {...passwordForm.register('password')} type="password" autoComplete="new-password" />{passwordForm.formState.errors.password && <small id="account-password-new-password-error" role="alert" className="field-error">{passwordForm.formState.errors.password.message}</small>}</label><label>{labels.password_confirmation}<input id="account-password-confirmation" aria-invalid={Boolean(passwordForm.formState.errors.password_confirmation)} aria-describedby={passwordForm.formState.errors.password_confirmation ? 'account-password-confirmation-error' : undefined} {...passwordForm.register('password_confirmation')} type="password" autoComplete="new-password" />{passwordForm.formState.errors.password_confirmation && <small id="account-password-confirmation-error" role="alert" className="field-error">{passwordForm.formState.errors.password_confirmation.message}</small>}</label><button className="button dark" disabled={busy}>Cập nhật mật khẩu</button></form></section>}
    {tab === 'sessions' && <section className="account-settings-card"><div className="account-settings-heading"><div><h2 ref={sessionHeadingRef} tabIndex={-1}>Phiên đăng nhập</h2><p>Quản lý các thiết bị đã đăng nhập tài khoản.</p></div><button className="button light" type="button" disabled={busy || !sessions.some((s) => !s.is_current)} onClick={(event) => requestSessionRevocation('/account/sessions', event.currentTarget)}>Đăng xuất thiết bị khác</button></div>{sessions.map((session) => <article className="account-settings-session" key={session.id}><div><b>{session.name || 'Trình duyệt / thiết bị'}</b>{session.is_current && <span className="default-address">Thiết bị này</span>}<small>{sessionDeviceLabel(session)}</small>{session.ip && <small>Địa chỉ IP: {session.ip}</small>}<small>Tạo {new Date(session.created_at).toLocaleString('vi-VN')} · Hoạt động gần nhất: {session.last_used_at ? new Date(session.last_used_at).toLocaleString('vi-VN') : 'chưa ghi nhận'}</small></div>{!session.is_current && <button className="link-button" type="button" aria-label={`Đăng xuất phiên ${session.name || sessionDeviceLabel(session)}`} disabled={busy} onClick={(event) => requestSessionRevocation(`/account/sessions/${session.id}`, event.currentTarget, session)}>Đăng xuất</button>}</article>)}{!sessions.length && <p>Không có phiên đăng nhập.</p>}</section>}
    {tab === 'privacy' && <PersonalDataExportPanel accessToken={accessToken} customerId={customerId} />}
    {tab === 'delete' && <section className="account-settings-card account-delete-card"><h2>Xóa tài khoản</h2><p>Thao tác này sẽ vô hiệu hóa tài khoản và đăng xuất các thiết bị. Bạn không thể đăng nhập lại bằng tài khoản này.</p><form className="auth-form account-settings-form" onSubmit={deleteForm.handleSubmit(() => { setError(''); setMessage(''); setAccountDeletionOpen(true) })}><label>{labels.password_delete}<input id="account-delete-password" aria-invalid={Boolean(deleteForm.formState.errors.password)} aria-describedby={deleteForm.formState.errors.password ? 'account-delete-password-error' : undefined} {...deletePasswordField} ref={(element) => { (deletePasswordField.ref as ((target: HTMLInputElement | null) => void) | undefined)?.(element); accountDeletionPasswordRef.current = element }} type="password" autoComplete="current-password" />{deleteForm.formState.errors.password && <small id="account-delete-password-error" role="alert" className="field-error">{deleteForm.formState.errors.password.message}</small>}</label><button ref={accountDeletionTriggerRef} className="button danger" disabled={busy}>Xóa tài khoản</button></form></section>}
    <dialog ref={navigationBlockerDialogRef} className="session-revocation-dialog" aria-labelledby="unsaved-navigation-title" aria-describedby="unsaved-navigation-description" onCancel={(event) => { event.preventDefault(); navigationBlocker.reset?.() }} onClose={() => window.requestAnimationFrame(() => navigationBlockerTriggerRef.current?.focus())}>
      {navigationBlocker.state === 'blocked' && <>
        <p className="eyebrow">THAY ĐỔI CHƯA LƯU</p>
        <h2 id="unsaved-navigation-title">Rời trang cài đặt?</h2>
        <p id="unsaved-navigation-description">Các thay đổi bạn vừa nhập chưa được lưu. Nếu rời trang, những thay đổi này sẽ bị bỏ.</p>
        <div className="session-revocation-actions">
          <button ref={navigationBlockerCancelRef} type="button" className="button light" onClick={() => navigationBlocker.reset()}>Ở lại trang</button>
          <button type="button" className="button danger" onClick={() => navigationBlocker.proceed()}>Rời trang và bỏ thay đổi</button>
        </div>
      </>}
    </dialog>
    <dialog ref={accountDeletionDialogRef} className="session-revocation-dialog" aria-labelledby="account-delete-title" aria-describedby="account-delete-description" onCancel={(event) => { event.preventDefault(); closeAccountDeletion() }} onClose={() => window.requestAnimationFrame(() => accountDeletionTriggerRef.current?.focus())}>
      {accountDeletionOpen && <>
        <p className="eyebrow">XÓA TÀI KHOẢN</p>
        <h2 id="account-delete-title">Xác nhận xóa tài khoản?</h2>
        <p id="account-delete-description">Tài khoản sẽ bị vô hiệu hóa và các thiết bị sẽ bị đăng xuất. Bạn sẽ không thể đăng nhập lại bằng tài khoản này.</p>
        {submitMutation.isError && submitMutation.variables?.path === 'delete' && error && <p className="auth-error" role="alert">{error}</p>}
        <div className="session-revocation-actions">
          <button ref={accountDeletionCancelRef} type="button" className="button light" disabled={busy} onClick={closeAccountDeletion}>Giữ tài khoản</button>
          <button type="button" className="button danger" disabled={busy} onClick={() => void deleteForm.handleSubmit((values) => void submit('delete', values))()}>
            {submitMutation.isPending && submitMutation.variables?.path === 'delete' ? 'Đang xóa tài khoản…' : 'Xác nhận xóa tài khoản'}
          </button>
        </div>
      </>}
    </dialog>
    <dialog ref={avatarDeletionDialogRef} className="session-revocation-dialog" aria-labelledby="avatar-delete-title" aria-describedby="avatar-delete-description" onCancel={(event) => { event.preventDefault(); closeAvatarDeletion() }} onClose={() => window.requestAnimationFrame(() => avatarDeletionCompletedRef.current ? accountSettingsHeadingRef.current?.focus() : avatarDeletionTriggerRef.current?.focus())}>
      {avatarDeletionOpen && <>
        <p className="eyebrow">ẢNH ĐẠI DIỆN</p>
        <h2 id="avatar-delete-title">Xóa ảnh đại diện?</h2>
        <p id="avatar-delete-description">Ảnh đại diện hiện tại sẽ bị gỡ khỏi tài khoản của bạn.</p>
        {accountActionMutation.isError && accountActionMutation.variables === '/account/avatar' && error && <p className="auth-error" role="alert">{error}</p>}
        <div className="session-revocation-actions">
          <button ref={avatarDeletionCancelRef} type="button" className="button light" disabled={busy} onClick={closeAvatarDeletion}>Giữ ảnh</button>
          <button type="button" className="button danger" disabled={busy} onClick={() => accountActionMutation.mutate('/account/avatar')}>
            {accountActionMutation.isPending && accountActionMutation.variables === '/account/avatar' ? 'Đang xóa ảnh…' : 'Xác nhận xóa ảnh'}
          </button>
        </div>
      </>}
    </dialog>
    <dialog ref={sessionRevocationDialogRef} className="session-revocation-dialog" aria-labelledby="session-revocation-title" aria-describedby="session-revocation-description" onCancel={(event) => { event.preventDefault(); closeSessionRevocation() }} onClose={() => { setSessionRevocation(null); window.requestAnimationFrame(() => sessionRevocationTriggerRef.current?.focus()) }}>
      {sessionRevocation && <>
        <p className="eyebrow">BẢO MẬT TÀI KHOẢN</p>
        <h2 id="session-revocation-title">{sessionRevocation.mode === 'single' ? 'Đăng xuất thiết bị này?' : 'Đăng xuất các thiết bị khác?'}</h2>
        <p id="session-revocation-description">{sessionRevocation.mode === 'single'
          ? <>Phiên <strong>{sessionRevocation.deviceName}</strong>{sessionRevocation.deviceDetails && ` · ${sessionRevocation.deviceDetails}`} sẽ bị đăng xuất. Thiết bị đang dùng vẫn được giữ đăng nhập.</>
          : 'Mọi phiên khác sẽ bị đăng xuất. Thiết bị đang dùng vẫn được giữ đăng nhập.'}</p>
        {accountActionMutation.isError && error && <p className="auth-error" role="alert">{error}</p>}
        <div className="session-revocation-actions">
          <button ref={sessionRevocationCancelRef} type="button" className="button light" disabled={accountActionMutation.isPending} onClick={closeSessionRevocation}>Để sau</button>
          <button type="button" className="button dark" disabled={accountActionMutation.isPending} onClick={() => accountActionMutation.mutate(sessionRevocation.path)}>
            {accountActionMutation.isPending ? 'Đang đăng xuất…' : sessionRevocation.mode === 'single' ? 'Đăng xuất thiết bị' : 'Đăng xuất thiết bị khác'}
          </button>
        </div>
      </>}
    </dialog>
    {avatarCropFile && <AvatarCropDialog file={avatarCropFile} busy={avatarUploadMutation.isPending} error={avatarUploadMutation.isError ? error : ''} onCrop={uploadCroppedAvatar} onCancel={cancelAvatarCrop} />}
  </div>
}
