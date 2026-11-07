import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'
import { formatVnd } from '../../lib/date-format'
import { mediaUrl } from '../../lib/media-url'
import { StatusBadge, getStatusLabel } from '../../components/shared/status-badge'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { formatOrderAddress } from './location-utils'
import { FormField } from '../../components/shared/form-field'
import { ApiResponseError } from '../../components/shared/api-validation'
import { OrderChangeRequestsPanel } from './OrderChangeRequestsPanel'

export type OrderDetail = {
  id: number; code: string; customer_id: number | null; customer_name: string; customer_phone: string; customer_email: string | null
  invoice_requested?: boolean; invoice_tax_code?: string | null; invoice_company_name?: string | null; invoice_address?: string | null
  item_count?: number; payment_method: string; grand_total: number; status: string; payment_status: string; failed_payment_count?: number
  fulfillment_type?: 'delivery' | 'pickup'; pickup_location?: { name: string; address: string; province_name: string; ward_name: string | null; phone: string; opening_hours: string } | null
  placed_at: string | null; delivered_at: string | null; created_at?: string; shipping_address: Record<string, string>; subtotal: number; discount_total: number; membership_points_used?: number; membership_discount_total?: number
  shipping_fee: number; coupon_code: string | null; note: string | null
  items: { id: number; product_id: number | null; variant_id: number | null; product_name: string; variant_name: string | null; sku: string | null; image: string | null; unit_price: number; quantity: number; line_total: number }[]
  payments: { id: number; provider: string; amount: number; status: string; transaction_ref: string | null; paid_at: string | null; created_at: string; payload: unknown; refunded_amount?: number; refundable_amount?: number; refunds?: { id: number; amount: number; reason: string; recorded_by_name: string | null; created_at: string }[] }[]
  shipments: { id: number; carrier: string | null; tracking_code: string | null; tracking_url: string | null; status: string; shipped_at: string | null; delivered_at: string | null; created_at: string }[]
  history: { id: number; from_status: string | null; to_status: string; note: string | null; type?: 'internal_note' | 'status_change'; changed_by: number | null; changed_by_name: string | null; created_at: string }[]
  change_requests: { id: number; requester_id: number | null; requester_name: string | null; type: 'cancellation' | 'return'; status: 'pending' | 'approved' | 'rejected'; reason: string; resolution_note: string | null; reviewed_by: number | null; reviewer_name: string | null; created_at: string; reviewed_at: string | null }[]
}

type Props = {
  order: OrderDetail; apiUrl: string; permissions: string[]
  onClose: () => void; onPrint: (mode: 'invoice' | 'delivery') => void
  onStatusChange: (order: OrderDetail, status: string) => void
  onPaymentChange: (order: OrderDetail, status: 'paid', note: string) => Promise<void>
  onEditAddress: (order: OrderDetail) => void; onRefund: (order: OrderDetail) => void
  onEditShipment: (order: OrderDetail) => void
  onReviewChangeRequest: (requestId: number, decision: 'approved' | 'rejected', note: string) => Promise<void>
}

const transitions: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipping', 'cancelled'], shipping: ['delivered', 'delivery_failed'], delivery_failed: ['shipping', 'returned'], delivered: ['completed', 'returned'], completed: ['returned'], cancelled: [], returned: [] }
const fmt = (amount: number) => formatVnd(amount)
const shipmentLabel: Record<string, string> = { pending: 'Chờ lấy hàng', picked_up: 'Đã lấy hàng', in_transit: 'Đang vận chuyển', delivered: 'Đã giao', failed: 'Giao thất bại', returned: 'Hoàn hàng' }

function payloadText(value: unknown, t: (key: string) => string) {
  if (value == null) return t('Không có payload.')
  if (typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
  }
  try { return JSON.stringify(value, null, 2) } catch { return String(value) }
}

export function OrderDetailPanel({ order, apiUrl, permissions, onClose, onPrint, onStatusChange, onPaymentChange, onEditAddress, onRefund, onEditShipment, onReviewChangeRequest }: Props) {
  const { t } = useTranslation()
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentNoteError, setPaymentNoteError] = useState('')
  const [paymentBusy, setPaymentBusy] = useState(false)
  const confirmPaymentDiscard = useUnsavedFormGuard(Boolean(paymentNote.trim()))
  const closePaymentDialog = () => { if (!paymentBusy && confirmPaymentDiscard()) { setPaymentDialog(false); setPaymentNote('') } }
  const canUpdate = permissions.includes('orders.update_status')
  const canEditAddress = canUpdate && !['delivered', 'completed', 'returned', 'cancelled'].includes(order.status)
  const address = formatOrderAddress(order.shipping_address)
  const hasRefundablePayment = order.payments.some((payment) => ['paid', 'success'].includes(payment.status) && Number(payment.refundable_amount ?? payment.amount) > 0)

  const savePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (paymentNote.trim().length < 3) { setPaymentError(t('Ghi chú cần có ít nhất 3 ký tự.')); return }
    setPaymentBusy(true); setPaymentError('')
    try { await onPaymentChange(order, 'paid', paymentNote.trim()); confirmPaymentDiscard.clear(); setPaymentDialog(false); setPaymentNote(''); setPaymentNoteError('') }
    catch (error) {
      if (error instanceof ApiResponseError && error.status === 422 && error.fieldErrors?.note?.[0]) setPaymentNoteError(error.fieldErrors.note[0])
      else setPaymentError(error instanceof Error ? t(error.message) : t('Không thể cập nhật thanh toán.'))
    }
    finally { setPaymentBusy(false) }
  }

  return <>
    <section className="panel order-detail-panel">
      <div className="panel-heading order-detail-heading"><div><p className="eyebrow">{t('CHI TIẾT ĐƠN HÀNG')}</p><h2>{order.code}</h2><p>{order.placed_at ? formatDateTime(order.placed_at) : order.created_at ? formatDateTime(order.created_at) : t('Chưa rõ ngày đặt')}</p><div className="order-detail-badges"><StatusBadge kind="order" status={order.status} /><StatusBadge kind="payment" status={order.payment_status} /></div></div><div className="order-detail-actions">{canUpdate && <select aria-label={t('Đổi trạng thái đơn hàng')} value={order.status} onChange={(event) => onStatusChange(order, event.target.value)}><option value={order.status}>{getStatusLabel('order', order.status)}</option>{(order.fulfillment_type === 'pickup' ? (transitions[order.status] ?? []).filter((status) => status !== 'delivery_failed') : transitions[order.status] ?? []).map((status) => <option key={status} value={status}>{getStatusLabel('order', status)}</option>)}</select>}<button className="secondary" type="button" onClick={() => onPrint('invoice')}>{t('In hóa đơn')}</button>{order.fulfillment_type !== 'pickup' && <button className="secondary" type="button" onClick={() => onPrint('delivery')}>{t('In phiếu giao hàng')}</button>}<button className="secondary" type="button" onClick={onClose}>{t('Đóng')}</button></div></div>
      <div className="order-detail-grid">
        <section><h3>{t('Sản phẩm')}</h3><div className="table-wrap"><table className="order-detail-items"><thead><tr><th>{t('Sản phẩm')}</th><th>{t('Đơn giá')}</th><th>{t('SL')}</th><th>{t('Thành tiền')}</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td><div className="order-snapshot-product">{item.image ? <img src={mediaUrl(apiUrl, item.image)} alt="" loading="lazy" onError={(event) => event.currentTarget.remove()} /> : <span className="order-snapshot-placeholder" aria-hidden="true">{t('Ảnh')}</span>}<span>{item.product_id && permissions.includes('products.view') ? <a href={`/products/${item.product_id}/edit`}>{item.product_name}</a> : <strong>{item.product_name}</strong>}<small>{item.variant_name || t('Biến thể mặc định')}{item.sku ? ` · SKU ${item.sku}` : ''}</small></span></div></td><td>{fmt(item.unit_price)}</td><td>{item.quantity}</td><td><strong>{fmt(item.line_total)}</strong></td></tr>)}</tbody></table></div>
          <div className="order-totals"><p><span>{t('Tạm tính')}</span><b>{fmt(order.subtotal)}</b></p><p><span>{t('Giảm giá mã')}{order.coupon_code ? ` · ${order.coupon_code}` : ''}</span><b>−{fmt(Math.max(0, order.discount_total - (order.membership_discount_total ?? 0)))}</b></p>{(order.membership_points_used ?? 0) > 0 && <p><span>{t('Điểm thành viên')} · {(order.membership_points_used ?? 0).toLocaleString('vi-VN')} điểm</span><b>−{fmt(order.membership_discount_total ?? 0)}</b></p>}<p><span>{t('Vận chuyển')}</span><b>{fmt(order.shipping_fee)}</b></p><p><strong>{t('Tổng cộng')}</strong><strong>{fmt(order.grand_total)}</strong></p></div>
          <h3>{t('Thanh toán')}</h3>{canUpdate && <div className="order-detail-actions">{order.payment_method === 'cod' && order.payment_status === 'unpaid' && <button className="secondary" type="button" onClick={() => setPaymentDialog(true)}>{t('Đánh dấu đã thu COD')}</button>}{hasRefundablePayment && order.payment_status === 'paid' && (order.status === 'delivered' || order.status === 'returned') && <button className="secondary" type="button" onClick={() => onRefund(order)}>{t('Hoàn tiền')}</button>}</div>}
          {order.payments.length ? <div className="order-payment-list">{order.payments.map((payment) => <article className="order-payment-card" key={payment.id}><div><strong>{payment.provider || order.payment_method}</strong><StatusBadge kind="payment" status={payment.status} /></div><p>{fmt(payment.amount)}{payment.transaction_ref ? ` · ${payment.transaction_ref}` : ''}</p><small>{payment.paid_at ? t('Đã thanh toán {{date}}', { date: formatDateTime(payment.paid_at) }) : t('Tạo lúc {{date}}', { date: formatDateTime(payment.created_at) })}</small>{Number(payment.refunded_amount ?? 0) > 0 && <p>{t('Đã hoàn {{amount}} · Còn có thể hoàn {{remaining}}', { amount: fmt(payment.refunded_amount ?? 0), remaining: fmt(payment.refundable_amount ?? 0) })}</p>}{payment.refunds?.map((refund) => <small key={refund.id}>{t('Hoàn {{amount}} · {{reason}} · {{staff}} · {{date}}', { amount: fmt(refund.amount), reason: refund.reason, staff: refund.recorded_by_name ?? t('Quản trị viên'), date: formatDateTime(refund.created_at) })}</small>)}<details><summary>{t('Xem payload')}</summary><pre>{payloadText(payment.payload, t)}</pre></details></article>)}</div> : <p>{t('Chưa có giao dịch thanh toán.')}</p>}
        </section>
        <section><h3>{order.fulfillment_type === 'pickup' ? t('Khách hàng & nhận tại cửa hàng') : t('Khách hàng & giao hàng')}</h3><p><strong>{order.customer_id && permissions.includes('customers.view') ? <a href={`/customers/${order.customer_id}`}>{order.customer_name}</a> : order.customer_name}</strong><br />{order.customer_email && <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>}<br />{order.customer_phone}</p>{order.fulfillment_type === 'pickup' && order.pickup_location ? <p><strong>{order.pickup_location.name}</strong><br />{order.pickup_location.address}, {order.pickup_location.ward_name}, {order.pickup_location.province_name}<br />{order.pickup_location.phone}<br />{order.pickup_location.opening_hours}<br /><small>{order.status === 'shipping' ? t('Sẵn sàng để khách đến nhận.') : order.status === 'delivered' || order.status === 'completed' ? t('Khách đã nhận hàng.') : t('Đơn hàng đang được chuẩn bị tại cửa hàng.')}</small></p> : <p>{address || t('Chưa có thông tin địa chỉ.')}</p>}{order.invoice_requested && <section className="order-invoice-request" aria-labelledby="order-invoice-request-title"><h4 id="order-invoice-request-title">{t('Yêu cầu hóa đơn VAT')}</h4><dl><div><dt>{t('Mã số thuế')}</dt><dd>{order.invoice_tax_code || '—'}</dd></div><div><dt>{t('Tên công ty')}</dt><dd>{order.invoice_company_name || '—'}</dd></div><div><dt>{t('Địa chỉ hóa đơn')}</dt><dd>{order.invoice_address || '—'}</dd></div></dl></section>}{order.fulfillment_type !== 'pickup' && canEditAddress && <button type="button" className="secondary" onClick={() => onEditAddress(order)}>{t('Sửa địa chỉ')}</button>}{canUpdate && !canEditAddress && <small>{t('Không thể sửa địa chỉ sau khi đơn đã giao, hoàn hoặc hủy.')}</small>}{order.note && <p><strong>{t('Ghi chú khách:')}</strong> {order.note}</p>}
          {order.fulfillment_type !== 'pickup' && <><h3>{t('Vận chuyển')}</h3>{canUpdate && <button className="secondary" type="button" onClick={() => onEditShipment(order)}>{order.shipments.length ? t('Cập nhật vận đơn') : t('Tạo vận đơn')}</button>}{order.shipments.length ? <div className="order-shipment-list">{order.shipments.map((shipment) => <article key={shipment.id}><strong>{shipment.carrier ?? t('Chưa có đơn vị')}</strong><span>{shipment.tracking_code ?? t('Chưa có mã vận đơn')}</span><span>{t(shipmentLabel[shipment.status] ?? shipment.status)}</span><small>{t('Gửi:')} {shipment.shipped_at ? formatDateTime(shipment.shipped_at) : '—'} · {t('Giao:')} {shipment.delivered_at ? formatDateTime(shipment.delivered_at) : '—'}</small></article>)}</div> : <p>{t('Chưa tạo vận đơn.')}</p>}</>}
          <h3>{t('Lịch sử trạng thái & ghi chú nội bộ')}</h3><ol className="order-history-timeline">{order.history.map((entry) => <li key={entry.id}><b>{entry.type === 'internal_note' ? t('Ghi chú nội bộ') : `${entry.from_status ? `${getStatusLabel('order', entry.from_status)} → ` : ''}${getStatusLabel('order', entry.to_status)}`}</b><small>{formatDateTime(entry.created_at)} · {entry.changed_by_name ?? t('Hệ thống')}{entry.note ? ` · ${entry.note}` : ''}</small></li>)}</ol>
        </section>
      </div>
    </section>
    <OrderChangeRequestsPanel requests={order.change_requests} deliveredAt={order.delivered_at} canReview={canUpdate} onReview={onReviewChangeRequest} />
    {paymentDialog && <dialog className="account-dialog" open aria-labelledby="order-payment-dialog-title"><div className="account-dialog-heading"><h2 id="order-payment-dialog-title">{t('Xác nhận đã thu COD · {{code}}', { code: order.code })}</h2><button className="icon-button" type="button" aria-label={t('Đóng')} onClick={closePaymentDialog}>×</button></div><form className="account-password-form" onSubmit={(event) => void savePayment(event)}><FormField id="order-payment-note" label={t('Ghi chú thu tiền')} error={paymentNoteError ? t(paymentNoteError) : ''} required><textarea value={paymentNote} onChange={(event) => { setPaymentNote(event.target.value); setPaymentNoteError('') }} minLength={3} maxLength={1000} required /></FormField>{paymentError && <p role="alert" className="account-form-error">{t(paymentError)}</p>}<div className="account-dialog-actions"><button className="secondary" type="button" disabled={paymentBusy} onClick={closePaymentDialog}>{t('Hủy')}</button><button className="primary" type="submit" disabled={paymentBusy || paymentNote.trim().length < 3}>{paymentBusy ? t('Đang lưu…') : t('Xác nhận đã thu')}</button></div></form></dialog>}
  </>
}
