import { adminApiFetch } from '../../lib/admin-api'
import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { X } from 'lucide-react'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

const schemaFor = (t: (key: string) => string) => z.object({
  carrier: z.string().trim().max(50, t('Đơn vị vận chuyển tối đa 50 ký tự.')),
  tracking_code: z.string().trim().max(100, t('Mã vận đơn tối đa 100 ký tự.')),
  tracking_url: z.string().trim().max(2048, t('Liên kết tra cứu tối đa 2048 ký tự.')).refine((value) => !value || /^https:\/\//i.test(value), t('Liên kết tra cứu phải bắt đầu bằng https://.')),
  status: z.enum(['pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned']),
})

type Values = z.infer<ReturnType<typeof schemaFor>>
type Props = {
  orderId: number
  carrier: string
  trackingCode: string
  trackingUrl: string
  status: string
  apiUrl: string
  accessToken: string
  onClose: () => void
  onSaved: (order?: unknown) => void
}

const statusLabels: Record<Values['status'], string> = {
  pending: 'Chờ lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang vận chuyển',
  delivered: 'Đã giao',
  failed: 'Giao thất bại',
  returned: 'Hoàn hàng',
}

export function ShipmentEditorDialog({ orderId, carrier, trackingCode, trackingUrl, status, apiUrl, accessToken, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schemaFor(t)),
    defaultValues: { carrier, tracking_code: trackingCode, tracking_url: trackingUrl, status: (status in statusLabels ? status : 'pending') as Values['status'] },
  })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)

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

  const close = () => {
    if (!busy && confirmDiscard()) onClose()
  }

  const submit = form.handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/orders/${orderId}/shipment`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, carrier: values.carrier || null, tracking_code: values.tracking_code || null }),
      })
      const body = await response.json().catch(() => ({})) as { data?: unknown; message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể cập nhật vận đơn.'))
      confirmDiscard.clear()
      onSaved(body.data)
      onClose()
    } catch (cause) {
      const mapped = applyServerValidationErrors(form, cause)
      setError(mapped ? '' : cause instanceof Error ? cause.message : t('Không thể cập nhật vận đơn.'))
    } finally {
      setBusy(false)
    }
  })

  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby={`shipment-dialog-title-${orderId}`} onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialogRef.current) close() }}>
    <div className="account-dialog-heading">
      <div><p className="eyebrow">{t('Vận chuyển')}</p><h2 id={`shipment-dialog-title-${orderId}`}>{t('Đơn {{id}}', { id: orderId })}</h2></div>
      <button className="icon-button" type="button" aria-label={t('Đóng')} onClick={close}><X size={18} /></button>
    </div>
    <p className="account-dialog-description">{t('Cập nhật hãng vận chuyển, mã theo dõi và trạng thái hiện tại của vận đơn.')}</p>
    <form className="account-password-form" onSubmit={submit} noValidate>
      <FormField id="shipment-carrier" label={t('Đơn vị vận chuyển')} error={form.formState.errors.carrier?.message}><input autoComplete="organization" {...form.register('carrier')} /></FormField>
      <FormField id="shipment-tracking-code" label={t('Mã vận đơn')} error={form.formState.errors.tracking_code?.message}><input autoComplete="off" {...form.register('tracking_code')} /></FormField>
      <FormField id="shipment-tracking-url" label={t('Liên kết tra cứu')} hint={t('Dán URL HTTPS từ đơn vị vận chuyển.')} error={form.formState.errors.tracking_url?.message}><input type="url" inputMode="url" autoComplete="url" placeholder="https://…" {...form.register('tracking_url')} /></FormField>
      <FormField id="shipment-status" label={t('Trạng thái')} required error={form.formState.errors.status?.message}><select {...form.register('status')}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></FormField>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="secondary" type="button" onClick={close} disabled={busy}>{t('Hủy')}</button><button className="primary" type="submit" disabled={busy || !form.formState.isDirty}>{busy ? t('Đang lưu…') : t('Lưu vận đơn')}</button></div>
    </form>
  </dialog>
}
