import { Link } from 'react-router'
import type { components } from '../../types/api'
import '../../CheckoutSuccess.css'

type PlacedOrder = components['schemas']['StorefrontPlacedOrder']

type CheckoutSuccessPageProps = {
  code: string | undefined
  order: PlacedOrder | undefined
  formatMoney: (amount: number) => string
  showRegistrationPrompt: boolean
}

export function CheckoutSuccessPage({ code, order, formatMoney, showRegistrationPrompt }: CheckoutSuccessPageProps) {
  return (
    <div className="container subpage success-page">
      <div className="checkout-success-confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ left: `${(index * 47) % 100}%`, animationDelay: `${(index % 6) * 45}ms`, backgroundColor: ['#8e5546', '#c6a46a', '#6e8373', '#d8c9b2'][index % 4] }} />)}
      </div>
      <span className="success-icon">✓</span>
      <p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p>
      <h1>Cảm ơn bạn đã chọn SARADA.</h1>
      <p>Mã đơn hàng <strong>{code}</strong> đã được ghi nhận.</p>
      <section className="order-success-summary">
        <h2>{order?.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)'}</h2>
        {order ? (
          <>
            {order.fulfillment_type === 'pickup' && order.pickup_location ? <p className="order-success-shipping"><strong>Nhận tại {order.pickup_location.name}</strong><br />{order.pickup_location.address}, {order.pickup_location.ward_name}, {order.pickup_location.province_name}<br />Điện thoại: {order.pickup_location.phone} · {order.pickup_location.opening_hours}</p> : <p className="order-success-shipping">Giao hàng: {order.shipping_method?.name ?? 'Theo tỉnh/thành'}{order.shipping_method?.est_days ? ` · Dự kiến ${order.shipping_method.est_days}` : ''}</p>}
            <ul className="order-success-items" aria-label="Sản phẩm trong đơn hàng">
              {order.items.map((item, index) => <li key={`${item.product_name}-${index}`}><span><strong>{item.product_name}</strong>{item.variant_name && <small>{item.variant_name}</small>}<small>{item.quantity} × {formatMoney(item.unit_price)}</small></span><b>{formatMoney(item.line_total)}</b></li>)}
            </ul>
            <dl className="order-success-totals">
              <div><dt>Tạm tính</dt><dd>{formatMoney(order.subtotal)}</dd></div>
              <div><dt>Giảm giá mã</dt><dd>− {formatMoney(Math.max(0, order.discount_total - order.membership_discount_total))}</dd></div>
              {order.membership_points_used > 0 && <div><dt>Điểm thành viên · {order.membership_points_used.toLocaleString('vi-VN')} điểm</dt><dd>− {formatMoney(order.membership_discount_total)}</dd></div>}
              {order.fulfillment_type === 'delivery' && <div><dt>Phí vận chuyển</dt><dd>{formatMoney(order.shipping_fee)}</dd></div>}
              <div className="order-success-grand-total"><dt>Cần thanh toán</dt><dd>{formatMoney(order.grand_total)}</dd></div>
            </dl>
          </>
        ) : (
          <p>Dùng số điện thoại đặt hàng để xem số tiền và trạng thái đơn.</p>
        )}
      </section>
      {order?.invoice_requested && <p className="order-invoice-confirmation" role="status">Yêu cầu xuất hóa đơn VAT đã được ghi nhận cùng đơn hàng.</p>}
      {showRegistrationPrompt && <p className="success-account-prompt">Tạo tài khoản để lưu thông tin giao hàng và quản lý các đơn hàng tiếp theo thuận tiện hơn.</p>}
      <div className="success-actions">
        <Link className="button dark" to={`/track-order?code=${encodeURIComponent(code ?? '')}`}>Theo dõi đơn hàng</Link>
        {showRegistrationPrompt && <Link className="button secondary" to="/register">Tạo tài khoản</Link>}
        <Link className="button secondary" to="/products">Tiếp tục mua sắm</Link>
      </div>
    </div>
  )
}
