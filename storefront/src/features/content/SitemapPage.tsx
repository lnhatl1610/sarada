import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { fetchCatalogFilterOptions } from '../catalog/catalog-api'
import { fetchStorefrontCategories, fetchStorefrontCollections, fetchStorefrontPageLinks } from '../home/home-api'

type SitemapLink = { label: string; href: string }

function flattenCategories(nodes: Awaited<ReturnType<typeof fetchStorefrontCategories>>): SitemapLink[] {
  return nodes.flatMap((node) => [
    { label: node.name, href: `/categories/${encodeURIComponent(node.slug)}` },
    ...flattenCategories(node.children ?? []),
  ])
}

function SitemapGroup({ title, query, links }: { title: string; query: { isPending: boolean; isError: boolean; refetch: () => Promise<unknown> }; links: SitemapLink[] }) {
  return <section className="sitemap-group" aria-labelledby={`sitemap-${title}`}>
    <h2 id={`sitemap-${title}`}>{title}</h2>
    {query.isPending ? <p role="status">Đang tải liên kết…</p> : query.isError ? <div role="alert"><p>Chưa tải được nhóm liên kết này.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : links.length ? <ul>{links.map((link) => <li key={link.href}><Link to={link.href}>{link.label}</Link></li>)}</ul> : <p>Chưa có nội dung được xuất bản.</p>}
  </section>
}

export function SitemapPage() {
  const categories = useQuery({ queryKey: ['storefront-sitemap', 'categories'], queryFn: ({ signal }) => fetchStorefrontCategories(signal), staleTime: 300_000, retry: 1 })
  const collections = useQuery({ queryKey: ['storefront-sitemap', 'collections'], queryFn: ({ signal }) => fetchStorefrontCollections(signal), staleTime: 300_000, retry: 1 })
  const brands = useQuery({ queryKey: ['storefront-sitemap', 'brands'], queryFn: ({ signal }) => fetchCatalogFilterOptions(signal), staleTime: 300_000, retry: 1 })
  const pages = useQuery({ queryKey: ['storefront-sitemap', 'pages'], queryFn: ({ signal }) => fetchStorefrontPageLinks(signal), staleTime: 300_000, retry: 1 })

  const quickLinks = [
    { label: 'Trang chủ', href: '/' }, { label: 'Tất cả sản phẩm', href: '/products' },
    { label: 'Bộ sưu tập', href: '/collections' }, { label: 'Thương hiệu', href: '/brands' },
    { label: 'Hàng mới', href: '/new-arrivals' }, { label: 'Bán chạy', href: '/best-sellers' },
    { label: 'Khuyến mãi', href: '/sale' }, { label: 'Phối đồ theo dịp', href: '/style-guide' }, { label: 'Tạp chí phong cách', href: '/blog' },
    { label: 'Hệ thống cửa hàng', href: '/stores' }, { label: 'Trung tâm trợ giúp', href: '/faq' },
    { label: 'Chương trình thành viên', href: '/membership' }, { label: 'Thẻ quà tặng', href: '/gift-cards' },
    { label: 'Giới thiệu bạn bè', href: '/refer-a-friend' }, { label: 'Cộng tác viên', href: '/affiliate' }, { label: 'Liên hệ', href: '/contact' },
  ]

  return <main className="container subpage sitemap-page" aria-labelledby="sitemap-title">
    <p className="eyebrow">SARADA</p>
    <h1 id="sitemap-title">Sơ đồ website</h1>
    <p className="sitemap-intro">Đi nhanh đến sản phẩm, bộ sưu tập, chính sách và thông tin cửa hàng.</p>
    <div className="sitemap-grid">
      <SitemapGroup title="Khám phá" query={{ isPending: false, isError: false, refetch: async () => undefined }} links={quickLinks} />
      <SitemapGroup title="Danh mục" query={categories} links={flattenCategories(categories.data ?? [])} />
      <SitemapGroup title="Bộ sưu tập" query={collections} links={(collections.data ?? []).map((item) => ({ label: item.name, href: `/collections/${encodeURIComponent(item.slug)}` }))} />
      <SitemapGroup title="Thương hiệu" query={brands} links={(brands.data?.brands ?? []).map((item) => ({ label: item.name, href: `/brands/${encodeURIComponent(item.slug)}` }))} />
      <SitemapGroup title="Trang thông tin" query={pages} links={(pages.data ?? []).filter((item) => item.is_published).map((item) => ({ label: item.title, href: `/pages/${encodeURIComponent(item.slug)}` }))} />
    </div>
  </main>
}
