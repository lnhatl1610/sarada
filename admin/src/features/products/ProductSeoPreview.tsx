type ProductSeoPreviewProps = {
  title?: string
  slug?: string
  description?: string
}

export function ProductSeoPreview({ title, slug, description }: ProductSeoPreviewProps) {
  const { t } = useTranslation()
  const displayTitle = title?.trim() || t('Tên sản phẩm')
  const displaySlug = slug?.trim() || 'duong-dan-san-pham'
  const displayDescription = description?.trim() || t('Mô tả sản phẩm sẽ xuất hiện tại đây.')

  return (
    <article className="product-seo-preview reference-wide" aria-label={t('Xem trước kết quả tìm kiếm')}>
      <span className="product-seo-preview-label">{t('Xem trước kết quả tìm kiếm')}</span>
      <small>/{displaySlug}</small>
      <strong>{displayTitle}</strong>
      <p>{displayDescription}</p>
    </article>
  )
}
import { useTranslation } from 'react-i18next'

