import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { StorefrontCollection } from '../home/home-api'
import type { CatalogPageProduct } from './CatalogPage'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { formatVnd } from '../../lib/money'
import './LookbookEditorialPage.css'

type LookbookEditorialPageProps = {
  collection: StorefrontCollection
  storeName: string
  products: CatalogPageProduct[]
  cartSyncLoading: boolean
  cartAddBusy: boolean
  onAddToCart: (product: CatalogPageProduct, variantId: number) => Promise<boolean>
}

export function LookbookEditorialPage({ collection, storeName, products, cartSyncLoading, cartAddBusy, onAddToCart }: LookbookEditorialPageProps) {
  const orderedProducts = useMemo(() => {
    const pinOrder = new Map((collection.lookbook_products ?? []).map((pin, index) => [pin.id, index]))
    return [...products].sort((left, right) => (pinOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (pinOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))
  }, [collection.lookbook_products, products])
  const [selectedProducts, setSelectedProducts] = useState<Record<number, boolean>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({})
  const [addingOutfit, setAddingOutfit] = useState(false)
  const [feedback, setFeedback] = useState('')

  const outfit = orderedProducts.map((product) => {
    const variants = product.variants ?? []
    const availableVariants = variants.filter((variant) => variant.available_quantity > 0)
    const preferredVariantId = selectedVariants[product.id]
    const variantId = availableVariants.some((variant) => variant.id === preferredVariantId) ? preferredVariantId : availableVariants[0]?.id
    return { product, variants, availableVariants, variantId, selected: selectedProducts[product.id] ?? availableVariants.length > 0 }
  })
  const selectedCount = outfit.filter((item) => item.selected && item.variantId !== undefined).length

  const addOutfit = async () => {
    const items = outfit.filter((item) => item.selected && item.variantId !== undefined)
    if (!items.length || cartSyncLoading || cartAddBusy || addingOutfit) return
    setAddingOutfit(true)
    setFeedback('')
    let added = 0
    for (const item of items) {
      try {
        if (await onAddToCart(item.product, item.variantId!)) added += 1
      } catch {
        // Continue so one failed item does not prevent the rest of the outfit from being added.
      }
    }
    setFeedback(added === items.length ? `Đã thêm ${added} món vào túi.` : `Đã thêm ${added}/${items.length} món. Một số món chưa thể thêm; hãy kiểm tra tồn kho rồi thử lại.`)
    setAddingOutfit(false)
  }

  return <main className="lookbook-editorial container" aria-labelledby="lookbook-editorial-title">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><Link to="/collections">Bộ sưu tập</Link><span aria-hidden="true">/</span><span aria-current="page">Lookbook</span></nav>
    <header className="lookbook-editorial__heading"><p className="eyebrow">LOOKBOOK · {storeName.toLocaleUpperCase('vi-VN')}</p><h1 id="lookbook-editorial-title">{collection.name}</h1>{collection.description && <p>{collection.description}</p>}</header>
    <section className="lookbook-editorial__outfit" aria-label={`Phối đồ ${collection.name}`}>
      <div className="lookbook-editorial__visual">
        {collection.banner && <ResponsiveImage src={collection.banner} alt={collection.banner_alt?.trim() || `Lookbook ${collection.name}`} width={1200} height={1500} loading="eager" sizes="(max-width: 760px) 100vw, 48vw" />}
        {getMediaDisclosureLabel(collection.banner_alt) && <DemoConceptBadge label={getMediaDisclosureLabel(collection.banner_alt) ?? undefined} />}
        {collection.lookbook_products?.map((pin, index) => <a key={pin.id} href={`#lookbook-item-${pin.id}`} className="lookbook-editorial__pin" style={{ left: `${pin.x}%`, top: `${pin.y}%` }} aria-label={`Đến ${pin.name}`}><span>{index + 1}</span></a>)}
        <span className="lookbook-editorial__visual-caption">{collection.banner_alt?.trim() || collection.name}</span>
      </div>
      <div className="lookbook-editorial__items">
        <div className="lookbook-editorial__items-heading"><div><p className="eyebrow">THE LOOK</p><h2>Mặc cả bộ</h2></div><span>{orderedProducts.length} món</span></div>
        {!orderedProducts.length ? <p className="lookbook-editorial__empty">Bộ sưu tập này chưa có sản phẩm được xuất bản.</p> : <ul>{outfit.map(({ product, variants, availableVariants, variantId, selected }) => <li key={product.id} id={`lookbook-item-${product.id}`} className={!availableVariants.length ? 'is-unavailable' : ''}>
          <label className="lookbook-editorial__choice"><input type="checkbox" checked={selected} disabled={!availableVariants.length || addingOutfit} onChange={(event) => setSelectedProducts((current) => ({ ...current, [product.id]: event.target.checked }))} /><span className="sr-only">Thêm {product.name} vào bộ đồ</span></label>
          <Link className="lookbook-editorial__product-image" to={`/products/${encodeURIComponent(product.slug)}`} aria-label={`Xem ${product.name}`}><ResponsiveImage src={product.images?.[0]?.url ?? ''} alt={product.images?.[0]?.alt?.trim() || product.name} width={180} height={225} sizes="72px" /></Link>
          <div className="lookbook-editorial__product-copy"><Link to={`/products/${encodeURIComponent(product.slug)}`}>{product.name}</Link><strong>{formatVnd(product.price)}</strong>{variants.length > 0 ? <label className="lookbook-editorial__variant">Màu / cỡ<select value={variantId ?? ''} disabled={!availableVariants.length || addingOutfit} onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: Number(event.target.value) }))}><option value="" disabled>Chọn phân loại</option>{variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.available_quantity < 1}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}{variant.available_quantity < 1 ? ' · Hết hàng' : ''}</option>)}</select></label> : <small>Chưa cấu hình phân loại</small>}</div>
          {!availableVariants.length && <small className="lookbook-editorial__stock">Tạm hết hàng</small>}
        </li>)}</ul>}
        <button className="button dark lookbook-editorial__add-all" type="button" onClick={() => void addOutfit()} disabled={!selectedCount || cartSyncLoading || cartAddBusy || addingOutfit}>{addingOutfit ? 'Đang thêm cả bộ…' : `Thêm ${selectedCount} món vào túi`}</button>
        {cartSyncLoading && <p role="status">Đang đồng bộ túi hàng…</p>}
        {feedback && <p className="lookbook-editorial__feedback" role="status">{feedback}</p>}
      </div>
    </section>
    <section className="lookbook-editorial__more" aria-label="Khám phá bộ sưu tập"><p className="eyebrow">KHÁM PHÁ THÊM</p><h2>Chọn từng thiết kế theo cách của bạn</h2><Link className="underline" to={`/collections/${encodeURIComponent(collection.slug)}`}>Xem toàn bộ sản phẩm ↗</Link></section>
  </main>
}
