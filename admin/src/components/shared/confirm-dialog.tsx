import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  destructive?: boolean
  busy?: boolean
  confirmDisabled?: boolean
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onOpenChange, destructive = true, busy = false, confirmDisabled = false }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return <dialog ref={dialogRef} className="shared-confirm-dialog" aria-labelledby="shared-confirm-title" aria-describedby="shared-confirm-description" onCancel={(event) => { event.preventDefault(); onOpenChange(false) }} onClose={() => onOpenChange(false)}>
    <h2 id="shared-confirm-title">{title}</h2>
    <div id="shared-confirm-description">{description}</div>
    <div className="shared-confirm-actions"><button type="button" className="secondary" disabled={busy} onClick={() => onOpenChange(false)}>{t('Quay lại')}</button><button type="button" className={destructive ? 'danger-button' : 'primary'} disabled={busy || confirmDisabled} onClick={onConfirm}>{busy ? t('Đang xử lý…') : confirmLabel}</button></div>
  </dialog>
}
