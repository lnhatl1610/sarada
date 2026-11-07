import { useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FacebookShareButton } from 'react-share'
import { fetchCatalogProduct, type CatalogProduct } from './catalog-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import './ProductComparePage.css'

type ProductComparePageProps = {
  slugs: string[]
  onRemove: (slug: string) => void
  onClear: () => void
  formatMoney: (amount: number) => string
}

export function ProductComparePage({ slugs, onRemove, onClear, formatMoney }: ProductComparePageProps) {
  const [shareMessage, setShareMessage] = useState('')
  const shareUrl = `${window.location.origin}/compare?products=${encodeURIComponent(slugs.join(','))}`
  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['products', 'compare', slug],
      queryFn: ({ signal }) => fetchCatalogProduct(slug, signal),
      staleTime: 60_000,
      retry: 1,
    })),
  })
  const products = queries.flatMap((query) => query.data ? [query.data] : [])
  const failedProducts = queries.flatMap((query, index) => {
    const slug = slugs[index]
    return query.isError && slug ? [{ slug, isFetching: query.isFetching, retry: query.refetch }] : []
  })
  const loading = queries.some((query) => query.isPending)
  const copyShareLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable')
      await navigator.clipboard.writeText(shareUrl)
      setShareMessage('Đã sao chép liên kết so sánh.')
    } catch {
      setShareMessage('Trình duyệt không cho phép sao chép liên kết.')
    }
  }

  if (!slugs.length) return <div className="container subpage product-compare-page">
    <p className="eyebrow">SO SÁNH</p><h1>So sánh sản phẩm</h1>
    <div className="empty"><h2>Chưa có sản phẩm để so sánh</h2><p>Chọn tối đa bốn sản phẩm trong danh sách để xem các điểm khác nhau.</p><Link className="button dark" to="/products">Khám phá sản phẩm</Link></div>
  </div>

  return <div className="container subpage product-compare-page">
    <div className="product-compare-heading"><div><p className="eyebrow">CHỌN TỐI ĐA 4 SẢN PHẨM</p><h1>So sánh sản phẩm</h1><p>Đối chiếu giá, chất liệu, phom dáng và lựa chọn màu, kích cỡ.</p></div><div className="product-compare-actions"><button className="text-button" type="button" onClick={() => void copyShareLink()}>Sao chép liên kết</button><FacebookShareButton className="text-button" url={shareUrl} aria-label="Chia sẻ danh sách so sánh trên Facebook">Facebook</FacebookShareButton><button className="text-button" type="button" onClick={onClear}>Xóa danh sách</button></div></div>
    {shareMessage && <p className="product-compare-state" role="status" aria-live="polite">{shareMessage}</p>}
    {loading && <p className="product-compare-state" role="status">Đang tải thông tin sản phẩm…</p>}
    {failedProducts.length > 0 && <div className="product-compare-state product-compare-failures" role="alert">
      <p>Chưa tải được một số sản phẩm. Hãy thử lại hoặc bỏ từng mục khỏi danh sách.</p>
      <ul>{failedProducts.map(({ slug, isFetching, retry }) => <li key={slug}>
        <span>Sản phẩm: <code>{slug}</code></span>
        <div><button type="button" disabled={isFetching} onClick={() => void retry()}>{isFetching ? 'Đang thử lại…' : 'Thử lại'}</button><button type="button" onClick={() => onRemove(slug)}>Bỏ khỏi so sánh</button></div>
      </li>)}</ul>
    </div>}
    {products.length > 0 && <div className="product-compare-table-wrap" role="region" aria-label="Bảng so sánh sản phẩm" tabIndex={0}>
      <table className="product-compare-table">
        <thead><tr><th scope="col">Thông tin</th>{products.map((product) => <th scope="col" key={product.id}><ProductHeading product={product} onRemove={onRemove} /></th>)}</tr></thead>
        <tbody>
          <CompareRow label="Giá hiện tại">{products.map((product) => <span key={product.id}>{formatMoney(product.price)}</span>)}</CompareRow>
          <CompareRow label="Giá niêm yết">{products.map((product) => <span key={product.id}>{product.compare_at_price && product.compare_at_price > product.price ? formatMoney(product.compare_at_price) : '—'}</span>)}</CompareRow>
          <CompareRow label="Thương hiệu">{products.map((product) => <span key={product.id}>{product.brand?.name ?? '—'}</span>)}</CompareRow>
          <CompareRow label="Danh mục">{products.map((product) => <span key={product.id}>{product.category?.name ?? '—'}</span>)}</CompareRow>
          <CompareRow label="Chất liệu">{products.map((product) => <span key={product.id}>{product.material || 'Chưa cập nhật'}</span>)}</CompareRow>
          <CompareRow label="Phom dáng">{products.map((product) => <span key={product.id}>{product.fit || 'Chưa cập nhật'}</span>)}</CompareRow>
          <CompareRow label="Màu sắc">{products.map((product) => <span key={product.id}>{joinUnique((product.variants ?? []).map((variant) => variant.color))}</span>)}</CompareRow>
          <CompareRow label="Kích cỡ">{products.map((product) => <span key={product.id}>{joinUnique((product.variants ?? []).map((variant) => variant.size))}</span>)}</CompareRow>
          <CompareRow label="Tình trạng">{products.map((product) => <span key={product.id}>{(product.variants ?? []).some((variant) => variant.available_quantity > 0) ? 'Còn hàng' : 'Tạm hết hàng'}</span>)}</CompareRow>
          <CompareRow label="Đánh giá">{products.map((product) => <span key={product.id}>{product.rating.count ? `${product.rating.average.toFixed(1)} / 5 (${product.rating.count})` : 'Chưa có đánh giá'}</span>)}</CompareRow>
          <CompareRow label="Mô tả">{products.map((product) => <span key={product.id}>{product.short_description || '—'}</span>)}</CompareRow>
        </tbody>
      </table>
    </div>}
    {products.length > 0 && products.length < 4 && <p className="product-compare-add-more"><Link to="/products">+ Thêm sản phẩm để so sánh</Link></p>}
  </div>
}

function ProductHeading({ product, onRemove }: { product: CatalogProduct; onRemove: (slug: string) => void }) {
  const image = product.images?.[0]
  return <div className="product-compare-product">
    <button className="product-compare-remove" type="button" onClick={() => onRemove(product.slug)} aria-label={`Xóa ${product.name} khỏi so sánh`}>×</button>
    <Link to={`/products/${product.slug}`}><ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={image?.alt ?? product.name} width={360} height={450} loading="lazy" sizes="(max-width: 620px) 65vw, 240px" /><strong>{product.name}</strong></Link>
  </div>
}

function CompareRow({ label, children }: { label: string; children: ReactNode[] }) {
  return <tr><th scope="row">{label}</th>{children.map((value, index) => <td key={index}>{value}</td>)}</tr>
}

function joinUnique(values: Array<string | null | undefined>): string {
  const result = [...new Set(values.filter((value): value is string => Boolean(value?.trim()))) ]
  return result.length ? result.join(', ') : '—'
}
