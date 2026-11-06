import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { FormField } from '../../components/shared/form-field'
import { X } from 'lucide-react'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

type Props = { apiUrl: string; accessToken: string; variantId: number; sku: string; threshold: number; onClose: () => void; onSaved: (threshold: number) => void }

export function InventoryThresholdDialog({ apiUrl, accessToken, variantId, sku, threshold, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(String(threshold))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isDirty = value.trim() === '' || !Number.isInteger(Number(value)) || Number(value) !== threshold
  const confirmDiscard = useUnsavedFormGuard(isDirty)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    dialog?.querySelector<HTMLInputElement>('input')?.focus()
    return () => { if (dialog?.open) dialog.close(); previousFocus?.focus() }
  }, [])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = Number(value)
    if (!Number.isInteger(next) || next < 0 || next > 1000000) {
      setError(t('Ngưỡng phải là số nguyên từ 0 đến 1.000.000.'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/threshold`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ variant_ids: [variantId], low_stock_threshold: next }) })
      const body = await response.json() as { data?: { low_stock_threshold: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? t('Không thể cập nhật ngưỡng cảnh báo.'))
      confirmDiscard.clear()
      onSaved(body.data.low_stock_threshold)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Không thể cập nhật ngưỡng cảnh báo.'))
    } finally {
      setBusy(false)
    }
  }

  const close = () => { if (!busy && confirmDiscard()) onClose() }
  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="inventory-threshold-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialogRef.current) close() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('Tồn kho')}</p><h2 id="inventory-threshold-title">{t('Sửa ngưỡng cảnh báo')}</h2></div><button className="icon-button" type="button" aria-label={t('Đóng')} disabled={busy} onClick={close}><X size={18} /></button></div>
    <p className="account-dialog-description">{t('SKU {{sku}}. Ngưỡng này phát cảnh báo khi số lượng khả dụng chạm hoặc thấp hơn giá trị đã đặt.', { sku })}</p>
    <form className="account-password-form" onSubmit={(event) => void save(event)}><FormField id="inventory-threshold-value" label={t('Ngưỡng tồn thấp')} required hint={t('Số nguyên từ 0 đến 1.000.000.')}><input type="number" min="0" max="1000000" step="1" value={value} disabled={busy} onChange={(event) => setValue(event.target.value)} /></FormField>{error && <p className="account-form-error" role="alert">{error}</p>}<div className="account-dialog-actions"><button className="secondary" type="button" disabled={busy} onClick={close}>{t('Hủy')}</button><button className="primary" type="submit" disabled={busy || !isDirty}>{busy ? t('Đang lưu…') : t('Lưu ngưỡng')}</button></div></form>
  </dialog>
}
