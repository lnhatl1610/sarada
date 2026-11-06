import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { FormField } from '../../components/shared/form-field'
import { ApiResponseError } from '../../components/shared/api-validation'
import { formatDateTime } from '../../lib/date-format'
import { mediaUrl } from '../../lib/media-url'

export type ReviewDetail = {
  id: number
  rating: number
  title: string | null
  content: string | null
  status: string
  verified_purchase: boolean
  moderation_reason?: string | null
  store_response?: string | null
  created_at: string
  fit?: string | null
  images?: { id: number; url: string; alt: string | null; media_type?: 'image' | 'video' }[]
  order?: { id: number; code: string } | null
  customer?: { name: string; email?: string }
  product?: { id?: number; name: string; slug: string }
}

type ReasonDialogProps = {
  title: string
  subject: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

export function ReviewModerationDialog({ title, subject, onClose, onSubmit }: ReasonDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reasonError, setReasonError] = useState('')
  const confirmDiscard = useUnsavedFormGuard(Boolean(reason.trim()))
  const close = () => { if (!busy && confirmDiscard()) onClose() }

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector('textarea')?.focus()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (reason.trim().length < 3) { setReasonError(t("Lý do cần có ít nhất 3 ký tự.")); return }
    setBusy(true)
    setError(''); setReasonError('')
    try { await onSubmit(reason.trim()); confirmDiscard.clear(); onClose() }
    catch (cause) {
      if (cause instanceof ApiResponseError && cause.status === 422 && cause.fieldErrors?.reason?.[0]) setReasonError(t(cause.fieldErrors.reason[0]))
      else setError(cause instanceof Error ? t(cause.message) : t('Không thể ẩn đánh giá.'))
    }
    finally { setBusy(false) }
  }

  return <dialog ref={dialogRef} className="account-dialog" aria-labelledby="review-moderation-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialogRef.current) close() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t("KIỂM DUYỆT")}</p><h2 id="review-moderation-title">{title}</h2></div><button className="icon-button" type="button" aria-label={t("Đóng")} disabled={busy} onClick={close}>×</button></div>
    <p className="account-dialog-description">{subject}. {t('Lý do sẽ được lưu để nhân viên tra cứu.')}</p>
    <form className="account-password-form" onSubmit={(event) => void submit(event)}>
      <FormField id="review-moderation-reason" label={t('Lý do ẩn')} error={reasonError ? t(reasonError) : undefined} required><textarea rows={4} minLength={3} maxLength={1000} required value={reason} onChange={(event) => { setReason(event.target.value); setReasonError('') }} /></FormField>
      {error && <p className="account-form-error" role="alert">{t(error)}</p>}
      <div className="account-dialog-actions"><button className="secondary" type="button" disabled={busy} onClick={close}>{t('Hủy')}</button><button className="primary" type="submit" disabled={busy || reason.trim().length < 3}>{busy ? t('Đang lưu…') : t('Ẩn đánh giá')}</button></div>
    </form>
  </dialog>
}

type DetailProps = {
  review: ReviewDetail
  apiUrl: string
  onClose: () => void
  onOpenOrder: (orderId: number) => void
  onSaveResponse: (response: string | null) => Promise<void>
}

const isAiDemoReviewImage = (alt?: string | null) => alt?.trim().toLocaleLowerCase('vi-VN').startsWith('ảnh ai demo:') ?? false

export function ReviewDetailDrawer({ review, apiUrl, onClose, onOpenOrder, onSaveResponse }: DetailProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [zoomedImage, setZoomedImage] = useState<{ url: string; alt: string | null } | null>(null)
  const [storeResponse, setStoreResponse] = useState(review.store_response ?? '')
  const [responseBusy, setResponseBusy] = useState(false)
  const [responseError, setResponseError] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  const fitLabel = review.fit ? t(({ small: 'Chật', true_to_size: 'Vừa', large: 'Rộng' } as Record<string, string>)[review.fit] ?? review.fit) : null
  return <dialog ref={dialogRef} className="account-dialog review-detail-drawer" aria-labelledby="review-detail-title" onCancel={(event) => { event.preventDefault(); if (zoomedImage) setZoomedImage(null); else onClose() }} onClick={(event) => { if (event.target === dialogRef.current) onClose() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t("ĐÁNH GIÁ #")}{review.id}</p><h2 id="review-detail-title">{t("Chi tiết đánh giá")}</h2></div><button className="icon-button" type="button" aria-label={t("Đóng chi tiết")} onClick={onClose}>×</button></div>
    <div className="review-detail-content">
      <section><h3>{t("Sản phẩm")}</h3><p>{review.product?.name ?? t("Sản phẩm")}</p></section>
      <section><h3>{t("Khách hàng")}</h3><p>{review.customer?.name ?? t("Khách hàng")}{review.customer?.email ? ` · ${review.customer.email}` : ''}</p></section>
      <section><h3>{t('Nội dung')}</h3><p className="review-detail-rating" aria-label={t('{{rating}} trên 5', { rating: review.rating })}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} <span>{review.rating}/5</span></p><h4>{review.title || t('Không có tiêu đề')}</h4><p className="review-detail-text">{review.content || t('Chưa có nội dung đánh giá.')}</p></section>
      <section className="review-detail-facts"><span>{t('Trạng thái')}<strong>{review.status === 'rejected' ? t('Đã ẩn') : review.status === 'approved' ? t('Đã duyệt') : t('Chờ duyệt')}</strong></span><span>{t('Đã mua')}<strong>{review.verified_purchase ? t('Có') : t('Không')}</strong></span>{fitLabel && <span>{t('Độ vừa vặn')}<strong>{fitLabel}</strong></span>}<span>{t('Ngày gửi')}<strong>{formatDateTime(review.created_at)}</strong></span></section>
      {review.moderation_reason && <section><h3>{t("Lý do ẩn")}</h3><p>{review.moderation_reason}</p></section>}
      {review.status === 'approved' && <section><h3>{t('Phản hồi của cửa hàng')}</h3><form className="review-store-response-form" onSubmit={(event) => { event.preventDefault(); setResponseBusy(true); setResponseError(''); setResponseMessage(''); void onSaveResponse(storeResponse.trim() || null).then(() => setResponseMessage(t('Đã lưu phản hồi công khai.'))).catch((error: unknown) => setResponseError(error instanceof Error ? t(error.message) : t('Không thể lưu phản hồi.'))).finally(() => setResponseBusy(false)) }}><label htmlFor="review-store-response">{t('Phản hồi hiển thị cùng đánh giá đã duyệt')}</label><textarea id="review-store-response" rows={4} maxLength={1000} value={storeResponse} onChange={(event) => setStoreResponse(event.target.value)} /><small>{storeResponse.length}/1000</small>{responseError && <p role="alert" className="account-form-error">{responseError}</p>}{responseMessage && <p role="status">{responseMessage}</p>}<div className="account-dialog-actions"><button className="primary" type="submit" disabled={responseBusy}>{responseBusy ? t('Đang lưu…') : t('Lưu phản hồi')}</button></div></form></section>}
      <section><h3>{t("Ảnh/video đính kèm")}</h3>{review.images?.length ? <div className="review-detail-images">{review.images.map((media) => media.media_type === 'video' ? <video key={media.id} controls playsInline preload="metadata" aria-label={media.alt ?? t("Video khách hàng gửi kèm")} src={mediaUrl(apiUrl, media.url)} /> : <button key={media.id} type="button" onClick={() => setZoomedImage({ url: media.url, alt: media.alt })} aria-label={t("Phóng to ảnh đánh giá")}><img src={mediaUrl(apiUrl, media.url)} alt={media.alt ?? t("Ảnh khách hàng gửi kèm")} />{isAiDemoReviewImage(media.alt) && <strong className="product-image-demo-badge">{t("Ảnh AI demo")}</strong>}</button>)}</div> : <p>{t("Đánh giá chưa có ảnh hoặc video.")}</p>}</section>
      <section><h3>{t("Đơn hàng liên quan")}</h3>{review.order ? <button className="link-button" type="button" onClick={() => { onClose(); onOpenOrder(review.order!.id) }}>{review.order.code} {t("· Xem đơn hàng")}</button> : <p>{t("Đánh giá không gắn với đơn hàng.")}</p>}</section>
    </div>
    {zoomedImage && <div className="review-image-zoom" role="dialog" aria-modal="true" aria-label={t("Ảnh đánh giá được phóng to")} onClick={() => setZoomedImage(null)}><button type="button" aria-label={t("Đóng ảnh phóng to")} onClick={() => setZoomedImage(null)}>×</button>{isAiDemoReviewImage(zoomedImage.alt) && <strong className="product-image-demo-badge">{t("Ảnh AI demo")}</strong>}<img src={mediaUrl(apiUrl, zoomedImage.url)} alt={zoomedImage.alt ?? t("Ảnh đánh giá được phóng to")} /></div>}
  </dialog>
}
