import { adminApiFetch } from '../../lib/admin-api'
import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ChangePasswordDialogProps = {
  apiUrl: string
  accessToken: string
  onClose: () => void
  onChanged: () => void
}

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
  password: z.string().min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.').regex(/[A-Za-z]/, 'Mật khẩu cần có chữ cái.').regex(/[0-9]/, 'Mật khẩu cần có chữ số.'),
  password_confirmation: z.string(),
}).refine((values) => values.password === values.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Mật khẩu nhập lại chưa khớp.',
})

type PasswordValues = z.infer<typeof passwordSchema>

export function ChangePasswordDialog({ apiUrl, accessToken, onClose, onChanged }: ChangePasswordDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const closeDialog = () => { if (confirmDiscard()) onClose() }

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    dialog?.querySelector<HTMLInputElement>('input')?.focus()
    return () => {
      if (dialog?.open) dialog.close()
      previousFocus?.focus()
    }
  }, [])

  const submit = form.handleSubmit(async (values) => {
    setError('')
    setSaving(true)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/auth/password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể đổi mật khẩu.'))
      confirmDiscard.clear()
      onChanged()
    } catch (submitError) {
      const mapped = applyServerValidationErrors(form, submitError)
      setError(mapped ? '' : submitError instanceof Error ? t(submitError.message) : t('Không thể đổi mật khẩu. Hãy thử lại.'))
    } finally {
      setSaving(false)
    }
  })

  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="change-password-title" onCancel={(event) => { event.preventDefault(); closeDialog() }} onClick={(event) => { if (event.target === dialogRef.current) closeDialog() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('BẢO MẬT TÀI KHOẢN')}</p><h2 id="change-password-title">{t('Đổi mật khẩu')}</h2></div><button className="icon-button" type="button" aria-label={t('Đóng')} onClick={closeDialog}><X size={18} /></button></div>
    <p className="account-dialog-description">{t('Sau khi đổi, các phiên đăng nhập trên admin và storefront sẽ bị đăng xuất.')}</p>
    <form className="account-password-form" onSubmit={submit}>
      <FormField id="dialog-password-current" label={t('Mật khẩu hiện tại')} required error={form.formState.errors.current_password?.message ? t(form.formState.errors.current_password.message) : undefined}><input type="password" autoComplete="current-password" {...form.register('current_password')} /></FormField>
      <FormField id="dialog-password-new" label={t('Mật khẩu mới')} required error={form.formState.errors.password?.message ? t(form.formState.errors.password.message) : undefined}><input type="password" autoComplete="new-password" {...form.register('password')} /></FormField>
      <FormField id="dialog-password-confirm" label={t('Nhập lại mật khẩu mới')} required error={form.formState.errors.password_confirmation?.message ? t(form.formState.errors.password_confirmation.message) : undefined}><input type="password" autoComplete="new-password" {...form.register('password_confirmation')} /></FormField>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="secondary" type="button" onClick={closeDialog} disabled={saving}>{t('Hủy')}</button><button className="primary" type="submit" disabled={saving || !form.formState.isDirty}>{saving ? t('Đang cập nhật...') : t('Đổi mật khẩu')}</button></div>
    </form>
  </dialog>
}
