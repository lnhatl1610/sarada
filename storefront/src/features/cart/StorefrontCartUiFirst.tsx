import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Minus, Plus, Tag, Trash2 } from 'lucide-react'
import './StorefrontCartUiFirst.css'

const initialLine = { name: 'Áo sơ mi linen dáng rộng', color: 'Trắng ngà', size: 'M', price: 690_000, image: '/ui-preview/ao-so-mi-linen.webp' }
const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`

export function StorefrontCartUiFirst({ storeName = 'Sarada' }: { storeName?: string }) {
  const [line, setLine] = useState<typeof initialLine | null>(initialLine)
  const [quantity, setQuantity] = useState(1)
  const [coupon, setCoupon] = useState('')
  const [couponNotice, setCouponNotice] = useState('')
  const subtotal = line ? line.price * quantity : 0

  return <div className="ui-first-cart">
    <header><Link to="/?mode=ui" className="ui-first-cart__brand">{storeName}<span>®</span></Link><span>GIỎ HÀNG</span><Link to="/products?mode=ui" aria-label="Tiếp tục mua sắm"><ArrowLeft size={18} /></Link></header>
    <main><div className="ui-first-cart__crumb"><Link to="/products?mode=ui"><ArrowLeft size={14} /> Tiếp tục mua sắm</Link><span>/</span><span>Giỏ hàng</span></div><div className="ui-first-cart__heading"><div><p>GIỎ CỦA BẠN</p><h1>Những lựa chọn<br /><em>đang chờ bạn.</em></h1></div><span>{line ? '01' : '00'} sản phẩm</span></div>
      {line ? <div className="ui-first-cart__layout"><section aria-label="Sản phẩm trong giỏ"><div className="ui-first-cart__table-head"><span>Sản phẩm</span><span>Giá</span><span>Số lượng</span><span>Tạm tính</span></div><article className="ui-first-cart__line"><img src={line.image} alt="Áo sơ mi linen màu trắng ngà" width="800" height="1000" /><div className="ui-first-cart__product"><small>ÁO</small><h2>{line.name}</h2><p>Màu: {line.color} <span>·</span> Size: {line.size}</p><button type="button" className="ui-first-cart__remove" onClick={() => setLine(null)}><Trash2 size={14} /> Xóa</button></div><strong className="ui-first-cart__unit-price">{money(line.price)}</strong><div className="ui-first-cart__quantity"><button type="button" aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button><output>{quantity}</output><button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity((value) => value + 1)}><Plus size={14} /></button></div><strong className="ui-first-cart__line-total">{money(subtotal)}</strong></article><Link className="ui-first-cart__continue" to="/products?mode=ui"><ArrowLeft size={14} /> Tiếp tục xem sản phẩm</Link></section>
        <aside className="ui-first-cart__summary"><p className="ui-first-cart__eyebrow">TÓM TẮT ĐƠN HÀNG</p><h2>Đơn hàng của bạn</h2><form onSubmit={(event) => { event.preventDefault(); setCouponNotice(coupon.trim() ? 'Mã sẽ được xác nhận ở bước thanh toán.' : 'Nhập mã ưu đãi để tiếp tục.') }}><label htmlFor="ui-first-cart-coupon"><Tag size={15} /> Mã ưu đãi</label><div><input id="ui-first-cart-coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Nhập mã ưu đãi" /><button type="submit">Áp dụng</button></div>{couponNotice && <small role="status">{couponNotice}</small>}</form><dl><div><dt>Tạm tính</dt><dd>{money(subtotal)}</dd></div><div><dt>Giao hàng</dt><dd>Hiển thị tại bước tiếp theo</dd></div><div className="ui-first-cart__grand-total"><dt>Tổng tạm tính</dt><dd>{money(subtotal)}</dd></div></dl><Link className="ui-first-cart__checkout" to="/checkout?mode=ui">Tiếp tục thanh toán <ArrowRight size={16} /></Link><p>Thông tin chưa được lưu.</p><div className="ui-first-cart__payment-mark">THÔNG TIN THANH TOÁN ĐƯỢC BẢO VỆ</div></aside></div> : <section className="ui-first-cart__empty"><span>01 / 01</span><h2>Chiếc túi đang chờ<br />món đồ đầu tiên.</h2><p>Hãy khám phá các thiết kế để bắt đầu lựa chọn của bạn.</p><Link to="/products?mode=ui">Khám phá sản phẩm <ArrowRight size={15} /></Link></section>}
    </main><footer><Link to="/?mode=ui">{storeName}®</Link><span>Thiết kế chậm, mặc thật lâu.</span><small>Nội dung và giá trị chỉ dùng để xem bố cục.</small></footer>
  </div>
}

