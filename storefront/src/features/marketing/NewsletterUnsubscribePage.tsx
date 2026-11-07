import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { getApiErrorMessage } from '../../lib/http'
import { requestNewsletterUnsubscribe, confirmNewsletterUnsubscribe, type NewsletterUnsubscribeReason } from './newsletter-api'

const reasons = ['too_many_emails', 'not_relevant', 'signed_up_by_mistake', 'other'] as const
const requestSchema = z.object({
  email: z.string().trim().min(1, 'Nhập địa chỉ email.').email('Email chưa đúng định dạng.').max(254, 'Email quá dài.'),
  reason: z.union([z.literal(''), z.enum(reasons)])
    .refine((reason) => reason !== '', 'Chọn lý do hủy nhận email.')
    .transform((reason) => reason as NewsletterUnsubscribeReason),
})

type RequestValues = z.output<typeof requestSchema>
type RequestFormInput = z.input<typeof requestSchema>

const reasonLabels: Record<NewsletterUnsubscribeReason, string> = {
  too_many_emails: 'Tôi nhận quá nhiều email',
  not_relevant: 'Nội dung không còn phù hợp',
  signed_up_by_mistake: 'Tôi đăng ký nhầm',
  other: 'Lý do khác',
}

export function NewsletterUnsubscribePage({ path, hash }: { path: string; hash: string }) {
  return path === '/newsletter/unsubscribe/confirm'
    ? <ConfirmUnsubscribePage hash={hash} />
    : <RequestUnsubscribePage />
}

function RequestUnsubscribePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RequestFormInput, unknown, RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '', reason: '' },
  })
  const mutation = useMutation({
    mutationFn: ({ email, reason }: RequestValues) => requestNewsletterUnsubscribe(email.trim(), reason),
  })
  const errorMessage = mutation.error ? getApiErrorMessage(mutation.error, 'Chưa gửi được yêu cầu. Vui lòng thử lại.') : ''

  return <main className="container auth-page">
    <h1>Hủy nhận email</h1>
    <p className="auth-lede">Nhập địa chỉ đang nhận tin và chọn lý do. Sarada sẽ gửi liên kết xác nhận nếu email có đăng ký.</p>
    <form className="auth-form max-w-md" onSubmit={handleSubmit((values) => mutation.mutate(values))} aria-busy={mutation.isPending} noValidate>
      <label htmlFor="newsletter-unsubscribe-email">Địa chỉ email<input id="newsletter-unsubscribe-email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'newsletter-unsubscribe-email-error' : undefined} {...register('email', { onChange: () => mutation.reset() })} /></label>
      {errors.email && <p id="newsletter-unsubscribe-email-error" className="auth-error" role="alert">{errors.email.message}</p>}
      <label htmlFor="newsletter-unsubscribe-reason">Lý do<select className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" id="newsletter-unsubscribe-reason" aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? 'newsletter-unsubscribe-reason-error' : undefined} {...register('reason', { onChange: () => mutation.reset() })}>
        <option value="">Chọn lý do</option>
        {reasons.map((reason) => <option key={reason} value={reason}>{reasonLabels[reason]}</option>)}
      </select></label>
      {errors.reason && <p id="newsletter-unsubscribe-reason-error" className="auth-error" role="alert">{errors.reason.message}</p>}
      {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
      {mutation.data && <p className="mt-4 rounded-sm border border-border bg-muted p-4 text-sm text-foreground" role="status" aria-live="polite">{mutation.data.data.message}</p>}
      <button className="button dark full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
      <p><Link to="/">Quay lại cửa hàng</Link></p>
    </form>
  </main>
}

function ConfirmUnsubscribePage({ hash }: { hash: string }) {
  const [token] = useState(() => new URLSearchParams(hash.replace(/^#/, '')).get('token') ?? '')
  const mutation = useMutation({ mutationFn: confirmNewsletterUnsubscribe })
  const errorMessage = mutation.error ? getApiErrorMessage(mutation.error, 'Liên kết không còn hiệu lực. Hãy yêu cầu liên kết mới.') : ''

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
  }, [token])

  return <main className="container auth-page">
    <h1>Xác nhận hủy nhận email</h1>
    <p className="auth-lede">Liên kết xác nhận chỉ sử dụng được một lần.</p>
    {mutation.data ? <p className="rounded-sm border border-border bg-muted p-4 text-sm text-foreground" role="status" aria-live="polite">{mutation.data.data.message}</p> : token ? <>
      <p>Bạn sẽ không còn nhận email giới thiệu và ưu đãi từ Sarada.</p>
      {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
      <button className="button dark full" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate(token)}>{mutation.isPending ? 'Đang cập nhật…' : 'Xác nhận hủy đăng ký'}</button>
    </> : <p className="auth-error" role="alert">Không tìm thấy liên kết xác nhận. Hãy yêu cầu một liên kết mới.</p>}
    {(!token || errorMessage || mutation.data) && <p className="mt-4"><Link to="/newsletter/unsubscribe">Yêu cầu liên kết mới</Link></p>}
    <p className="mt-4"><Link to="/">Quay lại cửa hàng</Link></p>
  </main>
}
