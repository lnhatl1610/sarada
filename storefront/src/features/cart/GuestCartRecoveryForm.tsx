import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { removeGuestCartRecoveryContact, saveGuestCartRecoveryContact } from './cart-api'
import './GuestCartRecoveryForm.css'

const schema = z.object({
  email: z.string().trim().email('Vui lòng nhập email hợp lệ.').max(254, 'Email không được quá 254 ký tự.'),
  consent: z.boolean().refine(Boolean, 'Bạn cần đồng ý để nhận email nhắc giỏ hàng.'),
})
type Values = z.infer<typeof schema>

type Props = {
  cartToken: string
  recoveryEmail: string | null
  disabled: boolean
  onRecoveryEmailChange: (email: string | null) => void
}

export function GuestCartRecoveryForm({ cartToken, recoveryEmail, disabled, onRecoveryEmailChange }: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: recoveryEmail ?? '', consent: Boolean(recoveryEmail) },
  })
  const saveMutation = useMutation({
    mutationFn: (values: Values) => saveGuestCartRecoveryContact({ cartToken, email: values.email.trim().toLowerCase() }),
    onSuccess: (cart) => {
      onRecoveryEmailChange(cart.recovery_email ?? null)
      form.reset({ email: cart.recovery_email ?? '', consent: Boolean(cart.recovery_email) })
    },
  })
  const removeMutation = useMutation({
    mutationFn: () => removeGuestCartRecoveryContact({ cartToken }),
    onSuccess: (cart) => {
      onRecoveryEmailChange(cart.recovery_email ?? null)
      form.reset({ email: '', consent: false })
    },
  })
  const busy = disabled || saveMutation.isPending || removeMutation.isPending

  useEffect(() => {
    if (!saveMutation.isPending && !removeMutation.isPending) {
      form.reset({ email: recoveryEmail ?? '', consent: Boolean(recoveryEmail) })
    }
  }, [recoveryEmail, saveMutation.isPending, removeMutation.isPending, form])

  return <section className="guest-cart-recovery" aria-labelledby="guest-cart-recovery-title">
    <h3 id="guest-cart-recovery-title">Nhắc bạn về giỏ hàng</h3>
    {recoveryEmail && <p role="status">Email nhắc giỏ hàng đang gửi đến <strong>{recoveryEmail}</strong>.</p>}
    <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} noValidate>
      <label htmlFor="guest-cart-recovery-email">Email của bạn</label>
      <input id="guest-cart-recovery-email" type="email" autoComplete="email" maxLength={254} disabled={busy} aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? 'guest-cart-recovery-email-error' : undefined} {...form.register('email')} />
      {form.formState.errors.email && <p className="guest-cart-recovery-error" id="guest-cart-recovery-email-error">{form.formState.errors.email.message}</p>}
      <label className="guest-cart-recovery-consent">
        <input type="checkbox" disabled={busy} {...form.register('consent')} />
        <span>Tôi đồng ý nhận tối đa 2 email nhắc về giỏ hàng này.</span>
      </label>
      {form.formState.errors.consent && <p className="guest-cart-recovery-error" role="alert">{form.formState.errors.consent.message}</p>}
      {saveMutation.isError && <p className="guest-cart-recovery-error" role="alert">{saveMutation.error.message}</p>}
      {removeMutation.isError && <p className="guest-cart-recovery-error" role="alert">{removeMutation.error.message}</p>}
      <div className="guest-cart-recovery-actions">
        <button className="button outline" type="submit" disabled={busy}>
          {saveMutation.isPending ? 'Đang lưu…' : recoveryEmail ? 'Cập nhật email nhắc' : 'Bật nhắc giỏ hàng'}
        </button>
        {recoveryEmail && <button className="guest-cart-recovery-remove" type="button" disabled={busy} onClick={() => removeMutation.mutate()}>
          {removeMutation.isPending ? 'Đang tắt…' : 'Tắt email nhắc'}
        </button>}
      </div>
      <p className="guest-cart-recovery-note">Chỉ gửi sau 1 giờ và 24 giờ nếu giỏ hàng chưa được thanh toán. Bạn có thể tắt bất cứ lúc nào tại đây.</p>
    </form>
  </section>
}
