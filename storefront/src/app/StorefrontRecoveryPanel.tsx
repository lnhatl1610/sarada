import { Form, Link } from 'react-router'

type StorefrontRecoveryPanelProps = {
  code: string
  title: string
  message: string
  onRetry?: () => void
}

export function StorefrontRecoveryPanel({ code, title, message, onRetry }: StorefrontRecoveryPanelProps) {
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
      <Form className="storefront-recovery__search" method="get" action="/search" role="search">
        <label htmlFor="storefront-recovery-query">Tìm sản phẩm</label>
        <div>
          <input id="storefront-recovery-query" name="q" type="search" placeholder="Ví dụ: áo sơ mi, quần jeans" />
          <button className="button dark" type="submit">Tìm kiếm</button>
        </div>
      </Form>
      <nav className="storefront-recovery__suggestions" aria-label="Gợi ý tìm kiếm">
        <span>Gợi ý tìm kiếm:</span>
        <Link to="/search?q=%C3%A1o+s%C6%A1+mi">Áo sơ mi</Link>
        <Link to="/search?q=qu%E1%BA%A7n+jeans">Quần jeans</Link>
        <Link to="/search?q=%C4%91%E1%BA%A7m">Đầm</Link>
      </nav>
      {quickLinks.length > 0 && <nav className="storefront-recovery__quick-links" aria-label="Lối tắt phổ biến">{quickLinks.map((item) => <Link key={item.href} to={item.href}>{item.label}</Link>)}</nav>}
      <div className="storefront-recovery__actions">
        {onRetry && <button className="button light" type="button" onClick={onRetry}>Thử tải lại</button>}
        <Link className="button dark" to="/">Về trang chủ</Link>
      </div>
    </section>
  )
}
