import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import './OrderChangeRequestDialog.css'

const requestSchema = z.object({
  reason: z.string().trim().min(3, 'Lý do cần có ít nhất 3 ký tự.').max(1000, 'Lý do không được vượt quá 1.000 ký tự.'),
})

type RequestValues = z.infer<typeof requestSchema>

type OrderChangeRequestDialogProps = {
  open: boolean
  busy: boolean
  orderCode: string
  type: 'cancellation' | 'return'
  onClose: () => void
  onSubmit: (reason: string) => Promise<string | null>
}

export function OrderChangeRequestDialog({ open, busy, orderCode, type, onClose, onSubmit }: OrderChangeRequestDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { reason: '' },
  })
  const isReturn = type === 'return'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      reset({ reason: '' })
      setServerError('')
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, reset])

  const submit = async (values: RequestValues) => {
    setServerError('')
    const error = await onSubmit(values.reason.trim())
    if (error) setServerError(error)
  }

  return <dialog ref={dialogRef} className="order-change-request-dialog" aria-labelledby="order-change-request-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <form onSubmit={handleSubmit(submit)} noValidate>
      <p className="eyebrow">ĐƠN {orderCode}</p>
      <h2 id="order-change-request-title">{isReturn ? 'Yêu cầu trả hàng' : 'Yêu cầu hủy đơn'}</h2>
      <p className="order-change-request-copy">{isReturn ? 'Nhân viên sẽ xem xét yêu cầu trả hàng và phản hồi trong tài khoản của bạn.' : 'Nhân viên sẽ xem xét yêu cầu trước khi hủy đơn và cập nhật trạng thái.'}</p>
      <label htmlFor="order-change-request-reason">Lý do yêu cầu</label>
      <textarea id="order-change-request-reason" rows={4} maxLength={1000} aria-invalid={!!errors.reason} aria-describedby={errors.reason ? 'order-change-request-reason-error' : undefined} {...register('reason')} />
      {errors.reason && <small id="order-change-request-reason-error" className="field-error" role="alert">{errors.reason.message}</small>}
      {serverError && <p className="auth-error" role="alert">{serverError}</p>}
      <div className="order-change-request-actions">
        <button type="button" className="button light" disabled={busy} onClick={onClose}>Để sau</button>
        <button type="submit" className="button dark" disabled={busy}>{busy ? 'Đang gửi…' : isReturn ? 'Gửi yêu cầu trả hàng' : 'Gửi yêu cầu hủy'}</button>
      </div>
    </form>
  </dialog>
}
