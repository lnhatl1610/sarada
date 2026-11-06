import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, MapPin, PackageCheck, WalletCards } from 'lucide-react'
import './StorefrontCheckoutUiFirst.css'

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`

export function StorefrontCheckoutUiFirst({ storeName = 'Sarada' }: { storeName?: string }) {
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [payment, setPayment] = useState<'cod' | 'bank'>('cod')
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setError('')
    setSubmitted(true)
  }

  return <div className="ui-first-checkout">
    <header><Link to="/?mode=ui" className="ui-first-checkout__brand">{storeName}<span>®</span></Link><div><LockKeyhole size={14} /> THANH TOÁN AN TOÀN</div><Link to="/cart?mode=ui" aria-label="Quay lại giỏ hàng"><ArrowLeft size={18} /></Link></header>
    <main><div className="ui-first-checkout__crumb"><Link to="/cart?mode=ui"><ArrowLeft size={14} /> Giỏ hàng</Link><span>/</span><span>Thanh toán</span></div>{submitted ? <section className="ui-first-checkout__success" role="status"><span><Check size={22} /></span><p>BẢN XEM GIAO DIỆN</p><h1>Đơn hàng<br /><em>chưa được tạo.</em></h1><p>Thông tin bạn vừa nhập chỉ được dùng trong bản xem trước và không gửi đến máy chủ.</p><Link to="/products?mode=ui">Quay lại cửa hàng <ArrowRight size={15} /></Link></section> : <><div className="ui-first-checkout__title"><p>BƯỚC CUỐI</p><h1>Hoàn tất<br /><em>lựa chọn của bạn.</em></h1></div><form onSubmit={placeOrder} className="ui-first-checkout__layout" noValidate>
      <div className="ui-first-checkout__sections">
        <section className="ui-first-checkout__section"><div className="ui-first-checkout__section-title"><span>01</span><div><h2>Thông tin liên hệ</h2><p>Nhận cập nhật về đơn hàng của bạn.</p></div></div><div className="ui-first-checkout__fields"><label>Email<input type="email" autoComplete="email" required placeholder="ten@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="ui-first-checkout__check"><input type="checkbox" /> Gửi tôi tin tức về bộ sưu tập mới</label></div></section>
        <section className="ui-first-checkout__section"><div className="ui-first-checkout__section-title"><span>02</span><div><h2>Nhận hàng</h2><p>Chọn cách bạn muốn nhận sản phẩm.</p></div></div><div className="ui-first-checkout__choice-grid"><button type="button" aria-pressed={fulfillment === 'delivery'} onClick={() => setFulfillment('delivery')}><MapPin size={18} /><strong>Giao hàng</strong><small>Phí và thời gian sẽ hiển thị khi kết nối.</small></button><button type="button" aria-pressed={fulfillment === 'pickup'} onClick={() => setFulfillment('pickup')}><PackageCheck size={18} /><strong>Nhận tại cửa hàng</strong><small>Địa điểm nhận sẽ hiển thị theo cấu hình.</small></button></div>{fulfillment === 'delivery' ? <div className="ui-first-checkout__fields"><label>Họ và tên<input autoComplete="name" required placeholder="Tên người nhận" /></label><label>Số điện thoại<input type="tel" autoComplete="tel" inputMode="tel" required placeholder="09xx xxx xxx" /></label><label>Tỉnh / thành<input autoComplete="address-level1" required placeholder="Chọn tỉnh / thành" /></label><label>Quận / huyện<input autoComplete="address-level2" placeholder="Chọn quận / huyện" /></label><label className="ui-first-checkout__wide">Địa chỉ cụ thể<input autoComplete="street-address" required placeholder="Số nhà, tên đường" /></label><label className="ui-first-checkout__wide">Ghi chú giao hàng<textarea rows={2} placeholder="Ghi chú cho cửa hàng (không bắt buộc)" /></label></div> : <div className="ui-first-checkout__pickup"><MapPin size={18} /><p>Danh sách cửa hàng nhận sẽ được hiển thị sau khi kết nối dữ liệu.</p></div>}</section>
        <section className="ui-first-checkout__section"><div className="ui-first-checkout__section-title"><span>03</span><div><h2>Phương thức thanh toán</h2><p>Các lựa chọn theo cấu hình cửa hàng.</p></div></div><div className="ui-first-checkout__payment-options"><label aria-pressed={payment === 'cod'}><input type="radio" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} /><span><WalletCards size={18} /><strong>Thanh toán khi nhận hàng</strong><small>COD · tùy cấu hình cửa hàng</small></span></label><label aria-pressed={payment === 'bank'}><input type="radio" name="payment" checked={payment === 'bank'} onChange={() => setPayment('bank')} /><span><WalletCards size={18} /><strong>Chuyển khoản ngân hàng</strong><small>Thông tin tài khoản tùy cấu hình</small></span></label></div></section>
        <label className="ui-first-checkout__terms"><input type="checkbox" required /> Tôi đồng ý với <Link to="/pages/terms">điều khoản mua hàng</Link> và <Link to="/pages/privacy">chính sách riêng tư</Link> <small>(trạng thái chỉ để xem giao diện)</small></label>
        {error && <p role="alert" className="ui-first-checkout__error">{error}</p>}
      </div>
      <aside className="ui-first-checkout__summary"><p className="ui-first-checkout__eyebrow">ĐƠN HÀNG CỦA BẠN</p><h2>Tóm tắt</h2><div className="ui-first-checkout__item"><img src="/ui-preview/ao-so-mi-linen.webp" alt="Áo sơ mi linen màu trắng ngà" width="800" height={"1000"} /><div><strong>Áo sơ mi linen dáng rộng</strong><small>Trắng ngà · M · SL 1</small></div><b>{money(690_000)}</b></div><dl><div><dt>Tạm tính</dt><dd>{money(690_000)}</dd></div><div><dt>Giao hàng</dt><dd>Chưa tính</dd></div><div className="ui-first-checkout__total"><dt>Tổng tạm tính</dt><dd>{money(690_000)}</dd></div></dl><button className="ui-first-checkout__submit" type="submit">Xem xác nhận <ArrowRight size={15} /></button><p>Không tạo đơn hàng ở bước này.</p><div className="ui-first-checkout__secure"><LockKeyhole size={13} /> KHÔNG GỬI THÔNG TIN ĐI</div></aside>
    </form></>}</main><footer><Link to="/?mode=ui">{storeName}®</Link><span>Thiết kế chậm, mặc thật lâu.</span><small>Thông tin liên hệ cửa hàng</small></footer>
  </div>
}

