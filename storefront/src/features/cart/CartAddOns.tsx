import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { fetchRelatedCatalogProducts, type CatalogProduct } from '../catalog/catalog-api'
import type { CartLine, CartProduct } from './cart-types'

export function CartAddOns<TProduct extends CartProduct>({ cart, formatMoney, busy, onAdd }: {
  cart: CartLine<TProduct>[]
  formatMoney: (amount: number) => string
  busy: boolean
  onAdd: (product: CatalogProduct, variantId: number) => Promise<boolean>
}) {
  const baseSlug = cart[0]?.product.slug ?? ''
  const query = useQuery({
    queryKey: ['cart', 'page-recommendations', baseSlug],
    queryFn: ({ signal }) => fetchRelatedCatalogProducts(baseSlug, signal),
    enabled: Boolean(baseSlug),
    staleTime: 60_000,
    retry: 1,
  })
  const cartProductIds = new Set(cart.map((line) => line.productId ?? line.product.id))
  const products = (query.data ?? []).filter((product) => !cartProductIds.has(product.id) && product.variants?.some((variant) => variant.available_quantity > 0)).slice(0, 4)

  return <section className="cart-add-ons" aria-labelledby="cart-add-ons-title" aria-busy={query.isFetching}>
    <div className="cart-add-ons-heading"><div><p className="eyebrow">PHỐI CÙNG</p><h2 id="cart-add-ons-title">Gợi ý mua kèm</h2></div></div>
    {query.isPending ? <p className="cart-sync-state" role="status">Đang tìm sản phẩm phù hợp…</p>
      : query.isError ? <div className="cart-sync-error" role="alert"><span>Chưa tải được gợi ý sản phẩm.</span><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div>
        : products.length ? <div className="cart-add-ons-grid">{products.map((product) => <CartAddOnCard key={product.id} product={product} formatMoney={formatMoney} busy={busy} onAdd={onAdd} />)}</div>
          : <p className="cart-sync-state">Chưa có sản phẩm liên quan còn hàng để gợi ý.</p>}
  </section>
}

function CartAddOnCard({ product, formatMoney, busy, onAdd }: {
  product: CatalogProduct
  formatMoney: (amount: number) => string
  busy: boolean
  onAdd: (product: CatalogProduct, variantId: number) => Promise<boolean>
}) {
  const variants = (product.variants ?? []).filter((variant) => variant.available_quantity > 0)
  const [variantId, setVariantId] = useState<number | null>(null)
  const selected = variants.find((variant) => variant.id === variantId)
  const image = product.images?.[0]
  const mediaLabel = getMediaDisclosureLabel(image?.alt)

  return <article className="cart-add-on-card">
    <Link to={`/products/${product.slug}`} className="cart-add-on-image" aria-label={`Xem ${product.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}>
      <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={600} height={800} loading="lazy" sizes="(max-width:620px) 44vw, 18vw" />
      {mediaLabel && <DemoConceptBadge label={mediaLabel} />}
    </Link>
    <Link className="cart-add-on-name" to={`/products/${product.slug}`}>{product.name}</Link>
    <strong>{formatMoney(selected?.price ?? product.price)}</strong>
    <label className="sr-only" htmlFor={`cart-add-on-variant-${product.id}`}>Chọn màu và kích cỡ cho {product.name}</label>
    <select id={`cart-add-on-variant-${product.id}`} value={variantId ?? ''} disabled={busy} onChange={(event) => setVariantId(Number(event.currentTarget.value) || null)}>
      <option value="">Chọn màu / kích cỡ</option>
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku} — {formatMoney(variant.price)}</option>)}
    </select>
    <button type="button" disabled={busy || !selected} onClick={() => selected && void onAdd(product, selected.id)}>{busy ? 'Đang thêm…' : 'Thêm vào túi'}</button>
  </article>
}
