import { lazy, Suspense } from 'react'
import { Form, Link } from 'react-router'

const NotFoundProductSuggestions = lazy(() => import('../features/catalog/NotFoundProductSuggestions').then((module) => ({ default: module.NotFoundProductSuggestions })))

type StorefrontRecoveryPanelProps = {
  code: string
  title: string
  message: string
  onRetry?: () => void
  showSupport?: boolean
}

export function StorefrontRecoveryPanel({ code, title, message, onRetry, showSupport = false }: StorefrontRecoveryPanelProps) {
  const canSearch = code === '404' || code === 'BẢO TRÌ'
  const quickLinks = code === '404' ? [
    { href: '/products', label: 'Tất cả sản phẩm' },
    { href: '/new-arrivals', label: 'Hàng mới' },
    { href: '/collections', label: 'Bộ sưu tập' },
    { href: '/stores', label: 'Hệ thống cửa hàng' },
  ] : []

  return (
    <section className="storefront-recovery" aria-labelledby="storefront-recovery-title">
      <p className="eyebrow">SARADA</p>
      <p className="eyebrow">{code}</p>
      <h1 id="storefront-recovery-title">{title}</h1>
      <p className="storefront-recovery__message">{message}</p>
      {canSearch && <Form className="storefront-recovery__search" method="get" action="/search" role="search">
        <label htmlFor="storefront-recovery-query">Tìm sản phẩm</label>
        <div>
          <input id="storefront-recovery-query" name="q" type="search" placeholder="Ví dụ: áo sơ mi, quần jeans" />
          <button className="button dark" type="submit">Tìm kiếm</button>
        </div>
      </Form>}
      {canSearch && <nav className="storefront-recovery__suggestions" aria-label="Gợi ý tìm kiếm">
        <span>Gợi ý tìm kiếm:</span>
        <Link to="/search?q=%C3%A1o+s%C6%A1+mi">Áo sơ mi</Link>
        <Link to="/search?q=qu%E1%BA%A7n+jeans">Quần jeans</Link>
        <Link to="/search?q=%C4%91%E1%BA%A7m">Đầm</Link>
      </nav>}
      {quickLinks.length > 0 && <nav className="storefront-recovery__quick-links" aria-label="Lối tắt phổ biến">{quickLinks.map((item) => <Link key={item.href} to={item.href}>{item.label}</Link>)}</nav>}
      {code === '404' && <Suspense fallback={<p className="mt-10 text-sm text-muted-foreground" role="status">Đang tải gợi ý sản phẩm…</p>}><NotFoundProductSuggestions /></Suspense>}
      <div className="storefront-recovery__actions">
        {showSupport && <Link className="button light" to="/contact">Liên hệ hỗ trợ</Link>}
        {onRetry && <button className="button light" type="button" onClick={onRetry}>Thử tải lại</button>}
        <Link className="button dark" to="/">Về trang chủ</Link>
      </div>
    </section>
  )
}
