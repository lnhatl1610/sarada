import { Link } from 'react-router'
import type { StorefrontCollection } from '../home/home-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import './CollectionsIndexPage.css'

type Props = {
  collections: StorefrontCollection[]
  loading: boolean
  error: boolean
  onRetry: () => void
}

export function CollectionsIndexPage({ collections, loading, error, onRetry }: Props) {
  return <div className="container storefront-collections-index">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Bộ sưu tập</span></nav>
    <p className="eyebrow">CÂU CHUYỆN THIẾT KẾ</p>
    <h1>Bộ sưu tập</h1>
    <p className="storefront-collections-intro">Khám phá những thiết kế được tuyển chọn theo mùa và cảm hứng.</p>
    {loading ? <div className="storefront-collections-grid" aria-busy="true" aria-label="Đang tải bộ sưu tập">{Array.from({ length: 3 }, (_, index) => <div className="storefront-collection-skeleton" key={index}><span /><i /><i /></div>)}</div>
      : error ? <div className="empty" role="alert"><h2>Chưa tải được bộ sưu tập</h2><p>Kiểm tra kết nối rồi thử lại.</p><button className="button dark" type="button" onClick={onRetry}>Thử lại</button></div>
        : collections.length === 0 ? <div className="empty"><h2>Chưa có bộ sưu tập được xuất bản</h2><p>Quay lại sau để khám phá những câu chuyện thiết kế mới.</p><Link className="button dark" to="/products">Xem tất cả sản phẩm</Link></div>
          : <div className="storefront-collections-grid">{collections.map((collection) => <article className="storefront-collection-card" key={collection.id}>
            <Link className="storefront-collection-cover" to={`/collections/${encodeURIComponent(collection.slug)}`} aria-label={`Xem bộ sưu tập ${collection.name}`}>
              <ResponsiveImage src={collection.banner} alt={collection.banner_alt?.trim() || `Ảnh bộ sưu tập ${collection.name}`} width={900} height={1100} sizes="(max-width: 620px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              {getMediaDisclosureLabel(collection.banner_alt) && <DemoConceptBadge label={getMediaDisclosureLabel(collection.banner_alt) ?? undefined} />}
            </Link>
            <div><h2><Link to={`/collections/${encodeURIComponent(collection.slug)}`}>{collection.name}</Link></h2>{collection.description && <p>{collection.description}</p>}<Link className="storefront-collection-link" to={`/collections/${encodeURIComponent(collection.slug)}`}>Khám phá bộ sưu tập</Link></div>
          </article>)}</div>}
  </div>
}
