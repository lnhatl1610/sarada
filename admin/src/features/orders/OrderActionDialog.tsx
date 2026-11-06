import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { X } from 'lucide-react'
import { applyServerValidationErrors } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { LocationFields } from './LocationFields'
import { provinceNameForCode, resolveProvinceCode, resolveWardCode, wardNameForCode } from './location-utils'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../lib/date-format'

export type OrderDialogMode = 'cancel' | 'bulk-cancel' | 'status' | 'bulk-status' | 'address' | 'refund'
export type OrderDialogValues = { note: string; reason: string; refund_amount: string; customer_name: string; customer_phone: string; province_code: string; province: string; district: string; ward_code: string; ward: string; street: string }
type Props = {
  mode: OrderDialogMode
  orderCode?: string
  selectionCount?: number
  statusLabel?: string
  refundLimit?: number
  address?: { customer_name: string; customer_phone: string; province?: string; province_code?: string; district?: string; ward?: string; ward_code?: string; street: string }
  onClose: () => void
  onSubmit: (values: OrderDialogValues) => Promise<void>
}

const valuesSchema = z.object({
  note: z.string(),
  reason: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  province_code: z.string(),
  province: z.string(),
  district: z.string(),
  ward_code: z.string(),
  ward: z.string(),
  street: z.string(),
  refund_amount: z.string(),
})

const cancelReasons = [
  { value: 'customer_request', label: 'Khách hàng yêu cầu hủy' },
  { value: 'out_of_stock', label: 'Không đủ hàng trong kho' },
  { value: 'unable_to_contact', label: 'Không liên hệ được với khách' },
  { value: 'incorrect_information', label: 'Thông tin giao hàng không chính xác' },
  { value: 'payment_failed', label: 'Thanh toán không thành công' },
  { value: 'other', label: 'Khác' },
] as const

function schemaFor(mode: OrderDialogMode, refundLimit: number, t: ReturnType<typeof useTranslation>['t']) {
  return valuesSchema.superRefine((values, context) => {
    if (mode === 'cancel' || mode === 'bulk-cancel') {
      if (!cancelReasons.some((reason) => reason.value === values.reason)) context.addIssue({ code: 'custom', path: ['reason'], message: t('Vui lòng chọn lý do hủy.') })
      if (values.reason === 'other') {
        const note = values.note.trim()
        if (note.length < 3) context.addIssue({ code: 'custom', path: ['note'], message: t('Vui lòng nhập lý do khác, tối thiểu 3 ký tự.') })
        if (note.length > 2000) context.addIssue({ code: 'custom', path: ['note'], message: t('Lý do hủy tối đa 2000 ký tự.') })
      }
    }
    if ((mode === 'status' || mode === 'bulk-status') && values.note.length > 2000) {
      context.addIssue({ code: 'custom', path: ['note'], message: t('Ghi chú tối đa 2000 ký tự.') })
    }
    if (mode === 'refund') {
      const reason = values.reason.trim()
      if (reason.length < 3) context.addIssue({ code: 'custom', path: ['reason'], message: t('Lý do hoàn tiền cần có ít nhất 3 ký tự.') })
      if (reason.length > 1000) context.addIssue({ code: 'custom', path: ['reason'], message: t('Lý do hoàn tiền tối đa 1000 ký tự.') })
      const amount = Number(values.refund_amount)
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > refundLimit) context.addIssue({ code: 'custom', path: ['refund_amount'], message: t('Số tiền hoàn phải từ 1 đến {{limit}} VND.', { limit: formatNumber(refundLimit) }) })
    }
    if (mode === 'address') {
      if (values.customer_name.trim().length < 2) context.addIssue({ code: 'custom', path: ['customer_name'], message: t('Tên người nhận cần có ít nhất 2 ký tự.') })
      if (values.customer_name.trim().length > 160) context.addIssue({ code: 'custom', path: ['customer_name'], message: t('Tên người nhận tối đa 160 ký tự.') })
      if (values.customer_phone.trim().length < 8) context.addIssue({ code: 'custom', path: ['customer_phone'], message: t('Số điện thoại cần có ít nhất 8 ký tự.') })
      if (values.customer_phone.trim().length > 32) context.addIssue({ code: 'custom', path: ['customer_phone'], message: t('Số điện thoại tối đa 32 ký tự.') })
      if (!values.province_code) context.addIssue({ code: 'custom', path: ['province_code'], message: t('Vui lòng chọn tỉnh/thành phố.') })
      if (!values.ward_code) context.addIssue({ code: 'custom', path: ['ward_code'], message: t('Vui lòng chọn phường/xã.') })
      if (values.street.trim().length < 3) context.addIssue({ code: 'custom', path: ['street'], message: t('Địa chỉ cần có ít nhất 3 ký tự.') })
      if (values.street.trim().length > 255) context.addIssue({ code: 'custom', path: ['street'], message: t('Địa chỉ tối đa 255 ký tự.') })
    }
  })
}

const copy: Record<OrderDialogMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  cancel: { eyebrow: 'HỦY ĐƠN HÀNG', title: 'Xác nhận hủy đơn', description: 'Nhập lý do để lưu vào lịch sử đơn hàng.', submit: 'Hủy đơn hàng' },
  'bulk-cancel': { eyebrow: 'HỦY ĐƠN HÀNG', title: 'Hủy các đơn đã chọn', description: 'Lý do này sẽ được lưu vào lịch sử của tất cả đơn đã chọn.', submit: 'Hủy các đơn' },
  status: { eyebrow: 'CẬP NHẬT ĐƠN HÀNG', title: 'Xác nhận chuyển trạng thái', description: 'Thao tác sẽ được ghi vào dòng thời gian của đơn hàng.', submit: 'Xác nhận cập nhật' },
  'bulk-status': { eyebrow: 'CẬP NHẬT ĐƠN HÀNG', title: 'Xác nhận cập nhật các đơn', description: 'Thao tác sẽ được ghi vào lịch sử từng đơn hàng.', submit: 'Cập nhật các đơn' },
  address: { eyebrow: 'THÔNG TIN GIAO HÀNG', title: 'Sửa người nhận và địa chỉ', description: 'Thay đổi này chỉ cập nhật bản chụp giao hàng của đơn hiện tại.', submit: 'Lưu địa chỉ' },
  refund: { eyebrow: 'HOÀN TIỀN', title: 'Ghi nhận hoàn tiền', description: 'Nhập số tiền và lý do để lưu vào lịch sử thanh toán của đơn.', submit: 'Ghi nhận hoàn tiền' },
}

export function OrderActionDialog({ mode, orderCode, selectionCount, statusLabel, refundLimit = 0, address, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<OrderDialogValues>({
    resolver: zodResolver(schemaFor(mode, refundLimit, t)),
    defaultValues: {
      note: '', reason: '', refund_amount: refundLimit > 0 ? String(refundLimit) : '',
      customer_name: address?.customer_name ?? '',
      customer_phone: address?.customer_phone ?? '',
      province_code: resolveProvinceCode(address?.province_code, address?.province),
      province: address?.province ?? '',
      district: address?.district ?? '',
      ward_code: resolveWardCode(resolveProvinceCode(address?.province_code, address?.province), address?.ward_code, address?.ward),
      ward: address?.ward ?? '',
      street: address?.street ?? '',
    },
  })
  const cancelReason = useWatch({ control: form.control, name: 'reason' })
  const addressProvinceCode = useWatch({ control: form.control, name: 'province_code' })
  const addressWardCode = useWatch({ control: form.control, name: 'ward_code' })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    dialog?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus()
    return () => {
      if (dialog?.open) dialog.close()
      previousFocus?.focus()
    }
  }, [])

  const submit = form.handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    try {
      const cancelReason = cancelReasons.find((reason) => reason.value === values.reason)
      const note = (mode === 'cancel' || mode === 'bulk-cancel') && values.reason !== 'other' ? (cancelReason ? t(cancelReason.label) : '') : values.note.trim()
      await onSubmit({ ...values, note, reason: values.reason.trim(), customer_name: values.customer_name.trim(), customer_phone: values.customer_phone.trim(), province: provinceNameForCode(values.province_code), ward: wardNameForCode(values.province_code, values.ward_code), district: values.district.trim(), street: values.street.trim() })
      confirmDiscard.clear()
      onClose()
    } catch (cause) {
      const mapped = applyServerValidationErrors(form, cause, { 'shipping_address.province_code': 'province_code', 'shipping_address.ward_code': 'ward_code', 'shipping_address.street': 'street' })
      setError(mapped ? '' : cause instanceof Error ? cause.message : t('Không thể lưu thay đổi đơn hàng.'))
    } finally {
      setBusy(false)
    }
  })

  const labels = copy[mode]
  const close = () => { if (!busy && confirmDiscard()) onClose() }
  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="order-action-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialogRef.current) close() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t(labels.eyebrow)}</p><h2 id="order-action-title">{t(labels.title)}</h2></div><button className="icon-button" type="button" aria-label={t('Đóng')} onClick={close} disabled={busy}><X size={18} /></button></div>
    <p className="account-dialog-description">{orderCode ? `${t('Đơn {{code}}.', { code: orderCode })} ` : selectionCount ? `${t('{{count}} đơn đã chọn.', { count: selectionCount })} ` : ''}{statusLabel ? `${t('Trạng thái mới: {{status}}.', { status: t(statusLabel) })} ` : ''}{t(labels.description)}</p>
    <form className="account-password-form" onSubmit={submit} noValidate>
      {(mode === 'cancel' || mode === 'bulk-cancel') && <>
        <FormField id="order-cancel-reason" label={t('Lý do hủy')} required error={form.formState.errors.reason?.message}>
          <select value={cancelReason} onChange={(event) => { const reason = event.target.value; form.setValue('reason', reason, { shouldDirty: true, shouldValidate: true }); if (reason !== 'other') form.setValue('note', '', { shouldDirty: true, shouldValidate: true }) }}>
            <option value="">{t('Chọn lý do hủy')}</option>
            {cancelReasons.map((reason) => <option key={reason.value} value={reason.value}>{t(reason.label)}</option>)}
          </select>
        </FormField>
        {cancelReason === 'other' && <FormField id="order-cancel-note" label={t('Mô tả lý do khác')} required error={form.formState.errors.note?.message}><textarea rows={4} maxLength={2000} {...form.register('note')} /></FormField>}
      </>}
      {(mode === 'status' || mode === 'bulk-status') && <FormField id="order-status-note" label={t('Ghi chú chuyển trạng thái')} error={form.formState.errors.note?.message}><textarea rows={3} maxLength={2000} placeholder={t('Ví dụ: Đã đóng gói và bàn giao cho đơn vị vận chuyển')} {...form.register('note')} /></FormField>}
      {mode === 'refund' && <FormField id="order-refund-amount" label={t('Số tiền hoàn (VND)')} required error={form.formState.errors.refund_amount?.message}><input type="number" min="1" max={refundLimit} step="1" {...form.register('refund_amount')} /><small>{t('Còn có thể hoàn tối đa {{amount}} ₫.', { amount: formatNumber(refundLimit) })}</small></FormField>}
      {mode === 'refund' && <FormField id="order-refund-reason" label={t('Lý do hoàn tiền')} required error={form.formState.errors.reason?.message}><textarea rows={4} maxLength={1000} {...form.register('reason')} /></FormField>}
      {mode === 'address' && <>
        <FormField id="order-address-name" label={t('Tên người nhận')} required error={form.formState.errors.customer_name?.message}><input autoComplete="name" maxLength={160} {...form.register('customer_name')} /></FormField>
        <FormField id="order-address-phone" label={t('Số điện thoại')} required error={form.formState.errors.customer_phone?.message}><input type="tel" autoComplete="tel" maxLength={32} {...form.register('customer_phone')} /></FormField>
        <LocationFields idPrefix="order-address" provinceCode={addressProvinceCode} wardCode={addressWardCode} onProvinceChange={(code) => form.setValue('province_code', code, { shouldDirty: true, shouldValidate: true })} onWardChange={(code) => form.setValue('ward_code', code, { shouldDirty: true, shouldValidate: true })} provinceError={form.formState.errors.province_code?.message} wardError={form.formState.errors.ward_code?.message} />
        <FormField id="order-address-street" label={t('Địa chỉ đường/phố')} required error={form.formState.errors.street?.message}><input autoComplete="street-address" maxLength={255} {...form.register('street')} /></FormField>
      </>}
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="secondary" type="button" onClick={close} disabled={busy}>{t('Đóng')}</button><button className="primary" type="submit" disabled={busy || (!(mode === 'status' || mode === 'bulk-status') && !form.formState.isDirty)}>{busy ? t('Đang lưu…') : t(labels.submit)}</button></div>
    </form>
  </dialog>
}
