import { adminApiFetch } from '../../lib/admin-api'
/* eslint-disable react-hooks/incompatible-library -- React Hook Form owns field state and validation in this dialog. */
import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { X } from 'lucide-react'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'
import '../../InventoryControls.css'
import { formatNumber } from '../../lib/date-format'

type InventoryRow = { variant_id: number; product_name: string; sku: string; quantity: number; reserved: number }
type UpdatedInventory = {
  quantity: number
  reserved: number
  low_stock_threshold: number
  movement: { id: number; type: 'import' | 'adjust'; quantity_change: number; stock_after: number }
}
type Props = {
  apiUrl: string
  accessToken: string
  item: InventoryRow
  onClose: () => void
  onAdjusted: (item: InventoryRow, inventory: UpdatedInventory) => void
  onViewMovement: (variantId: number) => void
}

const schemaFor = (t: ReturnType<typeof useTranslation>['t']) => z.object({
  type: z.enum(['import', 'adjust']),
  quantity_change: z.string().trim().min(1, t('Nhập số lượng điều chỉnh.')).regex(/^-?\d+$/, t('Số lượng điều chỉnh phải là số nguyên.')).refine((value) => Number(value) !== 0, t('Số lượng điều chỉnh phải khác 0.')).refine((value) => Number(value) >= -100000, t('Số lượng điều chỉnh không được nhỏ hơn -100000.')).refine((value) => Number(value) <= 100000, t('Số lượng điều chỉnh không được lớn hơn 100000.')),
  reason: z.string().trim().min(3, t('Lý do cần có ít nhất 3 ký tự.')).max(500, t('Lý do tối đa 500 ký tự.')),
}).superRefine((values, context) => {
  if (values.type === 'import' && Number(values.quantity_change) < 1) {
    context.addIssue({ code: 'custom', path: ['quantity_change'], message: t('Nhập kho phải có số lượng lớn hơn 0.') })
  }
})
type Values = z.infer<ReturnType<typeof schemaFor>>

export function InventoryAdjustmentDialog({ apiUrl, accessToken, item, onClose, onAdjusted, onViewMovement }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [savedMovement, setSavedMovement] = useState<UpdatedInventory['movement'] | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schemaFor(t)), defaultValues: { type: 'adjust', quantity_change: '0', reason: '' } })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty && !savedMovement)
  const closeDialog = () => { if (savedMovement || confirmDiscard()) onClose() }

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

  const quantityChangeText = form.watch('quantity_change')
  const nextQuantity = item.quantity + Number(quantityChangeText)
  const validPreview = /^-?\d+$/.test(quantityChangeText) && Number(quantityChangeText) !== 0
  const violatesReservedStock = validPreview && nextQuantity < item.reserved

  const saveConfirmed = async () => {
    const values = form.getValues()
    setSaving(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/${item.variant_id}/adjust`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, quantity_change: Number(values.quantity_change) }),
      })
      const body = await response.json().catch(() => ({})) as { data?: UpdatedInventory; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw createApiResponseError(body, response.status, t('Không thể điều chỉnh tồn kho.'))
      onAdjusted(item, body.data)
      setSavedMovement(body.data.movement)
      setConfirming(false)
    } catch (cause) {
      setConfirming(false)
      const mapped = applyServerValidationErrors(form, cause)
      setError(mapped ? '' : cause instanceof Error ? cause.message : t('Không thể điều chỉnh tồn kho.'))
    } finally {
      setSaving(false)
    }
  }

  const submit = form.handleSubmit(() => { setError(''); setConfirming(true) })

  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="inventory-adjustment-title" onCancel={(event) => { event.preventDefault(); closeDialog() }} onClick={(event) => { if (event.target === dialogRef.current) closeDialog() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('Điều chỉnh kho')}</p><h2 id="inventory-adjustment-title">{item.product_name}</h2></div><button className="icon-button" type="button" aria-label={t('Đóng')} onClick={closeDialog}><X size={18} /></button></div>
    <p className="account-dialog-description">{t('SKU {{sku}} · Tồn {{stock}} · Đang giữ {{reserved}} · Khả dụng {{available}}', { sku: item.sku, stock: formatNumber(item.quantity), reserved: formatNumber(item.reserved), available: formatNumber(Math.max(0, item.quantity - item.reserved)) })}</p>
    {savedMovement ? <div className="account-password-form"><p className="account-settings-notice" role="status">{t('Đã ghi nhận biến động #{{id}}. Tồn sau điều chỉnh: {{stock}}.', { id: savedMovement.id, stock: formatNumber(savedMovement.stock_after) })}</p><div className="account-dialog-actions"><button className="secondary" type="button" onClick={closeDialog}>{t('Đóng')}</button><button className="primary" type="button" onClick={() => { onViewMovement(item.variant_id); closeDialog() }}>{t('Xem lịch sử biến động')}</button></div></div> : confirming ? <div className="account-password-form"><p>{t('Bạn sắp {{action}} cho SKU {{sku}}.', { action: t(form.getValues('type') === 'import' ? 'nhập kho' : 'điều chỉnh tồn'), sku: item.sku })}</p><p>{t('Tồn kho: {{before}} → {{after}} · Đang giữ: {{reserved}} · Khả dụng sau điều chỉnh: {{available}}', { before: formatNumber(item.quantity), after: formatNumber(nextQuantity), reserved: formatNumber(item.reserved), available: formatNumber(nextQuantity - item.reserved) })}</p><p>{t('Lý do: {{reason}}', { reason: form.getValues('reason') })}</p>{error && <p className="account-form-error" role="alert">{error}</p>}<div className="account-dialog-actions"><button className="secondary" type="button" onClick={() => setConfirming(false)} disabled={saving}>{t('Sửa lại')}</button><button className="primary" type="button" onClick={() => void saveConfirmed()} disabled={saving}>{saving ? t('Đang lưu…') : t('Xác nhận điều chỉnh')}</button></div></div> : <form className="account-password-form" onSubmit={submit} noValidate>
      <FormField id="inventory-adjustment-type" label={t('Loại thao tác')} required error={form.formState.errors.type?.message}><select {...form.register('type')}><option value="adjust">{t('Điều chỉnh tồn')}</option><option value="import">{t('Nhập thêm')}</option></select></FormField>
      <FormField id="inventory-adjustment-quantity" label={t('Số lượng điều chỉnh')} required hint={t(form.watch('type') === 'import' ? 'Nhập thêm chỉ nhận số nguyên dương.' : 'Số dương để tăng tồn; số âm để giảm tồn.')} error={form.formState.errors.quantity_change?.message ?? (violatesReservedStock ? t('Tồn sau điều chỉnh không được thấp hơn {{reserved}} sản phẩm đang giữ cho đơn hàng.', { reserved: formatNumber(item.reserved) }) : undefined)}><input type="number" step="1" aria-invalid={Boolean(form.formState.errors.quantity_change) || violatesReservedStock} {...form.register('quantity_change')} /></FormField>
      <p className="account-dialog-description">{t('Tồn sau thao tác: {{stock}} · Khả dụng sau thao tác: {{available}}', { stock: validPreview ? formatNumber(nextQuantity) : '—', available: validPreview ? formatNumber(Math.max(0, nextQuantity - item.reserved)) : '—' })}</p>
      <FormField id="inventory-adjustment-reason" label={t('Lý do điều chỉnh')} required error={form.formState.errors.reason?.message}><textarea rows={3} maxLength={500} {...form.register('reason')} /></FormField>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="account-dialog-actions"><button className="secondary" type="button" onClick={closeDialog} disabled={saving}>{t('Hủy')}</button><button className="primary" type="submit" disabled={saving || violatesReservedStock || !form.formState.isDirty}>{t('Xem lại')}</button></div>
    </form>}
  </dialog>
}
