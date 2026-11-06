import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import type { ProductDetailProduct } from './ProductDetailPage'

type Props = {
  products: ProductDetailProduct[]
  loading: boolean
  error: boolean
  retry: () => void
  adding: boolean
  cartReady: boolean
  formatMoney: (amount: number) => string
  onAdd: (product: ProductDetailProduct, variantId: number, quantity: number) => Promise<boolean>
}

export function OutfitBuilder({ products, loading, error, retry, adding, cartReady, formatMoney, onAdd }: Props) {
  const items = useMemo(() => products
    .filter((product) => product.variants?.some((variant) => variant.available_quantity > 0))
    .slice(0, 4), [products])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [variantIds, setVariantIds] = useState<Record<number, number>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedProducts = items.filter((product) => selectedIds.includes(product.id))
  const selectedVariants = selectedProducts.map((product) => product.variants?.find((variant) => variant.id === variantIds[product.id]))
  const estimatedTotal = selectedVariants.reduce((sum, variant) => sum + (variant?.price ?? 0), 0)
  const hasMissingVariant = selectedVariants.some((variant) => !variant || variant.available_quantity < 1)

  const toggleProduct = (product: ProductDetailProduct, checked: boolean) => {
    setMessage('')
    setSelectedIds((current) => checked ? [...current, product.id] : current.filter((id) => id !== product.id))
  }

  const addSelectedOutfit = async () => {
    if (!selectedProducts.length || hasMissingVariant || busy || !cartReady) return
    setBusy(true)
    setMessage('')
    let addedCount = 0
    try {
      for (let index = 0; index < selectedProducts.length; index += 1) {
        const variant = selectedVariants[index]
        if (!variant || !await onAdd(selectedProducts[index]!, variant.id, 1)) continue
        addedCount += 1
      }
    } catch {
      setMessage('Có lỗi khi thêm outfit. Hãy kiểm tra túi hàng vì một số món có thể đã được thêm.')
      return
    } finally {
      setBusy(false)
    }
    setMessage(addedCount === selectedProducts.length
      ? `Đã thêm ${addedCount} sản phẩm vào túi.`
      : addedCount > 0
        ? `Đã thêm ${addedCount}/${selectedProducts.length} sản phẩm. Món còn lại chưa thêm được; hãy kiểm tra túi hàng trước khi thử lại.`
        : 'Chưa thêm được sản phẩm nào. Hãy kiểm tra tồn kho rồi thử lại.')
  }

  return (
    <section className="outfit-builder" aria-labelledby="outfit-builder-title">
      <div className="outfit-builder-heading">
        <div>
          <p className="outfit-builder-eyebrow">GỢI Ý PHỐI CÙNG</p>
          <h2 id="outfit-builder-title">Hoàn thiện outfit</h2>
        </div>
        {selectedProducts.length > 0 && <p className="outfit-builder-total"><span>Tổng ước tính</span><strong>{formatMoney(estimatedTotal)}</strong></p>}
      </div>
      <p className="outfit-builder-note">Chọn các sản phẩm liên quan và biến thể còn hàng. Đây là gợi ý theo danh mục, chưa phải set phối được cửa hàng xác nhận; giá cuối cùng được tính ở giỏ hàng.</p>
      {loading ? <p className="state" role="status">Đang tải gợi ý phối đồ…</p>
        : error ? <div className="catalog-stale-error" role="alert"><span>Chưa tải được gợi ý phối đồ.</span><button type="button" onClick={retry}>Thử lại</button></div>
          : items.length ? <>
            <div className="outfit-builder-grid">
              {items.map((product) => {
                const availableVariants = product.variants?.filter((variant) => variant.available_quantity > 0) ?? []
                const image = product.images?.[0]
                const disclosure = getMediaDisclosureLabel(image?.alt)
                const checked = selectedIds.includes(product.id)
                return <article className="outfit-builder-item" key={product.id}>
                  <label className="outfit-builder-select">
                    <input type="checkbox" checked={checked} onChange={(event) => toggleProduct(product, event.currentTarget.checked)} aria-label={`Chọn ${product.name} để thêm vào outfit`} />
                    <span>Chọn món này</span>
                  </label>
                  <Link to={`/products/${product.slug}`} className="outfit-builder-image" aria-label={`Xem ${product.name}${disclosure ? `, ${disclosure}` : ''}`}>
                    <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt="" width={600} height={800} sizes="(max-width: 620px) 42vw, 17vw" />
                    {disclosure && <DemoConceptBadge label={disclosure} />}
                  </Link>
                  <Link className="outfit-builder-name" to={`/products/${product.slug}`}>{product.name}</Link>
                  <strong className="outfit-builder-price">Từ {formatMoney(product.price)}</strong>
                  {checked && <label className="outfit-builder-variant">Màu / kích cỡ
                    <select value={variantIds[product.id] ?? ''} onChange={(event) => { setMessage(''); setVariantIds((current) => ({ ...current, [product.id]: Number(event.currentTarget.value) })) }}>
                      <option value="">Chọn biến thể</option>
                      {availableVariants.map((variant) => <option key={variant.id} value={variant.id}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku} — {formatMoney(variant.price)}</option>)}
                    </select>
                  </label>}
                </article>
              })}
            </div>
            <div className="outfit-builder-actions">
              <p aria-live="polite" role={message.startsWith('Chưa') || message.startsWith('Đã thêm ') && message.includes('/') ? 'alert' : 'status'}>{message || `${selectedProducts.length} món đã chọn`}</p>
              <button type="button" className="button dark" disabled={!cartReady || adding || busy || !selectedProducts.length || hasMissingVariant} onClick={() => void addSelectedOutfit()}>
                {busy || adding ? 'Đang thêm…' : `Thêm ${selectedProducts.length || ''} món đã chọn vào túi`}
              </button>
            </div>
            {!cartReady && <p className="state" role="status">Đang đồng bộ túi hàng; bạn có thể chọn món trước.</p>}
          </>
          : <p className="state">Chưa có sản phẩm phối cùng còn hàng.</p>}
    </section>
  )
}
