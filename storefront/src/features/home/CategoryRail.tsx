import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router'
import type { StorefrontCategory } from './home-api'
import { fetchCatalogProducts } from '../catalog/catalog-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'

type CategoryRailProps = {
  categories: StorefrontCategory[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const audienceChoices = [
  { key: 'women', label: 'Nữ', gender: 'women' as const },
  { key: 'men', label: 'Nam', gender: 'men' as const },
]

export function CategoryRail({ categories, isLoading, isError, onRetry }: CategoryRailProps) {
  const audienceQueries = useQueries({
    queries: audienceChoices.map(({ gender }) => ({
      queryKey: ['products', 'home-audience-tile', gender],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchCatalogProducts(`?target_gender=${gender}&sort=newest&per_page=1`, signal),
      staleTime: 60_000,
    })),
  })

  if (isLoading) {
    return <section className="container home-category-rail" aria-label="Danh mục" aria-busy="true">
      <div className="section-title"><div><p className="eyebrow">TÌM THEO PHONG CÁCH</p><h2>Danh mục</h2></div></div>
      <div className="home-category-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div className="home-category-skeleton" key={index} />)}</div>
      <p className="sr-only" role="status">Đang tải danh mục…</p>
    </section>
  }

  if (isError) {
    return <section className="container home-category-rail" aria-label="Danh mục">
      <div className="section-title"><div><p className="eyebrow">TÌM THEO PHONG CÁCH</p><h2>Danh mục</h2></div></div>
      <div className="home-product-error" role="alert"><p>Chưa tải được danh mục sản phẩm.</p><button className="button dark" type="button" onClick={onRetry}>Thử lại</button></div>
    </section>
  }

  const accessoryCategory = categories.find((category) => /(^|-)phu-kien($|-)|accessor(y|ies)?/i.test(category.slug))
  const otherCategories = categories.filter((category) => category.slug !== 'hang-moi' && category.id !== accessoryCategory?.id).slice(0, accessoryCategory ? 2 : 3)
  const audienceTiles = audienceChoices.flatMap((choice, index) => {
    const product = audienceQueries[index]?.data?.[0]
    const image = product?.images?.[0]
    return product && image ? [{
      key: choice.key,
      label: choice.label,
      href: `/products?target_gender=${choice.gender}`,
      image: image.url,
      alt: image.alt?.trim() || product.name,
      disclosureAlt: image.alt,
      srcSet: image.srcset ?? undefined,
    }] : []
  })
  const categoryTiles = otherCategories.map((category) => ({
    key: `category-${category.id}`,
    label: category.name,
    href: `/categories/${encodeURIComponent(category.slug)}`,
    image: category.image,
    alt: category.image_alt?.trim() || `Ảnh danh mục ${category.name}`,
    disclosureAlt: category.image_alt,
    srcSet: undefined,
  }))
  if (accessoryCategory) {
    categoryTiles.push({
      key: `category-${accessoryCategory.id}`,
      label: accessoryCategory.name,
      href: `/categories/${encodeURIComponent(accessoryCategory.slug)}`,
      image: accessoryCategory.image,
      alt: accessoryCategory.image_alt?.trim() || `Ảnh danh mục ${accessoryCategory.name}`,
      disclosureAlt: accessoryCategory.image_alt,
      srcSet: undefined,
    })
  }
  const tiles = [...audienceTiles, ...categoryTiles].slice(0, 5)

  if (!tiles.length) return null

  return <section className="container home-category-rail" aria-label="Danh mục">
    <div className="section-title"><div><p className="eyebrow">TÌM THEO PHONG CÁCH</p><h2>Danh mục sản phẩm</h2></div><Link to="/products">Xem tất cả ↗</Link></div>
    <div className="home-category-grid">
      {tiles.map((tile) => <Link className="home-category-card" to={tile.href} key={tile.key} aria-label={tile.label}>
        <div className="home-category-image"><ResponsiveImage src={tile.image} srcSet={tile.srcSet} alt={tile.alt} width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />{getMediaDisclosureLabel(tile.disclosureAlt) && <DemoConceptBadge label={getMediaDisclosureLabel(tile.disclosureAlt) ?? undefined} />}</div>
        <span>{tile.label}</span>
      </Link>)}
    </div>
  </section>
}
