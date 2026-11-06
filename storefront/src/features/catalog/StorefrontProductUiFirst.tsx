import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowLeft, ArrowRight, Heart, Minus, Plus, Ruler, ShoppingBag } from 'lucide-react'
import './StorefrontProductUiFirst.css'

const demoProducts: Record<string, { name: string; category: string; price: number; image: string; colors: string[]; description: string }> = {
  'ao-so-mi-linen': { name: 'Áo sơ mi linen dáng rộng', category: 'Áo', price: 690_000, image: '/ui-preview/ao-so-mi-linen.webp', colors: ['Trắng ngà', 'Xanh nhạt', 'Nâu đất'], description: 'Một thiết kế nhẹ nhàng từ chất liệu linen, có thể mặc riêng hoặc phối nhiều lớp trong những ngày chuyển mùa.' },
  'quan-ong-dung-linen': { name: 'Quần ống đứng linen', category: 'Quần', price: 890_000, image: '/ui-preview/quan-ong-dung.webp', colors: ['Nâu đất', 'Đen'], description: 'Phom ống đứng gọn gàng, dễ kết hợp cùng áo sơ mi, áo thun hoặc trang phục dệt kim.' },
  'vay-midi-co-vuong': { name: 'Váy midi cổ vuông', category: 'Váy', price: 1_190_000, image: '/ui-preview/vay-midi.webp', colors: ['Đen', 'Nâu đất'], description: 'Đường cắt tối giản với cổ vuông thanh thoát và độ dài midi cho chuyển động tự nhiên.' },
  'ao-cardigan-det-kim': { name: 'Áo cardigan dệt kim', category: 'Áo len', price: 990_000, image: '/ui-preview/ao-cardigan.webp', colors: ['Xanh rêu', 'Kem'], description: 'Lớp dệt kim mềm mại để khoác nhẹ khi trời se lạnh, phối cùng quần dáng suông hoặc chân váy.' },
  'ao-blazer-toi-gian': { name: 'Áo khoác blazer tối giản', category: 'Áo khoác', price: 1_490_000, image: '/ui-preview/ao-blazer.webp', colors: ['Ghi sáng'], description: 'Blazer phom mềm với đường morrow gọn, phù hợp cho những bộ trang phục thường ngày lẫn dịp cần chỉn chu.' },
}

const sizes = ['S', 'M', 'L', 'XL']
const formatPrice = (price: number) => `${new Intl.NumberFormat('vi-VN').format(price)}₫`

export function StorefrontProductUiFirst({ storeName = 'Sarada' }: { storeName?: string }) {
  const { pathname } = useLocation()
  const slug = pathname.split('/').filter(Boolean).at(-1) ?? ''
  const product = demoProducts[slug] ?? demoProducts['ao-so-mi-linen']!
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? '')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [favorite, setFavorite] = useState(false)
  const [notice, setNotice] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)

  return <div className="ui-first-product-page">
    <header className="ui-first-product-page__header"><Link to="/?mode=ui" className="ui-first-product-page__brand">{storeName}<span>®</span></Link><nav aria-label="Điều hướng cửa hàng"><Link to="/?mode=ui">Trang chủ</Link><Link to="/products?mode=ui">Sản phẩm</Link><Link to="/products?mode=ui#ui-first-product-list">Bộ sưu tập</Link></nav><Link to="/cart?mode=ui" aria-label="Mở giỏ hàng"><ShoppingBag size={20} /></Link></header>
    <main>
      <div className="ui-first-product-page__crumb"><Link to="/products?mode=ui"><ArrowLeft size={14} /> Tất cả sản phẩm</Link><span>/</span><span>{product.name}</span></div>
      <div className="ui-first-product-page__layout">
        <section className="ui-first-product-page__gallery" aria-label="Hình ảnh sản phẩm"><img src={product.image} alt={`${product.name} màu ${selectedColor}`} /></section>
        <section className="ui-first-product-page__info" aria-labelledby="ui-first-product-title"><p className="ui-first-product-page__eyebrow">{product.category} · SARADA</p><h1 id="ui-first-product-title">{product.name}</h1><div className="ui-first-product-page__price">{formatPrice(product.price)}</div><p className="ui-first-product-page__description">{product.description}</p>
          <fieldset className="ui-first-product-page__colors"><legend>Màu sắc <span>· {selectedColor}</span></legend><div>{product.colors.map((color, index) => <button key={color} type="button" aria-label={color} aria-pressed={selectedColor === color} onClick={() => setSelectedColor(color)}><span style={{ backgroundColor: ['#eee9de', '#bdc9bd', '#7e6355', '#252525'][index % 4] }} /></button>)}</div></fieldset>
          <fieldset className="ui-first-product-page__sizes"><legend>Kích cỡ <button type="button" onClick={() => setGuideOpen((open) => !open)}><Ruler size={14} /> Hướng dẫn chọn size</button></legend><div>{sizes.map((size) => <button key={size} type="button" aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)}>{size}</button>)}</div>{guideOpen && <div className="ui-first-product-page__size-guide"><strong>Thông số kích cỡ</strong><p>Kiểm tra bảng số đo riêng của từng thiết kế trước khi chọn.</p><table><thead><tr><th>Size</th><th>Vòng ngực</th><th>Chiều dài</th></tr></thead><tbody><tr><td>S</td><td>—</td><td>—</td></tr><tr><td>M</td><td>—</td><td>—</td></tr><tr><td>L</td><td>—</td><td>—</td></tr></tbody></table></div>}</fieldset>
          <div className="ui-first-product-page__quantity"><span>Số lượng</span><div><button type="button" aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div></div>
          <div className="ui-first-product-page__actions"><button type="button" onClick={() => setNotice(selectedSize ? `Đã mô phỏng thêm ${quantity} sản phẩm · ${selectedColor} · ${selectedSize}.` : 'Vui lòng chọn kích cỡ để xem trạng thái nút mua.')}>Thêm vào túi <ArrowRight size={16} /></button><button type="button" aria-label={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} aria-pressed={favorite} onClick={() => setFavorite((value) => !value)}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button></div>
          {!selectedSize && <p className="ui-first-product-page__hint">Chọn màu và kích cỡ để tiếp tục.</p>}
          <div className="ui-first-product-page__details"><details open><summary>Mô tả sản phẩm</summary><p>{product.description}</p></details><details><summary>Chất liệu &amp; bảo quản</summary><p>Thông tin chất liệu và hướng dẫn bảo quản được ghi theo từng thiết kế.</p></details><details><summary>Giao hàng &amp; đổi trả</summary><p>Phí giao hàng và chính sách đổi trả được xác nhận theo khu vực nhận hàng.</p></details></div>
        </section>
      </div>
      <section className="ui-first-product-page__related"><div><p className="ui-first-product-page__eyebrow">CÓ THỂ BẠN SẼ THÍCH</p><h2>Hoàn thiện lựa chọn của bạn</h2></div><Link to="/products?mode=ui">Xem tất cả <ArrowRight size={14} /></Link><div className="ui-first-product-page__related-image"><img src="/ui-preview/quan-ong-dung.webp" alt="Quần ống đứng linen" width="800" height="1000" loading={"lazy"} /></div><div className="ui-first-product-page__related-copy"><small>Quần linen</small><h3>Quần ống đứng linen</h3><p>890.000₫</p><Link to="/products/quan-ong-dung-linen?mode=ui">Xem chi tiết <ArrowRight size={14} /></Link></div></section>
    </main>
    {notice && <div className="ui-first-product-page__notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Đóng</button></div>}
    <footer className="ui-first-product-page__footer"><Link to="/?mode=ui">{storeName}®</Link><span>Thiết kế chậm, mặc thật lâu.</span><Link to="/contact">Liên hệ cửa hàng</Link><small>Nội dung và ảnh sản phẩm chỉ dùng để xem bố cục.</small></footer>
  </div>
}

