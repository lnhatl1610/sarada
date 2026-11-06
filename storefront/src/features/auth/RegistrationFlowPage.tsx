import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'
import { fetchStorefrontConfiguration } from '../storefront/storefront-api'
import { StorefrontAuthLayout } from './StorefrontAuthLayout'

type Props = { page: 'register' | 'pending' | 'verified' }
type PasswordPolicy = components['schemas']['StorefrontConfigurationEnvelope']['data']['password_policy']
const defaultPasswordPolicy: PasswordPolicy = { min_length: 10, require_letter: true, require_number: true, require_special: false }

function createRegistrationSchema(policy: PasswordPolicy) {
  return z.object({
    name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự.').max(160, 'Họ tên không được quá 160 ký tự.'),
    email: z.string().trim().email('Nhập địa chỉ email hợp lệ.').max(255, 'Email không được quá 255 ký tự.'),
    phone: z.string().trim().refine((value) => !value || /^(0|\+84)\d{9}$/.test(value), 'Nhập số điện thoại Việt Nam hợp lệ.'),
    password: z.string().superRefine((value, context) => {
      if (value.length < policy.min_length) context.addIssue({ code: 'custom', message: `Mật khẩu cần ít nhất ${policy.min_length} ký tự.` })
      if (policy.require_letter && !/[A-Za-z]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có chữ cái.' })
      if (policy.require_number && !/[0-9]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có chữ số.' })
      if (policy.require_special && !/[^A-Za-z0-9]/.test(value)) context.addIssue({ code: 'custom', message: 'Mật khẩu cần có ký tự đặc biệt.' })
    }),
    password_confirmation: z.string().min(1, 'Nhập lại mật khẩu.'),
    terms: z.boolean().refine(Boolean, 'Bạn cần đồng ý với điều khoản sử dụng.'),
    marketing_consent: z.boolean(),
  }).superRefine((values, context) => {
    if (values.password !== values.password_confirmation) {
      context.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'Mật khẩu nhập lại chưa khớp.' })
    }
  })
}

type RegistrationValues = z.infer<ReturnType<typeof createRegistrationSchema>>

export function RegistrationFlowPage({ page }: Props) {
  const [resendCountdown, setResendCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { data: storefrontConfiguration, isLoading: configurationLoading } = useQuery({
    queryKey: ['storefront', 'configuration'],
    queryFn: ({ signal }) => fetchStorefrontConfiguration(signal),
    enabled: page === 'register',
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const enabled = storefrontConfiguration?.public_registration_enabled ?? false
  const passwordPolicy = storefrontConfiguration?.password_policy ?? defaultPasswordPolicy
  const schema = useMemo(() => createRegistrationSchema(passwordPolicy), [passwordPolicy])
  const { control, register, handleSubmit, getValues, formState: { errors } } = useForm<RegistrationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: new URLSearchParams(location.search).get('email') ?? '',
      phone: '',
      password: '',
      password_confirmation: '',
      terms: false,
      marketing_consent: false,
    },
  })
  const registrationMutation = useMutation({
    mutationFn: async (values: RegistrationValues) => {
      await api.post<components['schemas']['StorefrontRegistrationEnvelope']>('/auth/register', {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        password_confirmation: values.password_confirmation,
        terms: values.terms,
        marketing_consent: values.marketing_consent,
      })
      return values.email
    },
    onMutate: () => { setError(''); setMessage('') },
    onSuccess: (email) => window.location.assign(`/pending-approval?email=${encodeURIComponent(email)}`),
    onError: (cause) => setError(getApiErrorMessage(cause, 'Không thể tạo tài khoản.')),
  })
  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data: body } = await api.post<components['schemas']['MessageEnvelope']>('/auth/resend-verification', { email })
      return body.message
    },
    onMutate: () => { setError(''); setMessage('') },
    onSuccess: (resendMessage) => { setMessage(resendMessage); setResendCountdown(60) },
    onError: (cause) => setError(getApiErrorMessage(cause, 'Không gửi lại được email.')),
  })
  const busy = registrationMutation.isPending || resendMutation.isPending
  const email = useWatch({ control, name: 'email' }) ?? ''
  const password = useWatch({ control, name: 'password' }) ?? ''
  const checking = page === 'register' && configurationLoading
  const passwordChecks = [
    { label: `Ít nhất ${passwordPolicy.min_length} ký tự`, valid: password.length >= passwordPolicy.min_length },
    { label: 'Có chữ cái', valid: !passwordPolicy.require_letter || /[A-Za-z]/.test(password) },
    { label: 'Có chữ số', valid: !passwordPolicy.require_number || /[0-9]/.test(password) },
    ...(passwordPolicy.require_special ? [{ label: 'Có ký tự đặc biệt', valid: /[^A-Za-z0-9]/.test(password) }] : []),
  ]
  const passwordStrength = [
    password.length >= passwordPolicy.min_length,
    /[A-Za-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = window.setTimeout(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendCountdown])

  function submit(values: RegistrationValues) { registrationMutation.mutate(values) }

  function resend() { resendMutation.mutate(getValues('email')) }

  return <StorefrontAuthLayout><main className="container subpage auth-page"><p className="eyebrow">TÀI KHOẢN SARADA</p>
    {page === 'register' ? checking ? <><h1>Đang kiểm tra đăng ký</h1><p role="status">Vui lòng chờ…</p></> : !enabled ? <><h1>Đăng ký đang tắt</h1><p className="auth-lede">Cửa hàng hiện nhận tài khoản qua lời mời. Vui lòng liên hệ cửa hàng để được hỗ trợ.</p><Link className="button dark" to="/login">Về đăng nhập</Link></> : <><h1>Tạo tài khoản</h1><p className="auth-lede">Xác minh email và chờ cửa hàng duyệt tài khoản.</p><form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <label htmlFor="storefront-register-name">Họ và tên<input id="storefront-register-name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'storefront-register-name-error' : undefined} {...register('name')} /></label>
      {errors.name && <p id="storefront-register-name-error" className="auth-error" role="alert">{errors.name.message}</p>}
      <label htmlFor="storefront-register-email">Email<input id="storefront-register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'storefront-register-email-error' : undefined} {...register('email')} /></label>
      {errors.email && <p id="storefront-register-email-error" className="auth-error" role="alert">{errors.email.message}</p>}
      <label htmlFor="storefront-register-phone">Số điện thoại <span>(không bắt buộc)</span><input id="storefront-register-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'storefront-register-phone-error' : undefined} {...register('phone')} /></label>
      {errors.phone && <p id="storefront-register-phone-error" className="auth-error" role="alert">{errors.phone.message}</p>}
      <label htmlFor="storefront-register-password">Mật khẩu<input id="storefront-register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'storefront-register-password-error' : 'storefront-register-password-help'} {...register('password')} /><small id="storefront-register-password-help">Tối thiểu {passwordPolicy.min_length} ký tự{passwordPolicy.require_letter ? ', có chữ cái' : ''}{passwordPolicy.require_number ? ', có chữ số' : ''}{passwordPolicy.require_special ? ', có ký tự đặc biệt' : ''}.</small></label>
      {errors.password && <p id="storefront-register-password-error" className="auth-error" role="alert">{errors.password.message}</p>}
      <div className="recovery-strength" role="meter" aria-label="Độ mạnh mật khẩu" aria-valuemin={0} aria-valuemax={4} aria-valuenow={passwordStrength} aria-valuetext={passwordStrength <= 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : passwordStrength === 3 ? 'Tốt' : 'Mạnh'}><div>{[1, 2, 3, 4].map((level) => <i key={level} className={passwordStrength >= level ? 'filled' : ''} />)}</div><span>{passwordStrength <= 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : passwordStrength === 3 ? 'Tốt' : 'Mạnh'}</span></div>
      <ul className="recovery-checklist">{passwordChecks.map((check) => <li key={check.label} data-valid={check.valid}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul>
      <label htmlFor="storefront-register-confirmation">Nhập lại mật khẩu<input id="storefront-register-confirmation" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password_confirmation)} aria-describedby={errors.password_confirmation ? 'storefront-register-confirmation-error' : undefined} {...register('password_confirmation')} /></label>
      {errors.password_confirmation && <p id="storefront-register-confirmation-error" className="auth-error" role="alert">{errors.password_confirmation.message}</p>}
      <label className="auth-terms"><input type="checkbox" aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? 'storefront-register-terms-error' : undefined} {...register('terms')} /><span>Tôi đồng ý <Link to="/pages/terms">điều khoản sử dụng</Link>.</span></label>
      {errors.terms && <p id="storefront-register-terms-error" className="auth-error" role="alert">{errors.terms.message}</p>}
      <label className="auth-terms"><input type="checkbox" {...register('marketing_consent')} /><span>Tôi đồng ý nhận email về sản phẩm mới và ưu đãi từ cửa hàng.</span></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button dark full" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button><p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></form></> : page === 'pending' ? <><h1>Kiểm tra email của bạn</h1><p className="auth-lede">Đã gửi liên kết xác minh đến <strong>{email || 'địa chỉ email đã đăng ký'}</strong>. Sau khi xác minh, tài khoản sẽ chờ chủ cửa hàng duyệt.</p><button className="button light" type="button" disabled={busy || !email || resendCountdown > 0} onClick={() => void resend()}>{busy ? 'Đang gửi…' : resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại email xác minh'}</button>{message && <p role="status">{message}</p>}{error && <p className="auth-error" role="alert">{error}</p>}<p><Link to="/register">Đổi email</Link> · <Link to="/login">Quay về đăng nhập</Link></p></> : <><h1>Email đã xác minh</h1><p className="auth-lede">Cảm ơn bạn. Tài khoản đang chờ chủ cửa hàng phê duyệt; cửa hàng sẽ gửi email khi có kết quả.</p><Link className="button dark" to="/login">Quay về đăng nhập</Link></>}
  </main></StorefrontAuthLayout>
}
