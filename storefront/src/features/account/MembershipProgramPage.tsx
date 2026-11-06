import { Link } from 'react-router'
import type { useMembershipProgram } from './membership-api'
import './MembershipProgramPage.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function MembershipProgramPage({ query }: { query: ReturnType<typeof useMembershipProgram> }) {
  const data = query.data?.data

  return <main className="container subpage membership-program">
    <p className="eyebrow">CHƯƠNG TRÌNH THÀNH VIÊN</p>
    <h1>Mua sắm, tích điểm, nhận thêm quyền lợi</h1>
    <p className="membership-program__intro">Tài khoản thành viên tích lũy điểm sau khi đơn hàng được giao và thanh toán. Hạng được xét theo chi tiêu đủ điều kiện trong 12 tháng gần nhất.</p>
    {query.isPending ? <p className="membership-program__state" role="status">Đang tải quyền lợi thành viên…</p>
      : query.isError ? <section className="membership-program__state" role="alert"><p>Chưa tải được thông tin chương trình.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></section>
        : data ? <>
          <div className="membership-program__tiers">{data.tiers.map((tier) => <article key={tier.key}>
            <p className="eyebrow">HẠNG THÀNH VIÊN</p>
            <h2>{tier.name}</h2>
            <p>Từ {money.format(tier.threshold_vnd)} chi tiêu trong 12 tháng</p>
            <p>Hệ số tích điểm {(tier.earn_rate_basis_points / 10_000).toLocaleString('vi-VN')}×</p>
            <ul>{tier.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
          </article>)}</div>
          <section className="membership-program__rules" aria-labelledby="membership-program-rules-title">
            <h2 id="membership-program-rules-title">Cách tích điểm</h2>
            <p>Điểm được cộng sau khi đơn đã giao và thanh toán. Điểm hết hạn sau {data.points_expire_after_months} tháng.</p>
            <p>Giá trị quy đổi hiện tại: 1 điểm tương đương {money.format(data.point_value_vnd)}.</p>
          </section>
          <div className="membership-program__actions"><Link className="button dark" to="/register">Tạo tài khoản</Link><Link to="/account/membership">Đã là thành viên? Xem điểm của bạn</Link></div>
        </> : null}
  </main>
}
