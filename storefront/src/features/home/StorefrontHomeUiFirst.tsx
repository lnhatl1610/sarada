import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import './StorefrontHomeUiFirst.css'
import './StorefrontHomeDesign.css'

type PreviewProduct = {
  slug: string
  name: string
  category: string
  price: number
  image: string
}

const previewProducts: PreviewProduct[] = [
  { slug: 'ao-so-mi-linen', name: 'Áo sơ mi linen dáng rộng', category: 'Áo', price: 690_000, image: '/ui-preview/ao-so-mi-linen.webp' },
  { slug: 'quan-ong-dung-linen', name: 'Quần ống đứng linen', category: 'Quần', price: 890_000, image: '/ui-preview/quan-ong-dung.webp' },
  { slug: 'vay-midi-co-vuong', name: 'Váy midi cổ vuông', category: 'Váy', price: 1_190_000, image: '/ui-preview/vay-midi.webp' },
  { slug: 'ao-cardigan-det-kim', name: 'Áo cardigan dệt kim', category: 'Áo len', price: 990_000, image: '/ui-preview/ao-cardigan.webp' },
  { slug: 'ao-khoac-blazer', name: 'Áo khoác blazer tối giản', category: 'Áo khoác', price: 1_490_000, image: '/ui-preview/ao-blazer.webp' },
]

const categoryTiles = [
  { title: 'Áo', detail: 'Những lớp nền tinh giản', image: '/ui-preview/category-ao.webp' },
  { title: 'Quần', detail: 'Phom dáng cho mỗi ngày', image: '/ui-preview/category-quan.webp' },
  { title: 'Váy', detail: 'Chuyển động nhẹ nhàng', image: '/ui-preview/category-vay.webp' },
]

const formatPrice = (price: number) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

function ProductCard({ product, favorite, onToggleFavorite, onAdd }: {
  product: PreviewProduct
  favorite: boolean
  onToggleFavorite: () => void
  onAdd: () => void
}) {
  return <article className="ui-first-product">
    <Link className="ui-first-product__image" to={`/products/${product.slug}?mode=ui`}>
      <img src={product.image} alt={`${product.category}: ${product.name}`} width="800" height="1000" loading="lazy" />
    </Link>
    <button className="ui-first-favorite" type="button" aria-label={favorite ? `Bỏ yêu thích ${product.name}` : `Thêm ${product.name} vào yêu thích`} aria-pressed={favorite} onClick={onToggleFavorite}>
      <Heart size={18} strokeWidth={1.5} fill={favorite ? 'currentColor' : 'none'} />
    </button>
    <div className="ui-first-product__meta">
      <div><p>{product.category}</p><Link to={`/products/${product.slug}?mode=ui`}>{product.name}</Link></div>
      <strong>{formatPrice(product.price)}</strong>
    </div>
    <button className="ui-first-quick-add" type="button" onClick={onAdd}>Thêm vào túi <ArrowRight size={14} /></button>
  </article>
}

export function StorefrontHomeUiFirst({ storeName = 'Sarada' }: { storeName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [lastAdded, setLastAdded] = useState<PreviewProduct | null>(null)
  const [notice, setNotice] = useState('')
  const cartDialog = useRef<HTMLDialogElement>(null)

  const visibleProducts = previewProducts.filter((product) => !submittedSearch || `${product.name} ${product.category}`.toLocaleLowerCase('vi-VN').includes(submittedSearch.toLocaleLowerCase('vi-VN')))
  const toggleFavorite = (slug: string) => setFavorites((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug])
  const addToCart = (product: PreviewProduct) => {
    setCartCount((count) => count + 1)
    setLastAdded(product)
    cartDialog.current?.showModal()
  }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittedSearch(search.trim())
    document.getElementById('ui-first-new-arrivals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('Đăng ký nhận tin sẽ sớm khả dụng.')
  }

  return <div className="ui-first-home">
    <div className="ui-first-announcement">SARADA <span aria-hidden="true">·</span> THIẾT KẾ CHẬM, MẶC THẬT LÂU</div>
    <header className="ui-first-header">
      <button className="ui-first-menu-toggle" type="button" aria-label={menuOpen ? 'Đóng danh mục' : 'Mở danh mục'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
      <Link className="ui-first-brand" to="/" aria-label={`${storeName} — trang chủ`}><img src="/branding/net-studio-mark.png" alt="" aria-hidden="true" /></Link>
      <nav className={`ui-first-nav${menuOpen ? ' is-open' : ''}`} aria-label="Danh mục cửa hàng">
        <Link to="/products?mode=ui">Sản phẩm</Link><Link to="/products?mode=ui">Bộ sưu tập</Link><Link to="/products?mode=ui">Áo</Link><Link to="/products?mode=ui">Quần</Link><Link to="/products?mode=ui">Váy</Link>
      </nav>
      <div className="ui-first-header-tools">
        <form className="ui-first-search" role="search" onSubmit={submitSearch}>
          <Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="ui-first-search">Tìm sản phẩm</label>
          <input id="ui-first-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm" />
        </form>
        <Link className="ui-first-icon-link" to="/account" aria-label="Tài khoản"><UserRound size={20} strokeWidth={1.5} /></Link>
        <Link className="ui-first-icon-link ui-first-heart-link" to="/account/wishlist" aria-label={`Yêu thích, ${favorites.length} sản phẩm`}><Heart size={20} strokeWidth={1.5} />{favorites.length > 0 && <span>{favorites.length}</span>}</Link>
        <button className="ui-first-icon-link" type="button" aria-label={`Túi hàng, ${cartCount} sản phẩm`} onClick={() => cartDialog.current?.showModal()}><ShoppingBag size={20} strokeWidth={1.5} />{cartCount > 0 && <span>{cartCount}</span>}</button>
      </div>
    </header>

    <div className="ui-first-content">
      <section className="ui-first-hero" aria-labelledby="ui-first-hero-title">
        <div className="ui-first-hero__copy">
          <p className="ui-first-eyebrow">BỘ SƯU TẬP THU ĐÔNG 2026</p>
          <h1 id="ui-first-hero-title">Mặc điều<br /><em>bạn tin.</em></h1>
          <p>Thiết kế tinh giản, chất liệu tự nhiên và phom dáng để bạn thấy mình trong đó.</p>
          <Link className="ui-first-primary-link" to="/products?mode=ui">Khám phá bộ sưu tập <ArrowRight size={17} /></Link>
          <span className="ui-first-hero-index">01 <i /> 03</span>
        </div>
        <picture className="ui-first-hero__photo">
          <source media="(max-width: 700px)" srcSet="/ui-preview/hero-mobile.webp" />
          <img src="/ui-preview/hero-desktop-clean.webp" alt="Người mẫu mặc thiết kế Thu Đông của Sarada" width="1600" height="900" fetchPriority="high" />
        </picture>
      </section>

      <section className="ui-first-benefits" aria-label="Cam kết dịch vụ">
        <p><span>01</span> Thiết kế có chủ đích</p><p><span>02</span> Chất liệu chọn lọc</p><p><span>03</span> Dễ phối nhiều dịp</p><p><span>04</span> Chi tiết chăm chút</p>
      </section>

      <section className="ui-first-section ui-first-categories" aria-labelledby="ui-first-categories-title">
        <div className="ui-first-section-heading"><div><p className="ui-first-eyebrow">TÌM PHONG CÁCH CỦA BẠN</p><h2 id="ui-first-categories-title">Khám phá danh mục</h2></div><Link to="/products?mode=ui">Tất cả sản phẩm <ArrowRight size={15} /></Link></div>
        <div className="ui-first-category-grid">{categoryTiles.map((category, index) => <Link className="ui-first-category" to="/products?mode=ui" key={category.title}>
          <img src={category.image} alt={`Thiết kế ${category.title} của Sarada`} width="800" height="1000" loading="lazy" /><span className="ui-first-category-index">0{index + 1}</span><span className="ui-first-category-copy"><strong>{category.title}</strong><small>{category.detail}</small></span><ArrowRight size={18} className="ui-first-category-arrow" />
        </Link>)}</div>
      </section>

      <section className="ui-first-section ui-first-products-section" id="ui-first-new-arrivals" aria-labelledby="ui-first-new-title">
        <div className="ui-first-section-heading"><div><p className="ui-first-eyebrow">VỪA CẬP BẾN</p><h2 id="ui-first-new-title">Sản phẩm mới</h2></div><Link to="/products?mode=ui">Xem tất cả <ArrowRight size={15} /></Link></div>
        {submittedSearch && <p className="ui-first-search-state" role="status">{visibleProducts.length ? `Kết quả cho “${submittedSearch}”` : `Chưa có sản phẩm phù hợp với “${submittedSearch}”.`}{' '}<button type="button" onClick={() => { setSearch(''); setSubmittedSearch('') }}>Xóa tìm kiếm</button></p>}
        <div className="ui-first-product-grid">{visibleProducts.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} favorite={favorites.includes(product.slug)} onToggleFavorite={() => toggleFavorite(product.slug)} onAdd={() => addToCart(product)} />)}</div>
      </section>

      <section className="ui-first-campaign" aria-labelledby="ui-first-campaign-title">
        <div><p className="ui-first-eyebrow">MẶC LÂU HƠN · CHỌN KỸ HƠN</p><h2 id="ui-first-campaign-title">Một tủ đồ,<br /><em>nhiều câu chuyện.</em></h2><p>Những thiết kế dễ kết hợp, dành cho nhịp sống mỗi ngày.</p><Link className="ui-first-text-link" to="/products?mode=ui">Xem bộ sưu tập <ArrowRight size={15} /></Link></div>
        <img src="/ui-preview/ao-blazer.webp" alt="Áo khoác blazer của Sarada" width="800" height="1000" loading="lazy" />
      </section>

      <section className="ui-first-section ui-first-products-section ui-first-bestsellers" aria-labelledby="ui-first-best-title">
        <div className="ui-first-section-heading"><div><p className="ui-first-eyebrow">ĐƯỢC CHỌN NHIỀU</p><h2 id="ui-first-best-title">Những thiết kế nổi bật</h2></div><Link to="/products?mode=ui">Khám phá thêm <ArrowRight size={15} /></Link></div>
        <div className="ui-first-product-grid">{previewProducts.slice(1, 5).map((product) => <ProductCard key={`best-${product.slug}`} product={product} favorite={favorites.includes(product.slug)} onToggleFavorite={() => toggleFavorite(product.slug)} onAdd={() => addToCart(product)} />)}</div>
      </section>

      <section className="ui-first-lookbook" aria-labelledby="ui-first-lookbook-title">
        <img src="/ui-preview/hero-mobile.webp" alt="Người mẫu phối đồ phong cách Thu Đông" width="720" height="900" loading="lazy" />
        <div><p className="ui-first-eyebrow">LOOKBOOK · 2026</p><h2 id="ui-first-lookbook-title">Nhịp sống<br /><em>thành thị.</em></h2><p>Khám phá cách phối những món đồ yêu thích theo cách của riêng bạn.</p><Link className="ui-first-primary-link" to="/lookbook/thu-dong-2026">Xem lookbook <ArrowRight size={17} /></Link></div>
      </section>

      <section className="ui-first-membership" aria-labelledby="ui-first-membership-title"><span className="ui-first-membership-mark">SARADA<br />MEMBERS</span><div><p className="ui-first-eyebrow">ĐẶC QUYỀN THÀNH VIÊN</p><h2 id="ui-first-membership-title">Mỗi lần chọn,<br /><em>thêm một quyền lợi.</em></h2><p>Tìm hiểu chương trình thành viên và những ưu đãi dành riêng cho bạn.</p><Link className="ui-first-text-link" to="/membership">Khám phá chương trình <ArrowRight size={15} /></Link></div></section>

      <section className="ui-first-newsletter" aria-labelledby="ui-first-newsletter-title"><p className="ui-first-eyebrow">LÁ THƯ TỪ {storeName.toLocaleUpperCase('vi-VN')}</p><h2 id="ui-first-newsletter-title">Ở lại cùng những điều mới.</h2><p>Câu chuyện về bộ sưu tập, chất liệu và những thiết kế sắp ra mắt.</p><form onSubmit={subscribe}><label className="sr-only" htmlFor="ui-first-newsletter-email">Email của bạn</label><input id="ui-first-newsletter-email" type="email" placeholder="Email của bạn" required /><button type="submit">Đăng ký <ArrowRight size={15} /></button></form>{notice && <p className="ui-first-preview-status" role="status">{notice}</p>}</section>
    </div>

    <footer className="ui-first-footer"><div><Link className="ui-first-brand" to="/" aria-label={`${storeName} — trang chủ`}><img src="/branding/net-studio-mark.png" alt="" aria-hidden="true" /></Link><p>Thiết kế chậm, mặc thật lâu.</p></div><nav aria-label="Liên kết hỗ trợ"><Link to="/contact">Liên hệ</Link><Link to="/faq">Trung tâm trợ giúp</Link><Link to="/style-guide">Phối đồ theo dịp</Link><Link to="/track-order">Theo dõi đơn hàng</Link><Link to="/pages/privacy">Chính sách riêng tư</Link></nav><small>© 2026 {storeName.toLocaleUpperCase('vi-VN')}</small></footer>

    <dialog className="ui-first-cart-dialog" ref={cartDialog} aria-labelledby="ui-first-cart-title" onClick={(event) => { if (event.target === cartDialog.current) cartDialog.current?.close() }}>
      <button className="ui-first-dialog-close" type="button" aria-label="Đóng túi hàng" onClick={() => cartDialog.current?.close()}><X size={18} /></button>
      <p className="ui-first-eyebrow">TÚI HÀNG</p><h2 id="ui-first-cart-title">Đã thêm vào túi</h2>
      {lastAdded && <div className="ui-first-cart-item"><img src={lastAdded.image} alt="" width="800" height="1000" /><div><strong>{lastAdded.name}</strong><small>{formatPrice(lastAdded.price)} · Số lượng: {cartCount}</small></div></div>}
      <p>Thay đổi trong túi chưa được lưu.</p>
      <button className="ui-first-primary-link" type="button" onClick={() => cartDialog.current?.close()}>Tiếp tục xem <ArrowRight size={16} /></button>
    </dialog>
  </div>
}
