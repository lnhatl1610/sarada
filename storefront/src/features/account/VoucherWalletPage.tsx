import { useState, type FormEvent } from 'react'
import { Check, Copy } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useCustomerVouchers, type CustomerVoucher } from './vouchers-api'
import './VoucherWalletPage.css'

type VoucherStatus = CustomerVoucher['status']
const filters: { value: VoucherStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'available', label: 'Dùng được' },
  { value: 'upcoming', label: 'Sắp có' },
  { value: 'used', label: 'Đã dùng' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'unavailable', label: 'Không khả dụng' },
]

const statusLabel: Record<VoucherStatus, string> = {
  available: 'Có thể dùng',
  upcoming: 'Sắp có hiệu lực',
  used: 'Đã dùng hết lượt',
  expired: 'Đã hết hạn',
  unavailable: 'Không khả dụng',
}

function offerText(voucher: CustomerVoucher, formatMoney: (amount: number) => string): string {
  if (voucher.description) return voucher.description
  if (voucher.type === 'free_ship') return 'Miễn phí giao hàng'
  if (voucher.type === 'percent') return `Giảm ${voucher.value}%${voucher.max_discount ? `, tối đa ${formatMoney(voucher.max_discount)}` : ''}`
  return `Giảm ${formatMoney(voucher.value)}`
}

export function VoucherWalletPage({ enabled, formatMoney }: { enabled: boolean; formatMoney: (amount: number) => string }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<VoucherStatus | ''>('')
  const [couponCode, setCouponCode] = useState('')
  const [copyingCode, setCopyingCode] = useState<string | null>(null)
  const [copyResult, setCopyResult] = useState<{ code: string; copied: boolean } | null>(null)
  const navigate = useNavigate()
  const query = useCustomerVouchers(enabled, page, status || undefined)
  const items = query.data?.data ?? []
  const meta = query.data?.meta
  const submitCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (code) navigate(`/cart?coupon=${encodeURIComponent(code)}`)
  }
  const copyVoucherCode = async (code: string) => {
    setCopyingCode(code)
    setCopyResult(null)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable')
      await navigator.clipboard.writeText(code)
      setCopyResult({ code, copied: true })
    } catch {
      setCopyResult({ code, copied: false })
    } finally {
      setCopyingCode(null)
    }
  }

  return <section className="container subpage voucher-wallet" aria-labelledby="voucher-wallet-title">
    <form className="voucher-wallet__add" onSubmit={submitCoupon}>
      <label htmlFor="voucher-wallet-code">{"Nh\u1eadp m\u00e3 \u01b0u \u0111\u00e3i m\u1edbi"}</label>
      <div><input id="voucher-wallet-code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} maxLength={100} autoCapitalize="characters" autoComplete="off" placeholder="Voucher" /><button className="button dark" type="submit" disabled={!couponCode.trim()}>{"Ki\u1ec3m tra trong gi\u1ecf h\u00e0ng"}</button></div>
      <small>{"M\u00e3 s\u1ebd \u0111\u01b0\u1ee3c ki\u1ec3m tra theo gi\u1ecf h\u00e0ng v\u00e0 \u0111i\u1ec1u ki\u1ec7n hi\u1ec7n t\u1ea1i."}</small>
    </form>
    <p className="eyebrow">MÃ ƯU ĐÃI CỦA BẠN</p>
    <h1 id="voucher-wallet-title">Ví voucher</h1>
    <p className="voucher-wallet__intro">Mã ưu đãi công khai của cửa hàng và trạng thái sử dụng trên tài khoản của bạn.</p>
    <div className="voucher-wallet__filters" role="group" aria-label="Lọc trạng thái voucher">
      {filters.map((filter) => <button key={filter.value || 'all'} type="button" className={status === filter.value ? 'is-active' : ''} aria-pressed={status === filter.value} onClick={() => { setStatus(filter.value); setPage(1) }}>{filter.label}</button>)}
    </div>
    {query.isPending ? <p className="voucher-wallet__state" role="status">Đang tải voucher…</p> : query.isError ? <div className="voucher-wallet__state" role="alert"><p>Chưa tải được ví voucher.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : items.length === 0 ? <div className="voucher-wallet__state"><h2>{status ? `Chưa có mã ở trạng thái “${filters.find((filter) => filter.value === status)?.label}”` : 'Chưa có voucher'}</h2><p>Mã ưu đãi đang hoạt động sẽ xuất hiện tại đây.</p><Link to="/products">Tiếp tục mua sắm</Link></div> : <>
      <div className="voucher-wallet__list">{items.map((voucher) => <article className={`voucher-card is-${voucher.status}`} key={voucher.id}>
        <div className="voucher-card__offer"><b>{offerText(voucher, formatMoney)}</b><span>{voucher.code}</span><button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm px-2 font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60" type="button" aria-label={`Sao chép mã ${voucher.code}`} aria-describedby={copyResult?.code === voucher.code ? `voucher-copy-${voucher.id}` : undefined} disabled={copyingCode === voucher.code} onClick={() => void copyVoucherCode(voucher.code)}>{copyResult?.code === voucher.code && copyResult.copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copyingCode === voucher.code ? 'Đang sao chép…' : copyResult?.code === voucher.code && copyResult.copied ? 'Đã sao chép' : 'Sao chép mã'}</button>{copyResult?.code === voucher.code && <p id={`voucher-copy-${voucher.id}`} className="text-sm text-muted-foreground" role={copyResult.copied ? 'status' : 'alert'}>{copyResult.copied ? `Đã sao chép mã ${voucher.code}.` : `Không thể sao chép mã ${voucher.code}. Hãy chọn và sao chép mã hiển thị phía trên.`}</p>}</div>
        <div className="voucher-card__details">
          <span className={`voucher-card__status is-${voucher.status}`}>{statusLabel[voucher.status]}</span>
          <p>Đơn tối thiểu {formatMoney(voucher.min_order_value)}</p>
          {voucher.usage_per_user !== null && <p>Đã dùng {voucher.usage_count}/{voucher.usage_per_user} lượt</p>}
          {voucher.starts_at && <p>Bắt đầu: {new Date(voucher.starts_at).toLocaleDateString('vi-VN')}</p>}
          {voucher.ends_at && <p>Hạn dùng: {new Date(voucher.ends_at).toLocaleDateString('vi-VN')}</p>}
          {voucher.unavailable_reason && <small>{voucher.unavailable_reason}</small>}
        </div>
        {voucher.status === 'available' && <Link className="button dark" to={`/cart?coupon=${encodeURIComponent(voucher.code)}`}>Dùng ngay</Link>}
      </article>)}</div>
      {meta && meta.last_page > 1 && <nav className="voucher-wallet__pagination" aria-label="Phân trang voucher">
        <button type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</button>
        <span>Trang {meta.current_page}/{meta.last_page}</span>
        <button type="button" disabled={page >= meta.last_page || query.isFetching} onClick={() => setPage((current) => current + 1)}>Sau</button>
      </nav>}
    </>}
  </section>
}
