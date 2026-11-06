import { Link } from 'react-router'
import type { StorefrontCollection } from '../home/home-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import './StyleGuidePage.css'

type Props = {
  collections: StorefrontCollection[]
  loading: boolean
  error: boolean
  onRetry: () => void
}

export function StyleGuidePage({ collections, loading, error, onRetry }: Props) {
  const guides = collections.filter((collection) => collection.is_lookbook)

  return <main className="container style-guide-page" aria-labelledby="style-guide-title">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Phối đồ theo dịp</span></nav>
    <header className="style-guide-heading"><p className="eyebrow">GỢI Ý PHỐI ĐỒ</p><h1 id="style-guide-title">Mặc theo cách của bạn</h1><p>Khám phá những cách phối đồ do cửa hàng tuyển chọn. Mỗi lookbook có thể chọn màu, kích cỡ và thêm cả bộ vào túi.</p></header>
    {loading ? <div className="style-guide-grid" aria-busy="true" aria-label="Đang tải gợi ý phối đồ">{Array.from({ length: 3 }, (_, index) => <div className="style-guide-skeleton" key={index}><span /><i /><i /></div>)}</div>
      : error ? <section className="style-guide-state" role="alert"><h2>Chưa tải được gợi ý phối đồ</h2><p>Kiểm tra kết nối rồi thử lại.</p><button className="button dark" type="button" onClick={onRetry}>Thử lại</button></section>
        : guides.length ? <div className="style-guide-grid">{guides.map((guide, index) => {
          const disclosure = getMediaDisclosureLabel(guide.banner_alt)
          return <article className="style-guide-card" key={guide.id}>
            <Link className="style-guide-card-image" to={`/lookbook/${encodeURIComponent(guide.slug)}`} aria-label={`Khám phá cách phối đồ: ${guide.name}`}>
              <ResponsiveImage src={guide.banner} alt={guide.banner_alt?.trim() || `Lookbook ${guide.name}`} width={900} height={1125} sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" />
              {disclosure && <DemoConceptBadge label={disclosure} />}
              <span className="style-guide-card-index">{String(index + 1).padStart(2, '0')}</span>
            </Link>
            <div className="style-guide-card-copy"><p className="eyebrow">LOOK {String(index + 1).padStart(2, '0')}</p><h2><Link to={`/lookbook/${encodeURIComponent(guide.slug)}`}>{guide.name}</Link></h2>{guide.description && <p>{guide.description}</p>}<Link className="style-guide-card-link" to={`/lookbook/${encodeURIComponent(guide.slug)}`}>Xem cách phối và chọn cả bộ <span aria-hidden="true">↗</span></Link></div>
          </article>
        })}</div> : <section className="style-guide-state"><h2>Lookbook đang được cập nhật</h2><p>Khi cửa hàng xuất bản gợi ý phối đồ, chúng sẽ xuất hiện tại đây.</p><Link className="button dark" to="/collections">Khám phá bộ sưu tập</Link></section>}
  </main>
}
