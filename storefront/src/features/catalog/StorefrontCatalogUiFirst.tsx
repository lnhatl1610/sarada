import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowDownWideNarrow, ArrowRight, Heart, SlidersHorizontal, X } from 'lucide-react'
import './StorefrontCatalogUiFirst.css'

type DemoProduct = { slug: string; name: string; category: string; price: number; image: string; tone: string }

const products: DemoProduct[] = [
  { slug: 'ao-so-mi-linen', name: 'Áo sơ mi linen dáng rộng', category: 'Áo', price: 690_000, image: '/ui-preview/ao-so-mi-linen.webp', tone: 'Trắng ngà' },
  { slug: 'quan-ong-dung-linen', name: 'Quần ống đứng linen', category: 'Quần', price: 890_000, image: '/ui-preview/quan-ong-dung.webp', tone: 'Nâu đất' },
  { slug: 'vay-midi-co-vuong', name: 'Váy midi cổ vuông', category: 'Váy', price: 1_190_000, image: '/ui-preview/vay-midi.webp', tone: 'Đen' },
  { slug: 'ao-cardigan-det-kim', name: 'Áo cardigan dệt kim', category: 'Áo len', price: 990_000, image: '/ui-preview/ao-cardigan.webp', tone: 'Xanh rêu' },
  { slug: 'ao-blazer-toi-gian', name: 'Áo khoác blazer tối giản', category: 'Áo khoác', price: 1_490_000, image: '/ui-preview/ao-blazer.webp', tone: 'Ghi sáng' },
  { slug: 'ao-so-mi-linen-xanh', name: 'Áo sơ mi linen dáng rộng', category: 'Áo', price: 690_000, image: '/ui-preview/ao-so-mi-linen.webp', tone: 'Xanh nhạt' },
  { slug: 'quan-ong-dung-den', name: 'Quần ống đứng linen', category: 'Quần', price: 890_000, image: '/ui-preview/quan-ong-dung.webp', tone: 'Đen' },
  { slug: 'vay-midi-nau', name: 'Váy midi cổ vuông', category: 'Váy', price: 1_190_000, image: '/ui-preview/vay-midi.webp', tone: 'Nâu đất' },
]

const formatPrice = (price: number) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

export function StorefrontCatalogUiFirst({ storeName = 'Sarada' }: { storeName?: string }) {
  const [category, setCategory] = useState('Tất cả')
  const [sort, setSort] = useState('featured')
  const [favorites, setFavorites] = useState<number[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const visibleProducts = useMemo(() => {
    const min = Number(minPrice) || 0
    const max = Number(maxPrice) || Infinity
    return products.map((product, index) => ({ ...product, id: index }))
      .filter((product) => (category === 'Tất cả' || product.category === category) && product.price >= min && product.price <= max)
      .sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : a.id - b.id)
  }, [category, maxPrice, minPrice, sort])

  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  return <div className="ui-first-catalog">
    <header className="ui-first-catalog__header"><Link to="/?mode=ui" className="ui-first-catalog__brand">{storeName}<span>®</span></Link><nav aria-label="Điều hướng cửa hàng"><Link to="/?mode=ui">Trang chủ</Link><Link to="/products?mode=ui" aria-current="page">Sản phẩm</Link><a href="#ui-first-product-list">Hàng mới</a><a href="#ui-first-product-list">Bộ sưu tập</a></nav><div><Link to="/account/wishlist" aria-label={`Yêu thích, ${favorites.length} sản phẩm`}><Heart size={19} />{favorites.length > 0 && <span>{favorites.length}</span>}</Link><Link to="/cart?mode=ui" aria-label="Giỏ hàng"><ArrowRight size={19} /></Link></div></header>
    <div className="ui-first-catalog__announcement">THU ĐÔNG 2026 <span>·</span> THIẾT KẾ TINH GIẢN, MẶC MỖI NGÀY</div>
    <main>
      <div className="ui-first-catalog__crumb"><Link to="/?mode=ui">Trang chủ</Link><span>/</span><span>Sản phẩm</span></div>
      <section className="ui-first-catalog__hero"><div><p className="ui-first-catalog__eyebrow">SARADA · THU ĐÔNG 2026</p><h1>Chọn điều<br /><em>hợp với bạn.</em></h1><p>Những thiết kế tinh giản, dành cho nhịp sống của riêng bạn.</p></div><img src="/ui-preview/category-ao.webp" alt="Áo linen trong bộ sưu tập Thu Đông" width="800" height="1000" fetchPriority={"high"} /></section>
      <section className="ui-first-catalog__listing" id="ui-first-product-list" aria-labelledby="ui-first-catalog-title">
        <div className="ui-first-catalog__title"><div><p className="ui-first-catalog__eyebrow">BỘ SƯU TẬP</p><h2 id="ui-first-catalog-title">Tất cả sản phẩm</h2></div><span>{visibleProducts.length} thiết kế</span></div>
        <div className="ui-first-catalog__categories" aria-label="Lọc danh mục">{['Tất cả', 'Áo', 'Quần', 'Váy', 'Áo len', 'Áo khoác'].map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="ui-first-catalog__toolbar"><button className="ui-first-catalog__filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={16} /> Bộ lọc</button><p>{visibleProducts.length} sản phẩm</p><label><ArrowDownWideNarrow size={15} /><span className="sr-only">Sắp xếp</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá: thấp đến cao</option><option value="price-desc">Giá: cao đến thấp</option></select></label></div>
        <div className="ui-first-catalog__layout">
          <aside className={filtersOpen ? 'is-open' : ''} aria-label="Bộ lọc sản phẩm"><div className="ui-first-catalog__filter-heading"><h3>Bộ lọc</h3><button type="button" aria-label="Đóng bộ lọc" onClick={() => setFiltersOpen(false)}><X size={18} /></button></div><fieldset><legend>Danh mục</legend>{['Áo', 'Quần', 'Váy', 'Áo len', 'Áo khoác'].map((item) => <label key={item}><input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} />{item}</label>)}<button className="ui-first-catalog__clear" type="button" onClick={() => setCategory('Tất cả')}>Xóa lọc danh mục</button></fieldset><fieldset><legend>Khoảng giá</legend><label className="ui-first-catalog__price-field">Từ<input inputMode="numeric" type="number" min="0" placeholder="0₫" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label><label className="ui-first-catalog__price-field">Đến<input inputMode="numeric" type="number" min="0" placeholder="Không giới hạn" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label></fieldset></aside>
          <div className="ui-first-catalog__grid">{visibleProducts.length ? visibleProducts.map((product) => <article className="ui-first-catalog__card" key={product.id}><Link className="ui-first-catalog__image" to={`/products/${product.slug}?mode=ui`}><img src={product.image} alt={`${product.name}, màu ${product.tone}`} loading="lazy" /></Link><button className="ui-first-catalog__favorite" type="button" aria-label={favorites.includes(product.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} aria-pressed={favorites.includes(product.id)} onClick={() => toggleFavorite(product.id)}><Heart size={18} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button><div className="ui-first-catalog__meta"><div><small>{product.category} · {product.tone}</small><Link to={`/products/${product.slug}?mode=ui`}>{product.name}</Link></div><strong>{formatPrice(product.price)}</strong></div><button className="ui-first-catalog__add" type="button" onClick={() => setNotice('Thao tác thêm vào túi chưa được lưu.')}>Thêm vào túi <ArrowRight size={14} /></button></article>) : <div className="ui-first-catalog__empty"><h3>Không có sản phẩm trong khoảng giá này</h3><button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); setCategory('Tất cả') }}>Xóa bộ lọc</button></div>}</div>
        </div>
        {notice && <div className="ui-first-catalog__notice" role="status">{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={16} /></button></div>}
      </section>
    </main>
    <footer className="ui-first-catalog__footer"><Link to="/?mode=ui">{storeName}®</Link><p>Thiết kế chậm, mặc thật lâu.</p><Link to="/contact">Liên hệ cửa hàng <ArrowRight size={14} /></Link><small>Nội dung và ảnh sản phẩm chỉ dùng để xem bố cục.</small></footer>
  </div>
}

