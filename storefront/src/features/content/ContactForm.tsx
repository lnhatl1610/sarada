import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '../../lib/http'
import { sendStoreContactMessage, type StoreContactMessageValues } from './contact-api'
import './ContactForm.css'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nhập họ tên từ 2 ký tự.').max(120, 'Họ tên không được vượt quá 120 ký tự.'),
  phone: z.string().trim().regex(/^(0|\+84)\d{9}$/, 'Nhập số điện thoại Việt Nam hợp lệ, ví dụ 0912345678.'),
  email: z.email('Nhập địa chỉ email hợp lệ.').max(254, 'Email không được vượt quá 254 ký tự.'),
  topic: z.enum(['product', 'order', 'return', 'cooperation', 'other']),
  order_code: z.string().trim().max(32, 'Mã đơn không được vượt quá 32 ký tự.'),
  message: z.string().trim().min(10, 'Nội dung cần ít nhất 10 ký tự.').max(5000, 'Nội dung không được vượt quá 5.000 ký tự.'),
})

type ContactValues = z.infer<typeof contactSchema>
type ContactCustomer = { name?: string | null; email?: string | null; phone?: string | null } | null

export function ContactForm({ customer }: { customer: ContactCustomer }) {
  const [searchParams] = useSearchParams()
  const orderCode = (searchParams.get('order_code') ?? '').slice(0, 32)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [resultMessage, setResultMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: customer?.name ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '', topic: 'other', order_code: orderCode, message: '' },
  })
  const { getValues, setValue } = form

  useEffect(() => {
    if (orderCode && !getValues('order_code')) setValue('order_code', orderCode)
  }, [getValues, orderCode, setValue])

  const mutation = useMutation({
    mutationFn: (values: ContactValues) => sendStoreContactMessage({ ...values, attachment } satisfies StoreContactMessageValues),
    onSuccess: (response) => {
      setResultMessage(response.data?.message ?? 'Cửa hàng đã nhận được yêu cầu liên hệ.')
      form.reset({ name: customer?.name ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '', topic: 'other', order_code: orderCode, message: '' })
      setAttachment(null)
      setAttachmentError('')
      if (fileInput.current) fileInput.current.value = ''
    },
    onError: (error) => {
      setResultMessage('')
      if (isAxiosError<{ errors?: Record<string, string[]> }>(error)) {
        Object.entries(error.response?.data?.errors ?? {}).forEach(([field, messages]) => {
          if (field in contactSchema.shape && messages?.[0]) form.setError(field as keyof ContactValues, { type: 'server', message: messages[0] })
          if (field === 'attachment' && messages?.[0]) setAttachmentError(messages[0])
        })
      }
    },
  })

  const onSubmit = (values: ContactValues) => {
    setResultMessage('')
    mutation.mutate(values)
  }

  const message = mutation.isError ? getApiErrorMessage(mutation.error, 'Chưa gửi được yêu cầu. Vui lòng thử lại.') : ''

  return <section className="store-contact-form" aria-labelledby="store-contact-form-title">
    <p className="eyebrow">CHÚNG TÔI SẴN SÀNG HỖ TRỢ</p>
    <h2 id="store-contact-form-title">Gửi lời nhắn cho cửa hàng</h2>
    <p className="store-contact-form-intro">Thông tin của bạn chỉ được dùng để phản hồi yêu cầu này. Tệp đính kèm không được lưu trên tài khoản.</p>
    <form className="store-contact-form-grid" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label>Họ và tên<input autoComplete="name" maxLength={120} aria-invalid={Boolean(form.formState.errors.name)} aria-describedby={form.formState.errors.name ? 'contact-name-error' : undefined} {...form.register('name')} />{form.formState.errors.name && <small id="contact-name-error" role="alert">{form.formState.errors.name.message}</small>}</label>
      <label>Số điện thoại<input type="tel" autoComplete="tel" maxLength={13} inputMode="tel" aria-invalid={Boolean(form.formState.errors.phone)} aria-describedby={form.formState.errors.phone ? 'contact-phone-error' : undefined} {...form.register('phone')} />{form.formState.errors.phone && <small id="contact-phone-error" role="alert">{form.formState.errors.phone.message}</small>}</label>
      <label>Email<input type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? 'contact-email-error' : undefined} {...form.register('email')} />{form.formState.errors.email && <small id="contact-email-error" role="alert">{form.formState.errors.email.message}</small>}</label>
      <label>Chủ đề<select {...form.register('topic')}><option value="product">Tư vấn sản phẩm</option><option value="order">Đơn hàng</option><option value="return">Đổi trả và bảo hành</option><option value="cooperation">Hợp tác</option><option value="other">Nội dung khác</option></select></label>
      <label>Mã đơn hàng (nếu có)<input maxLength={32} autoComplete="off" aria-invalid={Boolean(form.formState.errors.order_code)} aria-describedby={form.formState.errors.order_code ? 'contact-order-code-error' : undefined} {...form.register('order_code')} />{form.formState.errors.order_code && <small id="contact-order-code-error" role="alert">{form.formState.errors.order_code.message}</small>}</label>
      <label className="store-contact-form-message">Nội dung<textarea rows={6} maxLength={5000} aria-invalid={Boolean(form.formState.errors.message)} aria-describedby={form.formState.errors.message ? 'contact-message-error' : undefined} {...form.register('message')} />{form.formState.errors.message && <small id="contact-message-error" role="alert">{form.formState.errors.message.message}</small>}</label>
      <label className="store-contact-form-attachment">Ảnh đính kèm (không bắt buộc)<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const file = event.currentTarget.files?.[0] ?? null
        if (file && file.size > 2 * 1024 * 1024) {
          setAttachment(null)
          setAttachmentError('Ảnh đính kèm không được vượt quá 2 MB.')
          event.currentTarget.value = ''
          return
        }
        setAttachment(file)
        setAttachmentError('')
      }} />{attachment && <span>{attachment.name}</span>}{attachmentError && <small role="alert">{attachmentError}</small>}<small>JPG, PNG hoặc WebP; tối đa 2 MB.</small></label>
      {message && <p className="store-contact-form-error" role="alert">{message}</p>}
      {resultMessage && <p className="store-contact-form-success" role="status">{resultMessage}</p>}
      <button className="button dark" type="submit" disabled={mutation.isPending || Boolean(attachmentError)}>{mutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
    </form>
  </section>
}
