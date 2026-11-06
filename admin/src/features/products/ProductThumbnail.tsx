import { useState } from 'react'
import { mediaUrl } from '../../lib/media-url'

type ProductThumbnailInput = {
  name: string
  thumbnail?: string | null
  images?: { url: string; is_primary?: boolean; sort_order?: number }[]
}

export function ProductThumbnail({ product, apiUrl }: { product: ProductThumbnailInput; apiUrl: string }) {
  const source = product.thumbnail ?? product.images?.find((image) => image.is_primary)?.url ?? product.images?.[0]?.url
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (!source || failedSource === source) return <i className="product-thumb" aria-hidden="true">{product.name.slice(0, 1).toLocaleUpperCase('vi-VN') || 'N'}</i>
  return <img className="product-thumb product-thumb-image" src={mediaUrl(apiUrl, source)} alt="" loading="lazy" onError={() => setFailedSource(source)} />
}
