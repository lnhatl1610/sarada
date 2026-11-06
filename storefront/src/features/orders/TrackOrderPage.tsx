import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'
import { formatOrderStatus, formatPaymentStatus } from './order-status'
import './TrackOrderPage.css'
import '../../Auth.css'

const trackingSchema = z.object({
  code: z.string().trim().min(1, 'Nhập mã đơn hàng.').max(32, 'Mã đơn hàng không hợp lệ.'),
  contact: z.string().trim().min(1, 'Nhập số điện thoại hoặc email đã dùng khi đặt hàng.').max(255, 'Thông tin liên hệ không hợp lệ.').refine((value) => value.includes('@') ? z.email().safeParse(value).success : value.length <= 32, 'Nhập email hợp lệ hoặc số điện thoại không quá 32 ký tự.'),
})
type TrackingValues = z.infer<typeof trackingSchema>

function trackStatus(order: { fulfillment_type: string; status: string }) {
  if (order.fulfillment_type === 'pickup') {
    if (order.status === 'shipping') return 'Sẵn sàng nhận tại cửa hàng'
    if (order.status === 'delivered' || order.status === 'completed') return 'Đã nhận hàng'
  }
  return formatOrderStatus(order.status)
}

type TrackOrderPageProps = {
  initialCode: string
  formatMoney: (amount: number) => string
}

export function TrackOrderPage({ initialCode, formatMoney }: TrackOrderPageProps) {
  const form = useForm<TrackingValues>({ resolver: zodResolver(trackingSchema), defaultValues: { code: initialCode, contact: '' } })
  const lookup = useMutation({
    mutationFn: async ({ code, contact }: TrackingValues) => {
      const identifier = contact.includes('@') ? { email: contact } : { phone: contact }
      const response = await api.get<components['schemas']['CustomerOrderDetailEnvelope']>('/orders/track', { params: { code, ...identifier } })
      if (!response.data.data) throw new Error('Không tìm thấy đơn hàng.')
      return response.data.data
    },
  })
  const lookupErrorMessage = lookup.isError
    ? isAxiosError(lookup.error) && lookup.error.response?.status === 404
      ? 'Không tìm thấy thông tin đơn hàng phù hợp.'
      : getApiErrorMessage(lookup.error, 'Không thể tra cứu đơn hàng. Vui lòng thử lại sau.')
    : null

  return <div className="container subpage track-page">
    <p className="eyebrow">THEO DÕI ĐƠN HÀNG</p>
    <h1>Đơn hàng đang ở đâu?</h1>
    <p className="auth-lede">Nhập mã đơn và số điện thoại hoặc email đã dùng khi đặt hàng.</p>
    <form className="auth-form" onSubmit={form.handleSubmit((values) => lookup.mutate(values))} noValidate>
      <label htmlFor="track-order-code">Mã đơn</label>
      <input id="track-order-code" autoComplete="off" placeholder="FS261019-ABC123" aria-invalid={Boolean(form.formState.errors.code)} aria-describedby={form.formState.errors.code ? 'track-order-code-error' : undefined} {...form.register('code')} />
      {form.formState.errors.code && <p className="auth-error" id="track-order-code-error" role="alert">{form.formState.errors.code.message}</p>}
      <label htmlFor="track-order-contact">Số điện thoại hoặc email</label>
      <input id="track-order-contact" autoComplete="off" placeholder="Số điện thoại hoặc email đặt hàng" aria-invalid={Boolean(form.formState.errors.contact)} aria-describedby={form.formState.errors.contact ? 'track-order-contact-error' : undefined} {...form.register('contact')} />
      {form.formState.errors.contact && <p className="auth-error" id="track-order-contact-error" role="alert">{form.formState.errors.contact.message}</p>}
      {lookupErrorMessage && <p className="auth-error" role="alert">{lookupErrorMessage}</p>}
      <button className="button dark full" disabled={lookup.isPending}>{lookup.isPending ? 'Đang tra cứu…' : 'Tra cứu đơn hàng'}</button>
    </form>
    {lookup.data && <section className="track-result">
      <p className="eyebrow">ĐƠN {lookup.data.code}</p>
      <h2>{trackStatus(lookup.data)}</h2>
      <p>{lookup.data.placed_at ? new Date(lookup.data.placed_at).toLocaleDateString('vi-VN') : 'Đang cập nhật ngày đặt'} · {formatPaymentStatus(lookup.data.payment_status)}</p>
      {lookup.data.fulfillment_type === 'pickup' && lookup.data.pickup_location ? <p><strong>Nhận tại {lookup.data.pickup_location.name}</strong><br />{lookup.data.pickup_location.address}, {lookup.data.pickup_location.ward_name}, {lookup.data.pickup_location.province_name}<br />Điện thoại: {lookup.data.pickup_location.phone}<br />{lookup.data.pickup_location.opening_hours}</p> : <p>{lookup.data.shipping_method?.name ?? 'Giao hàng theo tỉnh/thành'}{lookup.data.shipping_method?.est_days ? ` · Dự kiến ${lookup.data.shipping_method.est_days}` : ''}</p>}
      {lookup.data.shipments?.length > 0 && <section className="track-shipments" aria-labelledby="track-shipments-title">
        <h3 id="track-shipments-title">Thông tin vận chuyển</h3>
        {lookup.data.shipments.map((shipment) => <div className="track-shipment" key={shipment.id}>
          <span>{shipment.carrier || 'Đơn vị vận chuyển'} · {formatOrderStatus(shipment.status)}</span>
          <b>{shipment.tracking_code ? `Mã vận đơn: ${shipment.tracking_code}` : 'Mã vận đơn đang được cập nhật'}</b>
          {shipment.shipped_at && <time dateTime={shipment.shipped_at}>Gửi lúc {new Date(shipment.shipped_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</time>}
        </div>)}
      </section>}
      {lookup.data.items?.map((item, index) => <div key={`${item.product_name}-${index}`}><span>{item.product_name} × {item.quantity}</span><b>{formatMoney(item.line_total)}</b></div>)}
      <strong>Tổng cộng {formatMoney(lookup.data.grand_total)}</strong>
      {(lookup.data.refunds?.length ?? 0) > 0 && <section className="track-refunds" aria-labelledby="track-refunds-title">
        <h3 id="track-refunds-title">Hoàn tiền</h3>
        <p>Đã hoàn tổng cộng: <b>{formatMoney(lookup.data.refund_total ?? 0)}</b></p>
        <ul>{lookup.data.refunds?.map((refund, index) => <li key={`${refund.created_at}-${index}`}><span>{formatMoney(refund.amount_vnd)}</span><time dateTime={refund.created_at}>{new Date(refund.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</time></li>)}</ul>
      </section>}
      {lookup.data.history?.length ? <section className="track-timeline" aria-labelledby="track-timeline-title">
        <h3 id="track-timeline-title">Lịch sử đơn hàng</h3>
        <ol>{lookup.data.history.map((entry) => <li key={entry.id}><span className="track-timeline-dot" aria-hidden="true" /><div><b>{lookup.data.fulfillment_type === 'pickup' ? trackStatus({ fulfillment_type: 'pickup', status: entry.to_status }) : formatOrderStatus(entry.to_status)}</b>{entry.note && <p>{entry.note}</p>}<time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</time></div></li>)}</ol>
      </section> : <p className="track-timeline-empty">Lịch sử vận chuyển sẽ hiển thị khi được cập nhật.</p>}
    </section>}
  </div>
}
