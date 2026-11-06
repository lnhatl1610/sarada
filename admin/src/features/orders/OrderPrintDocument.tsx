import { useTranslation } from 'react-i18next'
import { formatDateTime, formatVnd } from '../../lib/date-format'
import { getStatusLabel } from '../../components/shared/status-badge'
import { formatOrderAddress } from './location-utils'

type OrderPrintMode = 'invoice' | 'delivery'
type OrderPrint = {
  code: string
  placed_at: string | null
  created_at?: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  fulfillment_type?: 'delivery' | 'pickup'
  pickup_location?: { name: string; address: string; province_name: string; ward_name: string | null; phone: string; opening_hours: string } | null
  shipping_address: Record<string, string>
  note: string | null
  items: { product_name: string; variant_label?: string | null; variant_name?: string | null; sku?: string | null; quantity: number; unit_price: number; line_total: number }[]
  subtotal: number
  discount_total: number
  membership_points_used?: number
  membership_discount_total?: number
  shipping_fee: number
  grand_total: number
  payment_method: string
  payment_status: string
  coupon_code: string | null
  shipments: { carrier: string | null; tracking_code: string | null }[]
}
type Props = { orders: OrderPrint[]; mode: OrderPrintMode | null; storeName?: string | null; storeLogo?: string | null }

export function OrderPrintDocument({ orders, mode, storeName, storeLogo }: Props) {
  const { t } = useTranslation()
  if (!mode || orders.length === 0) return null
  const delivery = mode === 'delivery'

  return <div className="order-print-root" aria-hidden="true">{orders.map((order, orderIndex) => {
    const address = formatOrderAddress(order.shipping_address)
    const shipment = order.shipments[0]
    const pickup = order.fulfillment_type === 'pickup'
    const heading = delivery ? pickup ? t('PHIẾU NHẬN TẠI CỬA HÀNG') : t('PHIẾU GIAO HÀNG') : t('HÓA ĐƠN BÁN HÀNG')
    const recipientAddress = pickup && order.pickup_location ? `${order.pickup_location.name} · ${order.pickup_location.address}, ${order.pickup_location.ward_name ?? ''}, ${order.pickup_location.province_name} · ${order.pickup_location.phone} · ${order.pickup_location.opening_hours}` : address
    return <article className="order-print-page" key={`${order.code}-${orderIndex}`} aria-label={delivery ? pickup ? t('Phiếu nhận tại cửa hàng') : t('Phiếu giao hàng') : t('Hóa đơn bán hàng')}>
    <header className="order-print-header">
      <div className="order-print-store">{storeLogo && <img src={storeLogo} alt="" />}<strong>{storeName || 'Sarada'}</strong></div>
      <small>{t('Ngày in:')} {formatDateTime(new Date().toISOString())}</small>
    </header>
    <h1>{heading}</h1>
    <div className="order-print-meta"><strong>{t('Mã đơn:')} {order.code}</strong><span>{t('Ngày đặt:')} {order.placed_at ? formatDateTime(order.placed_at) : order.created_at ? formatDateTime(order.created_at) : '—'}</span></div>
    <section className="order-print-recipient">
      <h2>{delivery ? t('THÔNG TIN NGƯỜI NHẬN') : t('THÔNG TIN KHÁCH HÀNG')}</h2>
      <p><strong>{order.customer_name}</strong></p>
      <p>{t('Điện thoại:')} {order.customer_phone || '—'}{order.customer_email ? ` · ${t('Email:')} ${order.customer_email}` : ''}</p>
      <p>{pickup ? t('Điểm nhận hàng:') : t('Địa chỉ:')} {recipientAddress || t('Chưa có thông tin địa chỉ.')}</p>
      {delivery && !pickup && <p>{t('Đơn vị vận chuyển:')} {shipment?.carrier || t('Chưa xác định')} · {t('Mã vận đơn:')} {shipment?.tracking_code || t('Chưa có')}</p>}
      {!delivery && <p>{t('Thanh toán:')} {order.payment_method === 'cod' ? t('Thanh toán khi nhận hàng (COD)') : t(order.payment_method)} · {getStatusLabel('payment', order.payment_status)}{order.coupon_code ? ` · ${t('Mã giảm giá')} ${order.coupon_code}` : ''}</p>}
    </section>
    <table className="order-print-table">
      <thead><tr><th>{t('SẢN PHẨM')}</th><th>SKU</th>{delivery ? <th>{t('SL')}</th> : <><th>{t('SL')}</th><th>{t('ĐƠN GIÁ')}</th><th>{t('THÀNH TIỀN')}</th></>}</tr></thead>
      <tbody>{order.items.map((item, index) => <tr key={`${item.sku ?? item.product_name}-${index}`}>
        <td>{item.product_name}{item.variant_name || item.variant_label ? ` · ${item.variant_name || item.variant_label}` : ''}</td><td>{item.sku || '—'}</td><td>{item.quantity}</td>
        {!delivery && <><td>{formatVnd(item.unit_price)}</td><td>{formatVnd(item.line_total)}</td></>}
      </tr>)}</tbody>
    </table>
    {!delivery && <div className="order-print-totals"><p><span>{t('Tạm tính')}</span><strong>{formatVnd(order.subtotal)}</strong></p><p><span>{t('Giảm giá mã')}</span><strong>−{formatVnd(Math.max(0, order.discount_total - (order.membership_discount_total ?? 0)))}</strong></p>{(order.membership_points_used ?? 0) > 0 && <p><span>{t('Điểm thành viên')} · {(order.membership_points_used ?? 0).toLocaleString('vi-VN')}</span><strong>−{formatVnd(order.membership_discount_total ?? 0)}</strong></p>}{!pickup && <p><span>{t('Phí vận chuyển')}</span><strong>{formatVnd(order.shipping_fee)}</strong></p>}<p className="order-print-grand-total"><span>{t('TỔNG CỘNG')}</span><strong>{formatVnd(order.grand_total)}</strong></p></div>}
    {order.note && <p className="order-print-note"><strong>{t('Ghi chú:')}</strong> {order.note}</p>}
    <footer className="order-print-signatures"><div><strong>{delivery ? pickup ? t('Nhân viên cửa hàng') : t('Người giao hàng') : t('Người lập phiếu')}</strong><small>{t('(Ký và ghi rõ họ tên)')}</small></div><div><strong>{delivery ? t('Người nhận hàng') : t('Khách hàng')}</strong><small>{t('(Ký và ghi rõ họ tên)')}</small></div></footer>
    {!delivery && <small className="order-print-legal-note">{t('Chứng từ bán hàng của cửa hàng.')}</small>}
    </article>
  })}</div>
}
