import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'

type ChangeRequest = {
  id: number
  requester_name: string | null
  type: 'cancellation' | 'return'
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  resolution_note: string | null
  reviewer_name: string | null
  created_at: string
  reviewed_at: string | null
}

export function OrderChangeRequestsPanel({ requests, deliveredAt, canReview, onReview }: {
  requests: ChangeRequest[]
  deliveredAt: string | null
  canReview: boolean
  onReview: (id: number, decision: 'approved' | 'rejected', note: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const deliveredTime = deliveredAt ? Date.parse(deliveredAt) : Number.NaN
  const returnDeadline = Number.isFinite(deliveredTime) ? new Date(deliveredTime + 7 * 24 * 60 * 60 * 1000).toISOString() : null

  const decide = async (request: ChangeRequest, decision: 'approved' | 'rejected') => {
    const note = (notes[request.id] ?? '').trim()
    if (decision === 'rejected' && note.length < 3) {
      setErrors((current) => ({ ...current, [request.id]: t('Ghi rõ lý do từ chối (ít nhất 3 ký tự).') }))
      return
    }
    setBusyId(request.id)
    setErrors((current) => ({ ...current, [request.id]: '' }))
    try {
      await onReview(request.id, decision, note)
    } catch (error) {
      setErrors((current) => ({ ...current, [request.id]: error instanceof Error ? t(error.message) : t('Không thể xử lý yêu cầu.') }))
    } finally {
      setBusyId(null)
    }
  }

  if (requests.length === 0) return null

  return <section className="panel order-change-requests">
    <h3>{t('Yêu cầu hủy/trả')}</h3>
    {requests.map((request) => <article className="order-payment-card" key={request.id}>
      <div><strong>{request.type === 'cancellation' ? t('Yêu cầu hủy đơn') : t('Yêu cầu trả hàng')}</strong><span>{request.status === 'pending' ? t('Đang chờ xử lý') : request.status === 'approved' ? t('Đã chấp thuận') : t('Đã từ chối')}</span></div>
      <p>{request.reason}</p>
      {request.type === 'return' && <small>{returnDeadline
        ? t('Giao thành công {{delivered}} · hạn gửi yêu cầu trả {{deadline}}', { delivered: formatDateTime(deliveredAt as string), deadline: formatDateTime(returnDeadline) })
        : t('Thiếu mốc giao thành công trong hồ sơ đơn hàng.')}</small>}
      <small>{t('Gửi bởi {{name}} · {{date}}', { name: request.requester_name ?? t('Khách hàng'), date: formatDateTime(request.created_at) })}</small>
      {request.reviewed_at && <small>{t('Xử lý bởi {{name}} · {{date}}', { name: request.reviewer_name ?? t('Quản trị viên'), date: formatDateTime(request.reviewed_at) })}</small>}
      {request.resolution_note && <p>{t('Phản hồi: {{note}}', { note: request.resolution_note })}</p>}
      {request.status === 'pending' && canReview && <div className="account-password-form">
        <label>{t('Ghi chú xử lý')}<textarea maxLength={1000} value={notes[request.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} /></label>
        {request.type === 'return' && <small>{t('Duyệt yêu cầu chưa nhập lại tồn kho. Chỉ chuyển đơn sang Đã trả sau khi đã nhận hàng.')}</small>}
        {errors[request.id] && <p role="alert" className="account-form-error">{errors[request.id]}</p>}
        <div className="account-dialog-actions">
          <button className="secondary" type="button" disabled={busyId === request.id} onClick={() => void decide(request, 'rejected')}>{t('Từ chối')}</button>
          <button className="primary" type="button" disabled={busyId === request.id} onClick={() => void decide(request, 'approved')}>{busyId === request.id ? t('Đang xử lý…') : t('Chấp thuận')}</button>
        </div>
      </div>}
    </article>)}
  </section>
}
