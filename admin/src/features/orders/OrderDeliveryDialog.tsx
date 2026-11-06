import { useEffect, useRef, useState } from 'react'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

type Props = {
  orderCode: string
  busy: boolean
  onChoose: (paymentCollected: boolean, note: string) => Promise<boolean>
  onClose: () => void
}

export function OrderDeliveryDialog({ orderCode, busy, onChoose, onClose }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [note, setNote] = useState('')
  const confirmDiscard = useUnsavedFormGuard(Boolean(note.trim()))

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  const close = () => {
    if (busy || !confirmDiscard()) return
    confirmDiscard.clear()
    onClose()
  }

  const choose = async (paymentCollected: boolean) => {
    if (busy) return
    const saved = await onChoose(paymentCollected, note.trim())
    if (saved) confirmDiscard.clear()
  }

  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="order-delivery-title" aria-describedby="order-delivery-description" onCancel={(event) => { event.preventDefault(); close() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('Cập nhật đơn hàng')}</p><h2 id="order-delivery-title">{t('Xác nhận giao hàng')}</h2></div></div>
    <p id="order-delivery-description" className="account-dialog-description">{t('Đơn {{code}} đã giao tới khách chưa và bạn đã thu đủ tiền COD chưa?', { code: orderCode })}</p>
    <FormField id="order-delivery-note" label={t('Ghi chú chuyển trạng thái')}><textarea rows={3} maxLength={2000} disabled={busy} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('Ví dụ: Khách đã nhận hàng lúc 14:30')} /></FormField>
    <div className="order-delivery-choices">
      <button className="primary" type="button" disabled={busy} onClick={() => void choose(true)}>{busy ? t('Đang lưu…') : t('Đã thu đủ tiền')}</button>
      <button className="secondary" type="button" disabled={busy} onClick={() => void choose(false)}>{t('Đã giao, chưa thu tiền')}</button>
    </div>
    <div className="account-dialog-actions"><button className="secondary" type="button" disabled={busy} onClick={close}>{t('Hủy cập nhật')}</button></div>
  </dialog>
}
