import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { confirmAccountPhoneChange, requestAccountPhoneChange, AccountValidationError, type AccountProfile } from './account-settings-api'

const requestSchema = z.object({
  phone: z.string().regex(/^(0\d{9}|\+84\d{9})$/, 'Nhập số điện thoại Việt Nam hợp lệ.'),
  current_password: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
})
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.') })

export function AccountPhoneChangePanel({ accessToken, currentPhone, onVerified }: {
  accessToken: string
  currentPhone: string | null
  onVerified: (account: Partial<AccountProfile>) => void
}) {
  const [challenge, setChallenge] = useState<{ phoneMasked: string; expiresAt: string } | null>(null)
  const [notice, setNotice] = useState('')
  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { phone: currentPhone ?? '', current_password: '' },
  })
  const codeForm = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } })
  const requestMutation = useMutation<Awaited<ReturnType<typeof requestAccountPhoneChange>>, Error, z.infer<typeof requestSchema>>({
    mutationFn: (values) => requestAccountPhoneChange(accessToken, values),
    onSuccess: (result) => {
      setChallenge({ phoneMasked: result.data.phone_masked, expiresAt: result.data.expires_at })
      setNotice(result.message)
      codeForm.reset({ code: '' })
      requestForm.setValue('current_password', '')
    },
    onError: (cause) => {
      if (cause instanceof AccountValidationError) {
        for (const [field, messages] of Object.entries(cause.fields)) {
          if ((field === 'phone' || field === 'current_password') && messages[0]) requestForm.setError(field, { message: messages[0] })
        }
      }
    },
  })
  const confirmMutation = useMutation<Awaited<ReturnType<typeof confirmAccountPhoneChange>>, Error, string>({
    mutationFn: (code: string) => confirmAccountPhoneChange(accessToken, code),
    onSuccess: (result) => {
      setChallenge(null)
      setNotice('Số điện thoại đã được xác minh và cập nhật.')
      requestForm.reset({ phone: result.data.phone ?? '', current_password: '' })
      onVerified(result.data)
    },
    onError: (cause) => {
      if (cause instanceof AccountValidationError && cause.fields.code?.[0]) codeForm.setError('code', { message: cause.fields.code[0] })
    },
  })
  const busy = requestMutation.isPending || confirmMutation.isPending

  return <section className="account-settings-card">
    <h2>Xác minh số điện thoại</h2>
    <p>Gửi mã SMS đến số mới để xác minh quyền sử dụng. Mã có hiệu lực 10 phút; cần mật khẩu hiện tại để yêu cầu mã.</p>
    {notice && <p className="account-settings-message" role="status">{notice}</p>}
    <form className="auth-form account-settings-form" onSubmit={requestForm.handleSubmit((values) => requestMutation.mutate(values))}>
      <label>Số điện thoại mới
        <input type="tel" autoComplete="tel" inputMode="tel" {...requestForm.register('phone')} aria-invalid={Boolean(requestForm.formState.errors.phone)} aria-describedby={requestForm.formState.errors.phone ? 'account-phone-error' : undefined} />
        {requestForm.formState.errors.phone && <small id="account-phone-error" className="field-error" role="alert">{requestForm.formState.errors.phone.message}</small>}
      </label>
      <label>Mật khẩu hiện tại
        <input type="password" autoComplete="current-password" {...requestForm.register('current_password')} aria-invalid={Boolean(requestForm.formState.errors.current_password)} aria-describedby={requestForm.formState.errors.current_password ? 'account-phone-password-error' : undefined} />
        {requestForm.formState.errors.current_password && <small id="account-phone-password-error" className="field-error" role="alert">{requestForm.formState.errors.current_password.message}</small>}
      </label>
      {requestMutation.isError && !(requestMutation.error instanceof AccountValidationError) && <p role="alert" className="auth-error">{requestMutation.error.message}</p>}
      <button className="button dark" type="submit" disabled={busy}>{requestMutation.isPending ? 'Đang gửi mã…' : challenge ? 'Gửi lại mã SMS' : 'Gửi mã xác minh'}</button>
    </form>
    {challenge && <form className="auth-form account-settings-form account-phone-confirm" onSubmit={codeForm.handleSubmit(({ code }) => confirmMutation.mutate(code))}>
      <p>Mã đã gửi đến <strong>{challenge.phoneMasked}</strong>. Hết hạn lúc {new Date(challenge.expiresAt).toLocaleTimeString('vi-VN')}.</p>
      <label>Mã xác minh 6 chữ số
        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...codeForm.register('code')} aria-invalid={Boolean(codeForm.formState.errors.code)} aria-describedby={codeForm.formState.errors.code ? 'account-phone-code-error' : undefined} />
        {codeForm.formState.errors.code && <small id="account-phone-code-error" className="field-error" role="alert">{codeForm.formState.errors.code.message}</small>}
      </label>
      {confirmMutation.isError && !(confirmMutation.error instanceof AccountValidationError) && <p role="alert" className="auth-error">{confirmMutation.error.message}</p>}
      <button className="button dark" type="submit" disabled={busy}>{confirmMutation.isPending ? 'Đang xác minh…' : 'Xác minh số điện thoại'}</button>
    </form>}
  </section>
}
