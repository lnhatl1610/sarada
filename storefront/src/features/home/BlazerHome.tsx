import { useState } from 'react'
import { Link } from 'react-router'
import { Search, ShoppingBag, UserRound, X } from 'lucide-react'
import './BlazerHome.css'

function BlazerNavigation({ storeName }: { storeName: string }) {
  return <header className="blazer-nav">
    <Link className="blazer-logo" to="/" aria-label={`${storeName} — Home`}>Blzr</Link>
    <nav aria-label="Main navigation" className="blazer-links">
      <Link to="/" aria-current="page">Home</Link>
      <Link to="/products">Shop</Link>
      <Link to="/pages/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
    <div className="blazer-tools">
      <Link to="/search" aria-label="Tìm kiếm sản phẩm"><Search /></Link>
      <Link to="/account" aria-label="Tài khoản"><UserRound /></Link>
      <Link to="/cart" aria-label="Giỏ hàng"><ShoppingBag /></Link>
    </div>
  </header>
}

function BlazerFeature() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return <aside className="blazer-feature" aria-label="Bộ sưu tập blazer">
    <Link to="/search?q=blazer" className="blazer-feature-link">
      <img src="/blazer-detail.webp" alt="Áo blazer nữ màu đen" width="55" height="54" />
      <span className="blazer-feature-copy"><strong>Blazer for Women</strong><span className="blazer-feature-label">THE TAILORING EDIT</span><span>Confidence in every detail.</span><small>Discover the collection</small></span>
    </Link>
    <button type="button" aria-label="Đóng gợi ý bộ sưu tập" onClick={() => setVisible(false)}><X /></button>
  </aside>
}

export function BlazerHome({ storeName = 'Sarada' }: { storeName?: string }) {
  return <div className="blazer-home">
    <section className="blazer-stage" aria-labelledby="blazer-title">
      <BlazerNavigation storeName={storeName} />
      <h1 id="blazer-title" className="blazer-title">NEW FASHION</h1>
      <div className="blazer-intro">
        <p>Explore our curated collection of business attire that blends confidence with comfort.</p>
        <Link className="blazer-explore" to="/products">Explore Now</Link>
      </div>
      <img className="blazer-model" src="/blazer-model.png" alt="Người mẫu mặc blazer xám và quần trắng, ngồi trên ghế cao" width="150" height="366" fetchPriority="high" />
      <div className="blazer-gallery" aria-label="Khám phá bộ sưu tập">
        {[1, 2, 3].map((look) => <Link key={look} to="/search?q=blazer" aria-label={`Khám phá phong cách blazer ${look}`}><img src={`/blazer-look-${look}.webp`} alt={`Phong cách blazer xám ${look}`} width={look === 3 ? 56 : 98} height="101" /></Link>)}
      </div>
      <BlazerFeature />
    </section>
  </div>
}
