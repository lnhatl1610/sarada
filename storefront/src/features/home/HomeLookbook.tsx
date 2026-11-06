import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, X } from 'lucide-react'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { formatVnd } from '../../lib/money'
import { fetchStorefrontCollection, type StorefrontCollection } from './home-api'

export function HomeLookbook({ collection, storeName, onAddToCart, cartSyncLoading = false, cartAddBusy = false, cartAddError = '' }: {
  collection: StorefrontCollection
  storeName: string
  onAddToCart?: (item: NonNullable<StorefrontCollection['products']>[number], variantId: number | null) => Promise<boolean>
  cartSyncLoading?: boolean
  cartAddBusy?: boolean
  cartAddError?: string
}) {
  const [activeProductId, setActiveProductId] = useState<number | null>(null)
  const lookbookQuery = useQuery({
    queryKey: ['storefront', 'lookbook', collection.slug],
    queryFn: ({ signal }) => fetchStorefrontCollection(collection.slug, signal),
    staleTime: 5 * 60_000,
  })
  const products = lookbookQuery.data?.products ?? []
  const pins = lookbookQuery.data?.lookbook_products ?? []
  const activePin = pins.find((pin) => pin.id === activeProductId)
  const activeProduct = products.find((product) => product.id === activeProductId)
  const activeImage = activeProduct?.images?.[0]

  return <section className="lookbook container shop-the-look" aria-labelledby="home-lookbook-title">
    <div className="lookbook-copy">
      <p className="eyebrow">LOOKBOOK · {storeName.toLocaleUpperCase('vi-VN')}</p>
      <h2 id="home-lookbook-title">{collection.name}</h2>
      {collection.description && <p>{collection.description}</p>}
      <Link className="underline" to={`/lookbook/${collection.slug}`}>Xem toàn bộ lookbook ↗</Link>
      {lookbookQuery.isError && <p className="home-lookbook-error" role="status">Chưa tải được sản phẩm trong lookbook. <button type="button" onClick={() => void lookbookQuery.refetch()}>Thử lại</button></p>}
      {pins.length > 0 && <div className="home-lookbook-product-list" aria-label="Sản phẩm trong lookbook">
        {pins.map((pin) => {
          const product = products.find((item) => item.id === pin.id)
          return <Link key={pin.id} to={`/products/${encodeURIComponent(pin.slug)}`} onMouseEnter={() => setActiveProductId(pin.id)} onFocus={() => setActiveProductId(pin.id)}>
            <span>{pin.name}</span>
            {product && <strong>{formatVnd(product.price)}</strong>}
          </Link>
        })}
      </div>}
    </div>
    <div className="lookbook-image home-lookbook-image">
      <ResponsiveImage src={collection.banner} alt={collection.banner_alt} width={1200} height={1000} sizes="(max-width: 760px) 100vw, 52vw" />
      {pins.map((pin) => <span key={pin.id} className={`home-lookbook-hotspot${pin.x < 30 ? ' is-left' : pin.x > 70 ? ' is-right' : ''}`} style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
        <button type="button" className={activeProductId === pin.id ? 'is-active' : ''} aria-label={`Xem sản phẩm ${pin.name}`} aria-expanded={activeProductId === pin.id} onClick={() => setActiveProductId(activeProductId === pin.id ? null : pin.id)}>
          <Plus aria-hidden="true" size={17} />
        </button>
        {activeProductId === pin.id && <span className="home-lookbook-popover">
          <button className="home-lookbook-popover-close" type="button" aria-label="Đóng thông tin sản phẩm" onClick={() => setActiveProductId(null)}><X size={15} /></button>
          {activeImage && <ResponsiveImage src={activeImage.url} srcSet={activeImage.srcset ?? undefined} alt={getProductImageAlt(activeImage.url, activeImage.alt, activeProduct?.name ?? pin.name)} width={96} height={120} sizes="96px" />}
          <span><strong>{activeProduct?.name ?? activePin?.name}</strong>{activeProduct && <small>{formatVnd(activeProduct.price)}</small>}{activeProduct && onAddToCart && <button type="button" className="home-lookbook-add" disabled={cartSyncLoading || cartAddBusy || !activeProduct.variants?.some((variant) => variant.available_quantity > 0)} onClick={() => { const variant = activeProduct.variants?.find((item) => item.available_quantity > 0); void onAddToCart(activeProduct, variant?.id ?? null) }}>{cartSyncLoading ? 'Đang đồng bộ túi…' : cartAddBusy ? 'Đang thêm…' : 'Thêm vào túi'}</button>}{cartAddError && <small className="home-lookbook-add-error" role="alert">{cartAddError}</small>}<Link to={`/products/${encodeURIComponent(pin.slug)}`}>Chi tiết sản phẩm ↗</Link></span>
        </span>}
      </span>)}
      {lookbookQuery.isPending && <span className="home-lookbook-loading" role="status">Đang tải sản phẩm…</span>}
    </div>
  </section>
}
