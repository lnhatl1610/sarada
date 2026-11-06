import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { api, getApiErrorMessage } from '../../lib/http'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import type { components } from '../../types/api'
import { fetchStorefrontConfiguration } from '../storefront/storefront-api'
import { StorefrontAuthLayout } from './StorefrontAuthLayout'

type Props = { page: 'request' | 'sent' | 'reset' | 'done' }
type PasswordPolicy = components['schemas']['StorefrontConfigurationEnvelope']['data']['password_policy']
type RequestValues = { email: string }
type ResetValues = { email: string; password: string; password_confirmation: string }
const defaultPasswordPolicy: PasswordPolicy = { min_length: 10, require_letter: true, require_number: true, require_special: false }
const getResetResendDeadline = () => Date.now() + 60_000

const requestSchema = z.object({ email: z.string().trim().email('Nhập địa chỉ email hợp lệ.') })

function createResetSchema(policy: PasswordPolicy) {
  return z.object({
    email: z.string().trim().email('Nhập địa chỉ email hợp lệ.'),
    password: z.string().superRefine((value, context) => {
      if (value.length < policy.min_length) context.addIssue({ code: 'custom', message: `Mật khẩu cần ít nhất ${policy.min_length} ký tự.` })
      if (policy.require_letter && !/[A-Za-z]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có chữ cái.' })
      if (policy.require_number && !/[0-9]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có chữ số.' })
      if (policy.require_special && !/[^A-Za-z0-9]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có ký tự đặc biệt.' })
    }),
    password_confirmation: z.string().min(1, 'Nhập lại mật khẩu.'),
  }).superRefine((values, context) => {
    if (values.password !== values.password_confirmation) {
      context.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'Mật khẩu nhập lại chưa khớp.' })
    }
  })
}

export function PasswordRecoveryPage({ page }: Props) {
  const token = page === 'reset' ? decodeURIComponent(location.pathname.replace('/reset-password/', '')) : ''
  const emailFromLink = new URLSearchParams(location.search).get('email') ?? ''
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { data: storefrontConfiguration } = useQuery({
    queryKey: ['storefront', 'configuration'],
    queryFn: ({ signal }) => fetchStorefrontConfiguration(signal),
    enabled: page === 'reset',
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const policy = storefrontConfiguration?.password_policy ?? defaultPasswordPolicy
  const resetSchema = useMemo(() => createResetSchema(policy), [policy])
  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: emailFromLink },
  })
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: emailFromLink, password: '', password_confirmation: '' },
  })
  const requestEmail = useWatch({ control: requestForm.control, name: 'email' }) ?? ''
  const resetEmail = useWatch({ control: resetForm.control, name: 'email' }) ?? ''
  const password = useWatch({ control: resetForm.control, name: 'password' }) ?? ''
  const email = page === 'reset' ? resetEmail : requestEmail
  const [resendSeconds, setResendSeconds] = useState(() => {
    const until = Number(readBrowserStorage('fashion-store-reset-resend-until', 'session') ?? 0)
    return Math.max(0, Math.ceil((until - Date.now()) / 1000))
  })
  const checks = [
    { label: `Ít nhất ${policy.min_length} ký tự`, valid: password.length >= policy.min_length },
    { label: 'Có chữ cái', valid: !policy.require_letter || /[A-Za-z]/.test(password) },
    { label: 'Có chữ số', valid: !policy.require_number || /[0-9]/.test(password) },
    { label: 'Có ký tự đặc biệt', valid: !policy.require_special || /[^A-Za-z0-9]/.test(password) },
  ]
  const strength = [
    password.length >= policy.min_length,
    /[A-Za-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  useEffect(() => {
    if (!resendSeconds) return
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  async function requestResetLink(targetEmail: string) {
    const { data: body } = await api.post<components['schemas']['MessageEnvelope']>('/auth/forgot-password', { email: targetEmail })
    return body.message
  }

  const requestMutation = useMutation({
    mutationFn: async (values: RequestValues) => ({ email: values.email, message: await requestResetLink(values.email) }),
    onMutate: () => setError(''),
    onSuccess: ({ email: targetEmail, message }) => {
      writeBrowserStorage('fashion-store-reset-email', targetEmail, 'session')
      writeBrowserStorage('fashion-store-reset-resend-until', String(getResetResendDeadline()), 'session')
      window.location.assign(`/forgot-password/sent?email=${encodeURIComponent(targetEmail)}&notice=${encodeURIComponent(message)}`)
    },
    onError: (cause) => setError(getApiErrorMessage(cause, 'Không thể xử lý yêu cầu.')),
  })

  const resetMutation = useMutation({
    mutationFn: (values: ResetValues) =>
      api.post<components['schemas']['MessageEnvelope']>('/auth/reset-password', {
        email: values.email,
        token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      }),
    onMutate: () => setError(''),
    onSuccess: () => window.location.assign('/reset-password/done'),
    onError: (cause) => setError(getApiErrorMessage(cause, 'Không thể xử lý yêu cầu.')),
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      const targetEmail = readBrowserStorage('fashion-store-reset-email', 'session') ?? email
      const message = await requestResetLink(targetEmail)
      return { targetEmail, message }
    },
    onMutate: () => setError(''),
    onSuccess: ({ targetEmail, message }) => {
      setNotice(message)
      requestForm.setValue('email', targetEmail)
      resetForm.setValue('email', targetEmail)
      const until = getResetResendDeadline()
      writeBrowserStorage('fashion-store-reset-resend-until', String(until), 'session')
      setResendSeconds(60)
    },
    onError: (cause) => setError(getApiErrorMessage(cause, 'Không thể gửi lại hướng dẫn.')),
  })
  const busy = requestMutation.isPending || resetMutation.isPending || resendMutation.isPending
  const submitRequest = (values: RequestValues) => requestMutation.mutate(values)
  const submitReset = (values: ResetValues) => resetMutation.mutate(values)
  const resend = () => resendMutation.mutate()

  return <StorefrontAuthLayout><main className="container subpage auth-page recovery-page"><p className="eyebrow">TÀI KHOẢN SARADA</p>
    {page === 'done' ? <><h1>Mật khẩu đã được cập nhật</h1><p className="auth-lede">Bạn có thể đăng nhập bằng mật khẩu mới.</p><Link className="button dark" to="/login">Đăng nhập ngay</Link></> : page === 'sent' ? <><h1>Kiểm tra hòm thư</h1><p className="auth-lede">Nếu email được đăng ký, hướng dẫn đặt lại mật khẩu đã được gửi đến <strong>{email || 'địa chỉ email bạn vừa nhập'}</strong>. Hãy kiểm tra cả thư rác.</p>{notice && <p role="status">{notice}</p>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="button light" type="button" disabled={busy || resendSeconds > 0} onClick={() => void resend()}>{busy ? 'Đang gửi…' : resendSeconds ? `Gửi lại sau ${resendSeconds}s` : 'Gửi lại hướng dẫn'}</button><p><Link to="/login">Quay về đăng nhập</Link></p></> : page === 'request' ? <><h1>Quên mật khẩu?</h1><p className="auth-lede">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p><form className="auth-form" onSubmit={requestForm.handleSubmit(submitRequest)} noValidate>
      <label htmlFor="forgot-password-email">Email<input id="forgot-password-email" type="email" autoComplete="email" aria-invalid={Boolean(requestForm.formState.errors.email)} aria-describedby={requestForm.formState.errors.email ? 'forgot-password-email-error' : undefined} {...requestForm.register('email')} /></label>
      {requestForm.formState.errors.email && <p id="forgot-password-email-error" className="auth-error" role="alert">{requestForm.formState.errors.email.message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button dark full" disabled={busy}>{busy ? 'Đang xử lý…' : 'Gửi hướng dẫn'}</button>
    </form><p><Link to="/login">Quay về đăng nhập</Link></p></> : <><h1>Đặt lại mật khẩu</h1><p className="auth-lede">Tạo mật khẩu mới cho tài khoản của bạn.</p><form className="auth-form" onSubmit={resetForm.handleSubmit(submitReset)} noValidate>
      {!emailFromLink && <><label htmlFor="reset-password-email">Email<input id="reset-password-email" type="email" autoComplete="email" aria-invalid={Boolean(resetForm.formState.errors.email)} aria-describedby={resetForm.formState.errors.email ? 'reset-password-email-error' : undefined} {...resetForm.register('email')} /></label>{resetForm.formState.errors.email && <p id="reset-password-email-error" className="auth-error" role="alert">{resetForm.formState.errors.email.message}</p>}</>}
      <label htmlFor="reset-password-new">Mật khẩu mới<input id="reset-password-new" type="password" autoComplete="new-password" aria-invalid={Boolean(resetForm.formState.errors.password)} aria-describedby={resetForm.formState.errors.password ? 'reset-password-new-error' : 'reset-password-help'} {...resetForm.register('password')} /></label>
      <small id="reset-password-help">Tối thiểu {policy.min_length} ký tự{policy.require_letter ? ', có chữ cái' : ''}{policy.require_number ? ', có chữ số' : ''}{policy.require_special ? ', có ký tự đặc biệt' : ''}.</small>
      {resetForm.formState.errors.password && <p id="reset-password-new-error" className="auth-error" role="alert">{resetForm.formState.errors.password.message}</p>}
      <div className="recovery-strength" role="meter" aria-label="Độ mạnh mật khẩu" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength} aria-valuetext={strength <= 1 ? 'Yếu' : strength === 2 ? 'Trung bình' : strength === 3 ? 'Tốt' : 'Mạnh'}><div>{[1, 2, 3, 4].map((level) => <i key={level} className={strength >= level ? 'filled' : ''} />)}</div><span>{strength <= 1 ? 'Yếu' : strength === 2 ? 'Trung bình' : strength === 3 ? 'Tốt' : 'Mạnh'}</span></div>
      <ul className="recovery-checklist">{checks.map((check) => <li key={check.label} data-valid={check.valid}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul>
      <label htmlFor="reset-password-confirmation">Nhập lại mật khẩu<input id="reset-password-confirmation" type="password" autoComplete="new-password" aria-invalid={Boolean(resetForm.formState.errors.password_confirmation)} aria-describedby={resetForm.formState.errors.password_confirmation ? 'reset-password-confirmation-error' : undefined} {...resetForm.register('password_confirmation')} /></label>
      {resetForm.formState.errors.password_confirmation && <p id="reset-password-confirmation-error" className="auth-error" role="alert">{resetForm.formState.errors.password_confirmation.message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button dark full" disabled={busy}>{busy ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}</button>
    </form><p><Link to="/forgot-password">Yêu cầu liên kết mới</Link></p><p><Link to="/login">Quay về đăng nhập</Link></p></>}
  </main></StorefrontAuthLayout>
}
