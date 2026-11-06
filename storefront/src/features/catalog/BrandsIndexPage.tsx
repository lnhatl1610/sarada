import { Link } from 'react-router'
import type { components } from '../../types/api'
import './BrandsIndexPage.css'

type Brand = components['schemas']['CatalogFilterOptionsEnvelope']['data']['brands'][number]

function brandInitial(name: string): string {
  const first = name.trim().charAt(0)
  const normalized = (first === 'Đ' || first === 'đ' ? 'D' : first).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('vi-VN')
  return /^[A-Z]$/.test(normalized) ? normalized : '#'
}

export function BrandsIndexPage({ brands, loading, error, onRetry }: {
  brands: Brand[]
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const collator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true })
  const groupedBrands = new Map<string, Brand[]>()
  brands.forEach((brand) => {
    const initial = brandInitial(brand.name)
    groupedBrands.set(initial, [...(groupedBrands.get(initial) ?? []), brand])
  })
  const letters = [...groupedBrands.keys()].sort((left, right) => left === '#' ? -1 : right === '#' ? 1 : left.localeCompare(right))

  return <section className="container subpage brands-index-page" aria-labelledby="brands-index-title">
    <p className="eyebrow">SARADA</p>
    <h1 id="brands-index-title">Thương hiệu</h1>
    <p className="brands-index-intro">Khám phá các thương hiệu đang có sản phẩm tại cửa hàng.</p>
    {loading ? <p role="status">Đang tải thương hiệu…</p>
      : error ? <div className="empty" role="alert"><h2>Chưa tải được danh sách thương hiệu</h2><button className="button dark" type="button" onClick={onRetry}>Thử lại</button></div>
        : brands.length ? <>
          <nav className="brands-index-letters" aria-label="Nhảy đến chữ cái thương hiệu">{letters.map((letter) => <a key={letter} href={`#brand-letter-${letter}`} aria-label={`Thương hiệu chữ ${letter}`}>{letter}</a>)}</nav>
          <div className="brands-index-groups">{letters.map((letter) => <section key={letter} aria-labelledby={`brand-letter-${letter}`}>
            <h2 id={`brand-letter-${letter}`}>{letter}</h2>
            <ul className="brands-index-list">{(groupedBrands.get(letter) ?? []).sort((left, right) => collator.compare(left.name, right.name)).map((brand) => <li key={brand.slug}><Link to={`/brands/${encodeURIComponent(brand.slug)}`}><span>{brand.name}</span><span aria-hidden="true">↗</span></Link></li>)}</ul>
          </section>)}</div>
        </>
          : <div className="empty"><h2>Chưa có thương hiệu</h2><p>Danh sách sẽ xuất hiện khi cửa hàng có thương hiệu đang kinh doanh.</p></div>}
  </section>
}
