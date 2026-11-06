import { Link } from 'react-router'
import type { MembershipSummaryData } from './membership-api'

export function MembershipSummaryCard({ summary, compact = false }: { summary?: MembershipSummaryData; compact?: boolean }) {
  if (!summary) return null
  const goal = summary.next_tier
  const toNextTier = goal ? Math.max(0, goal.threshold_vnd - summary.spend_12_months_vnd) : 0

  return <section className={`membership-summary${compact ? ' membership-summary--compact' : ''}`} aria-label="Hạng thành viên và điểm">
    <div className="membership-summary__heading"><span>THÀNH VIÊN {summary.tier.name.toLocaleUpperCase('vi-VN')}</span><strong>{summary.current_points.toLocaleString('vi-VN')} điểm</strong></div>
    <div className="membership-summary__progress" role="progressbar" aria-label={goal ? `Tiến độ lên hạng ${goal.name}` : 'Đã đạt hạng cao nhất'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress_percent}><span style={{ width: `${summary.progress_percent}%` }} /></div>
    {goal ? <p>Còn {toNextTier.toLocaleString('vi-VN')} VND chi tiêu đủ điều kiện để lên hạng {goal.name}.</p> : <p>Bạn đang ở hạng thành viên cao nhất.</p>}
    {!compact && <Link to="/account/membership">Xem quyền lợi và lịch sử điểm</Link>}
  </section>
}
