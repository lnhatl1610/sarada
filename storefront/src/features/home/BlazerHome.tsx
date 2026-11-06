import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Heart, Search, ShieldCheck, ShoppingBag, Truck, UserRound, X } from 'lucide-react'
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

const categories = [
  { label: 'Tailoring', image: '/blazer-look-1.webp', query: 'blazer' },
  { label: 'Everyday', image: '/blazer-look-2.webp', query: 'new' },
  { label: 'Occasion', image: '/blazer-look-3.webp', query: 'dresses' },
]

const editorialProducts = [
  { name: 'The Essential Blazer', detail: 'Structured wool blend', price: '$189', image: '/blazer-look-1.webp' },
  { name: 'Relaxed Tailoring Set', detail: 'Soft suiting separates', price: '$164', image: '/blazer-look-2.webp' },
  { name: 'The Evening Edit', detail: 'Modern occasion dressing', price: '$212', image: '/blazer-look-3.webp' },
]

function FashionSections({ storeName }: { storeName: string }) {
  return <main className="fashion-sections">
    <section className="fashion-announcement" aria-label="Store announcement"><span>Complimentary shipping on orders over $150</span><Link to="/products">Shop the new collection <ArrowRight /></Link></section>

    <section className="fashion-section fashion-categories" aria-labelledby="categories-title">
      <div className="fashion-section-heading"><div><p className="fashion-eyebrow">Curated for every day</p><h2 id="categories-title">Shop by category</h2></div><Link className="fashion-text-link" to="/products">View all <ArrowRight /></Link></div>
      <div className="category-grid">{categories.map((category) => <Link className="category-card" key={category.label} to={`/search?q=${category.query}`}><img src={category.image} alt={`${category.label} fashion collection`} /><span>{category.label}</span><ArrowRight /></Link>)}</div>
    </section>

    <section className="fashion-section fashion-products" aria-labelledby="arrivals-title">
      <div className="fashion-section-heading"><div><p className="fashion-eyebrow">The latest edit</p><h2 id="arrivals-title">New arrivals</h2></div><Link className="fashion-text-link" to="/products">Shop all <ArrowRight /></Link></div>
      <div className="product-grid">{editorialProducts.map((product) => <article className="editorial-product" key={product.name}><Link to="/products"><div className="product-image"><img src={product.image} alt={product.name} /><span>New</span><button type="button" aria-label={`Add ${product.name} to wishlist`}><Heart /></button></div><div className="product-meta"><div><h3>{product.name}</h3><p>{product.detail}</p></div><strong>{product.price}</strong></div></Link></article>)}</div>
    </section>

    <section className="fashion-promo" aria-labelledby="promo-title"><div><p className="fashion-eyebrow">The season's essential</p><h2 id="promo-title">Quiet confidence,<br />beautifully tailored.</h2><p>Pieces designed to move with you, from the first meeting to the last reservation.</p><Link className="fashion-dark-button" to="/search?q=tailoring">Explore tailoring <ArrowRight /></Link></div><img src="/blazer-model.png" alt="Model wearing the Sarada tailoring collection" /></section>

    <section className="fashion-section fashion-service" aria-labelledby="service-title"><div className="fashion-section-heading centered-heading"><div><p className="fashion-eyebrow">A considered experience</p><h2 id="service-title">Made for the way you live</h2></div></div><div className="service-grid"><div><Truck /><h3>Complimentary delivery</h3><p>Free shipping on every order over $150.</p></div><div><ShieldCheck /><h3>Easy, thoughtful returns</h3><p>Try everything at home with a 7-day return window.</p></div><div><Heart /><h3>Designed to last</h3><p>Timeless pieces, selected with intention.</p></div></div></section>

    <section className="fashion-newsletter" aria-labelledby="newsletter-title"><p className="fashion-eyebrow">Stay in the know</p><h2 id="newsletter-title">A little inspiration,<br />delivered.</h2><p>Sign up for new arrivals, styling notes, and considered offers.</p><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" required /><button type="submit" aria-label="Subscribe to newsletter"><ArrowRight /></button></form></section>

    <footer className="fashion-footer"><div><Link className="footer-logo" to="/">Blzr</Link><p>Modern tailoring for every version of you.</p></div><div className="footer-links"><div><strong>Explore</strong><Link to="/products">Shop all</Link><Link to="/search?q=new">New arrivals</Link><Link to="/search?q=blazer">Tailoring</Link></div><div><strong>About</strong><Link to="/pages/about">Our story</Link><Link to="/contact">Contact</Link><Link to="/account">Account</Link></div><div><strong>Follow</strong><Link to="/">Instagram</Link><Link to="/">Pinterest</Link><Link to="/">TikTok</Link></div></div><small>© 2026 {storeName}. All rights reserved.</small></footer>
  </main>
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
    <FashionSections storeName={storeName} />
  </div>
}
