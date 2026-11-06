import { useState } from 'react'
import { Link } from 'react-router'
import { Search, ShoppingBag, UserRound, X } from 'lucide-react'
import '@fontsource-variable/cormorant-garamond'
import { BlazerSections } from './BlazerSections'
import './BlazerHome.css'

function BlazerNavigation({ storeName }: { storeName: string }) {
  return <header className="blazer-nav">
    <Link className="blazer-logo" to="/" aria-label={`${storeName} â€” Home`}>Blzr</Link>
    <nav aria-label="Main navigation" className="blazer-links">
      <Link to="/" aria-current="page">Home</Link>
      <Link to="/products">Shop</Link>
      <Link to="/pages/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
    <div className="blazer-tools">
      <Link to="/search" aria-label="TÃ¬m kiáº¿m sáº£n pháº©m"><Search /></Link>
      <Link to="/account" aria-label="TÃ i khoáº£n"><UserRound /></Link>
      <Link to="/cart" aria-label="Giá» hÃ ng"><ShoppingBag /></Link>
    </div>
  </header>
}

function BlazerFeature() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return <aside className="blazer-feature" aria-label="Bá»™ sÆ°u táº­p blazer">
    <Link to="/search?q=blazer" className="blazer-feature-link">
      <img src="/blazer-detail.webp" alt="Ão blazer ná»¯ mÃ u Ä‘en" width="55" height="54" />
      <span className="blazer-feature-copy"><strong>Blazer for Women</strong><span className="blazer-feature-label">THE TAILORING EDIT</span><span>Confidence in every detail.</span><small>Discover the collection</small></span>
    </Link>
    <button type="button" aria-label="ÄÃ³ng gá»£i Ã½ bá»™ sÆ°u táº­p" onClick={() => setVisible(false)}><X /></button>
  </aside>
}

export function BlazerHome({ storeName = 'Sarada' }: { storeName?: string }) {
  return <div className="blazer-page">
    <div className="blazer-home">
      <section className="blazer-stage" aria-labelledby="blazer-title">
        <BlazerNavigation storeName={storeName} />
        <h1 id="blazer-title" className="blazer-title">NEW FASHION</h1>
        <div className="blazer-intro">
          <p>Explore our curated collection of business attire that blends confidence with comfort.</p>
          <Link className="blazer-explore" to="/products">Explore Now</Link>
        </div>
        <img className="blazer-model" src="/blazer-model-hd.webp" alt="Người mẫu mặc blazer xám và quần trắng, ngồi trên ghế cao" width="804" height="1956" fetchPriority="high" />
        <div className="blazer-gallery" aria-label="Khám phá bộ sưu tập">
          {[1, 2, 3].map((look) => <Link key={look} to="/search?q=blazer" aria-label={`Khám phá phong cách blazer ${look}`}><img src={`/blazer-look-${look}-hd.webp`} alt={`Phong cách blazer xám ${look}`} width="1122" height="1402" /></Link>)}
        </div>
        <BlazerFeature />
      </section>
    </div>
    <BlazerSections />
  </div>
}