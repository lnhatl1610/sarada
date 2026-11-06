import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import './NewsletterForm.css'
import { subscribeToNewsletter } from './home-api'
import type { components } from '../../types/api'

type NewsletterErrorResponse = components['schemas']['ApiError']

const newsletterSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email chưa đúng định dạng.').max(254, 'Email không được vượt quá 254 ký tự.'),
  consent: z.boolean().refine((accepted) => accepted, 'Vui lòng đồng ý nhận email trước khi đăng ký.'),
})

type NewsletterValues = z.infer<typeof newsletterSchema>

export function NewsletterForm({ storeName, idPrefix = 'newsletter', onSuccess }: { storeName: string; idPrefix?: string; onSuccess?: () => void }) {
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors } } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', consent: false },
  })
  const mutation = useMutation({
    mutationFn: (values: NewsletterValues) => subscribeToNewsletter(values.email.trim(), values.consent),
    onSuccess: () => { reset(); onSuccess?.() },
  })

  function submit(values: NewsletterValues) {
    clearErrors('root')
    mutation.mutate(values, {
      onError: (error) => {
        const responseData = error instanceof AxiosError
          ? error.response?.data as NewsletterErrorResponse | undefined
          : undefined
        const emailError = responseData?.errors?.email?.[0]
        const consentError = responseData?.errors?.consent?.[0]
        if (emailError) setError('email', { type: 'server', message: emailError })
        if (consentError) setError('consent', { type: 'server', message: consentError })
        if (!emailError && !consentError) {
          setError('root.serverError', { type: 'server', message: responseData?.message ?? 'Chưa gửi được đăng ký. Vui lòng thử lại sau.' })
        }
      },
    })
  }

  const emailId = `${idPrefix}-email`
  const consentId = `${idPrefix}-consent`
  const emailErrorId = `${idPrefix}-email-error`
  const consentErrorId = `${idPrefix}-consent-error`
  const feedbackId = `${idPrefix}-feedback`
  const serverErrorId = `${idPrefix}-server-error`

  return (
    <form className="newsletter-form" onSubmit={handleSubmit(submit)} aria-busy={mutation.isPending} noValidate>
        <label className="newsletter-email-label" htmlFor={emailId}>Địa chỉ email</label>
      <div className="newsletter-fields">
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="Địa chỉ email của bạn"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? emailErrorId : undefined}
          {...register('email', { onChange: () => { clearErrors(); mutation.reset() } })}
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang gửi…' : 'Đăng ký　↗'}
        </button>
      </div>
      <label className="newsletter-consent" id={consentId}>
        <input type="checkbox" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? consentErrorId : undefined} {...register('consent', { onChange: () => { clearErrors(); mutation.reset() } })} />
        <span>Tôi đồng ý nhận email giới thiệu bộ sưu tập và tin mới từ {storeName}.</span>
      </label>
      {errors.email && <p className="newsletter-feedback" id={emailErrorId} role="alert">{errors.email.message}</p>}
      {errors.consent && <p className="newsletter-feedback" id={consentErrorId} role="alert">{errors.consent.message}</p>}
      {mutation.isSuccess && <p className="newsletter-feedback" id={feedbackId} role="status" aria-live="polite">{mutation.data}</p>}
      {errors.root?.serverError?.message && <p className="newsletter-feedback" id={serverErrorId} role="alert">{errors.root.serverError.message}</p>}
    </form>
  )
}
