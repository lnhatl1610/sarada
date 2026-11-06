import { Link } from 'react-router'
import type { useMembership } from './membership-api'
import { MembershipSummaryCard } from './MembershipSummaryCard'
import './MembershipPage.css'

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' })
const moneyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function MembershipPage({ query, page, onPageChange }: { query: ReturnType<typeof useMembership>; page: number; onPageChange: (update: (current: number) => number) => void }) {
  const data = query.data?.data
  const meta = data?.meta

  return <main className="container subpage membership-page">
    <p className="eyebrow">TÀI KHOẢN THÀNH VIÊN</p>
    <h1>Điểm và quyền lợi</h1>
    <p className="membership-page__intro">Điểm được cộng sau khi đơn đã giao và thanh toán. Điểm có hiệu lực trong 12 tháng.</p>
    {query.isPending ? <p className="membership-page__state" role="status">Đang tải thông tin thành viên…</p>
      : query.isError ? <section className="membership-page__state" role="alert"><p>Chưa tải được thông tin thành viên.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></section>
        : data ? <>
          <MembershipSummaryCard summary={data.summary} />
          {data.summary.expiring_points_30_days > 0 && <p className="membership-page__expiry" role="status">{data.summary.expiring_points_30_days.toLocaleString('vi-VN')} điểm sẽ hết hạn trong 30 ngày tới.</p>}
          <section className="membership-page__tiers" aria-labelledby="membership-tiers-title"><h2 id="membership-tiers-title">Các hạng thành viên</h2><div className="membership-page__tier-grid">{data.summary.tiers.map((tier) => <article key={tier.key} aria-current={tier.key === data.summary.tier.key ? 'true' : undefined}><h3>{tier.name}</h3><p>Từ {moneyFormat.format(tier.threshold_vnd)} chi tiêu trong 12 tháng</p><p>Hệ số tích điểm {(tier.earn_rate_basis_points / 10_000).toLocaleString('vi-VN')}×</p><ul>{tier.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></article>)}</div></section>
          <section className="membership-page__history" aria-labelledby="membership-history-title"><div className="membership-page__history-heading"><h2 id="membership-history-title">Lịch sử điểm</h2><p>Quy tắc quy đổi dự kiến: 1 điểm tương đương {moneyFormat.format(data.summary.point_value_vnd)}.</p></div>
            {data.transactions.length === 0 ? <div className="membership-page__state"><p>Chưa có giao dịch điểm.</p><Link to="/products">Khám phá sản phẩm</Link></div> : <ul>{data.transactions.map((transaction) => <li key={transaction.id}><div><strong>{transaction.description}</strong><small>{dateFormat.format(new Date(transaction.created_at))}{transaction.expires_at ? ` · Hết hạn ${dateFormat.format(new Date(transaction.expires_at))}` : ''}{transaction.is_expired ? ' · Đã hết hạn' : ''}</small></div><div><strong className={transaction.points_delta > 0 ? 'membership-points-positive' : 'membership-points-negative'}>{transaction.points_delta > 0 ? '+' : ''}{transaction.points_delta.toLocaleString('vi-VN')}</strong><small>{moneyFormat.format(transaction.amount_vnd)}</small></div></li>)}</ul>}
            {meta && meta.last_page > 1 && <nav className="membership-page__pagination" aria-label="Phân trang lịch sử điểm"><button type="button" disabled={page <= 1} onClick={() => onPageChange((current) => current - 1)}>Trang trước</button><span>Trang {meta.current_page} / {meta.last_page}</span><button type="button" disabled={page >= meta.last_page} onClick={() => onPageChange((current) => current + 1)}>Trang sau</button></nav>}
          </section>
        </> : null}
  </main>
}
