import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import './ReferralProgramPage.css'

export function ReferralProgramPage() {
  return <section className="marketing-program-page container" aria-labelledby="referral-page-title">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Giới thiệu bạn bè</span></nav>
    <header className="marketing-program-hero marketing-program-hero--referral"><p className="eyebrow">CHIA SẺ ĐIỀU BẠN YÊU</p><h1 id="referral-page-title">Mặc đẹp hơn<br /><em>khi có nhau.</em></h1><p>Mời người thân cùng khám phá những thiết kế bạn yêu thích. Quyền lợi sẽ được hiển thị tại đây khi chương trình chính thức mở.</p><Link className="button dark" to="/register">Tạo tài khoản <span aria-hidden="true">↗</span></Link></header>
    <section className="referral-code-card" aria-labelledby="referral-code-title">
      <div><p className="eyebrow">MÃ GIỚI THIỆU CỦA BẠN</p><h2 id="referral-code-title">Mã mời sẽ sớm có mặt</h2><p>Đăng nhập để tham gia. Mã và liên kết chia sẻ sẽ xuất hiện sau khi chính sách chương trình được cửa hàng xác nhận.</p><Link className="underline" to="/login?returnTo=%2Frefer-a-friend">Đăng nhập để theo dõi chương trình</Link></div>
      <div className="referral-code-card__placeholder" aria-label="Mã giới thiệu chưa được cấp"><span>••••••••</span><button type="button" disabled aria-disabled="true">Sao chép mã</button></div>
    </section>
    <section className="marketing-program-benefits" aria-labelledby="referral-benefits-title"><div className="marketing-program-section-heading"><p className="eyebrow">QUYỀN LỢI ĐÔI BÊN</p><h2 id="referral-benefits-title">Một lời mời, hai niềm vui</h2><p>Chi tiết quà tặng và điều kiện áp dụng sẽ được cập nhật sau khi cửa hàng duyệt chính sách.</p></div><div className="marketing-program-benefit-grid"><article><span>01</span><h3>Dành cho bạn</h3><p>Quyền lợi khi người thân tham gia và mua sắm sẽ được công bố cùng thể lệ chính thức.</p><small>Chưa công bố</small></article><article><span>02</span><h3>Dành cho người được mời</h3><p>Ưu đãi chào mừng sẽ được áp dụng theo điều kiện của chương trình khi mở đăng ký.</p><small>Chưa công bố</small></article></div></section>
    <section className="referral-history" aria-labelledby="referral-history-title"><div className="marketing-program-section-heading"><p className="eyebrow">HÀNH TRÌNH CỦA BẠN</p><h2 id="referral-history-title">Bạn đã giới thiệu ai?</h2></div><div className="referral-history__empty"><span aria-hidden="true">↗</span><p>Lịch sử lời mời sẽ hiển thị sau khi chương trình được kết nối.</p></div></section>
    <p className="marketing-program-disclaimer">Trang đang ở giai đoạn hoàn thiện giao diện. Mã mời, quyền lợi và lịch sử chưa được tạo hoặc lưu trong hệ thống.</p>
  </section>
}

export function AffiliateProgramPage() {
  const [feedback, setFeedback] = useState('')

  const previewApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setFeedback('Thông tin đã được kiểm tra trên giao diện, chưa được gửi hoặc lưu vào hệ thống.')
  }

  return <section className="marketing-program-page container" aria-labelledby="affiliate-page-title">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Cộng tác viên</span></nav>
    <header className="marketing-program-hero marketing-program-hero--affiliate"><p className="eyebrow">SARADA · CỘNG TÁC CÙNG CHÚNG TÔI</p><h1 id="affiliate-page-title">Gu thẩm mỹ<br /><em>có thể lan tỏa.</em></h1><p>Chia sẻ những thiết kế bạn tin tưởng và đồng hành cùng Sarada. Điều kiện tham gia, hoa hồng và lịch thanh toán sẽ được công bố trong thể lệ chính thức.</p><a className="button dark" href="#affiliate-application">Tìm hiểu cách tham gia <span aria-hidden="true">↓</span></a></header>
    <section className="affiliate-steps" aria-labelledby="affiliate-steps-title"><div className="marketing-program-section-heading"><p className="eyebrow">CÁCH THỨC</p><h2 id="affiliate-steps-title">Ba bước đồng hành</h2></div><ol><li><span>01</span><h3>Gửi thông tin</h3><p>Cho cửa hàng biết kênh nội dung và cách liên hệ với bạn.</p></li><li><span>02</span><h3>Chờ xét duyệt</h3><p>Điều kiện và tiêu chí duyệt sẽ theo chương trình đã được phê duyệt.</p></li><li><span>03</span><h3>Chia sẻ có trách nhiệm</h3><p>Thông tin hoa hồng và đối soát sẽ được gửi khi chương trình sẵn sàng.</p></li></ol></section>
    <section id="affiliate-application" className="affiliate-application" aria-labelledby="affiliate-application-title"><div className="marketing-program-section-heading"><p className="eyebrow">ĐĂNG KÝ QUAN TÂM</p><h2 id="affiliate-application-title">Để lại thông tin</h2><p>Đây là bản xem trước biểu mẫu. Hồ sơ chưa được gửi đi.</p></div><form onSubmit={previewApplication}><label>Họ và tên<input autoComplete="name" maxLength={120} required placeholder="Tên của bạn" /></label><label>Email<input type="email" autoComplete="email" maxLength={254} required placeholder="ten@email.com" /></label><label>Kênh nội dung chính<select defaultValue=""><option value="" disabled>Chọn kênh</option><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>YouTube</option><option>Blog / Website</option><option>Khác</option></select></label><label>Liên kết kênh của bạn<input type="url" maxLength={2048} required placeholder="https://…" /></label><label className="affiliate-application__wide">Giới thiệu ngắn<textarea rows={4} maxLength={600} placeholder="Chia sẻ về nội dung và cộng đồng của bạn…" /></label><div className="affiliate-application__actions"><button className="button dark" type="submit">Xem trước hồ sơ <span aria-hidden="true">↗</span></button><p role="status" aria-live="polite">{feedback}</p></div></form></section>
    <p className="marketing-program-disclaimer">Chưa có hồ sơ cộng tác viên nào được gửi hoặc lưu. Không có mức hoa hồng hay điều kiện tham gia nào được cam kết trên trang xem trước này.</p>
  </section>
}
