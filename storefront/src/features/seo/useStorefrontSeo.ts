import { useEffect, useRef } from 'react'
import type { components } from '../../types/api'
import type { StorefrontContentPage } from '../content/content-api'
import type { StorefrontCollection } from '../home/home-api'
import type { StorefrontCategory } from '../home/home-api'
import type { StorefrontBreadcrumbItem } from '../../components/shared/StorefrontBreadcrumbs'
import type { BlogPost } from '../content/blog-api'
import { mediaUrl } from '../../lib/media-url'

type Product = components['schemas']['Product']
type Brand = components['schemas']['CatalogFilterOptionsEnvelope']['data']['brands'][number]
const canonicalCmsPaths: Record<string, string> = {
  contact: '/contact',
  about: '/about',
  careers: '/careers',
  'size-guide': '/size-guide',
  returns: '/policies/returns',
  shipping: '/policies/shipping',
  payment: '/policies/payment',
  privacy: '/policies/privacy',
  terms: '/policies/terms',
  cookies: '/policies/cookies',
}

function getCmsCanonicalPath(path: string, slug?: string): string {
  if (path.startsWith('/policies/')) return path
  const pageSlug = slug ?? (path.startsWith('/pages/') ? path.split('/').filter(Boolean).at(-1) : undefined)
  return pageSlug ? canonicalCmsPaths[pageSlug] ?? path : path
}

type SeoOptions = {
  path: string
  search: string
  detailSlug?: string
  product?: Product | null
  collection?: StorefrontCollection | null
  category?: StorefrontCategory | null
  brand?: Brand
  brandName?: string
  routeListingTitle?: string
  listingProducts?: Product[]
  listingPage?: boolean
  listingCurrentPage?: number
  listingLastPage?: number
  page?: StorefrontContentPage | null
  blogPost?: BlogPost
  breadcrumbs?: StorefrontBreadcrumbItem[]
  storeName: string
  storeTitle: string
  storeDescription: string
  storeImage: string
  favicon?: string | null
  noindex?: boolean
}

export function serializeStorefrontJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function isPrivateOrTransactionalRoute(path: string): boolean {
  return /^\/(?:account(?:\/|$)|wishlist(?:\/|$)|cart(?:\/|$)|checkout(?:\/|$)|track-order(?:\/|$)|login$|register$|forgot-password(?:\/|$)|reset-password(?:\/|$)|verify-email$|newsletter\/unsubscribe(?:\/|$))/.test(path)
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export function useStorefrontSeo({ path, search, detailSlug, product, collection, category, brand, brandName, routeListingTitle, listingProducts = [], listingPage = false, listingCurrentPage, listingLastPage, page, blogPost, breadcrumbs = [], storeName, storeTitle, storeDescription, storeImage, favicon, noindex = false }: SeoOptions) {
  const defaultTitle = useRef(document.title)
  const origin = window.location.origin

  useEffect(() => {
    if (!favicon) return
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) {
      icon = document.createElement('link')
      icon.rel = 'icon'
      document.head.append(icon)
    }
    icon.href = favicon
  }, [favicon])

  useEffect(() => {
    const title = blogPost
      ? blogPost.meta_title || `${blogPost.title} | ${storeName}`
      : path === '/blog'
        ? `Tạp chí phong cách | ${storeName}`
      : page
      ? page.meta_title || page.title
      : path === '/contact'
        ? `Liên hệ | ${storeName}`
      : path === '/about'
        ? `Về chúng tôi | ${storeName}`
      : path === '/careers'
        ? `Cơ hội nghề nghiệp | ${storeName}`
      : path === '/stores'
        ? `Hệ thống cửa hàng | ${storeName}`
      : path === '/faq'
        ? `Trung tâm trợ giúp | ${storeName}`
      : path === '/how-to-order'
        ? `Hướng dẫn mua hàng | ${storeName}`
      : path === '/care-guide'
        ? `Chăm sóc trang phục | ${storeName}`
      : path === '/size-guide'
        ? `Hướng dẫn chọn kích cỡ | ${storeName}`
      : path === '/sitemap'
        ? `Sơ đồ website | ${storeName}`
      : path === '/style-guide'
        ? `Phối đồ theo dịp | ${storeName}`
      : path === '/membership'
        ? `Chương trình thành viên | ${storeName}`
      : path === '/gift-cards'
        ? `Thẻ quà tặng | ${storeName}`
      : path === '/refer-a-friend'
        ? `Giới thiệu bạn bè | ${storeName}`
      : path === '/affiliate'
        ? `Cộng tác viên | ${storeName}`
      : path === '/compare'
        ? `So sánh sản phẩm | ${storeName}`
      : detailSlug && product
        ? product.meta_title || `${product.name} | ${storeName}`
        : path === '/collections'
          ? `Bộ sưu tập | ${storeName}`
        : path === '/new-arrivals'
          ? `Hàng mới | ${storeName}`
        : path === '/best-sellers'
          ? `Bán chạy | ${storeName}`
        : path === '/sale'
          ? `Khuyến mãi | ${storeName}`
        : path === '/brands'
          ? `Thương hiệu | ${storeName}`
        : brandName
          ? brand?.meta_title || `${brandName} | ${storeName}`
        : collection
          ? collection.meta_title || `${collection.name} | ${storeName}`
          : category
            ? category.meta_title || `${category.name} | ${storeName}`
          : storeTitle
    const description = blogPost?.meta_description || blogPost?.excerpt
      || (path === '/blog' ? `Câu chuyện thời trang, cách phối đồ và những gợi ý mới từ ${storeName}.` : undefined)
      || page?.meta_description
      || (detailSlug && product ? product.meta_description || product.short_description : undefined)
      || (path === '/contact' ? `Liên hệ ${storeName} để được hỗ trợ về sản phẩm và đơn hàng.` : undefined)
      || (path === '/stores' ? `Tìm địa chỉ, giờ mở cửa và đường đi đến các cửa hàng ${storeName}.` : undefined)
      || (path === '/faq' ? `Tìm câu trả lời theo chủ đề hoặc liên hệ cửa hàng ${storeName} để được hỗ trợ.` : undefined)
      || (path === '/how-to-order' ? `Hướng dẫn chọn sản phẩm, hoàn tất thanh toán và theo dõi đơn hàng tại ${storeName}.` : undefined)
      || (path === '/care-guide' ? `Tham khảo cách chăm sóc trang phục theo chất liệu và nhãn hướng dẫn của từng sản phẩm tại ${storeName}.` : undefined)
      || (path === '/sitemap' ? `Tìm nhanh danh mục, sản phẩm, thương hiệu và thông tin tại ${storeName}.` : undefined)
      || (path === '/style-guide' ? `Khám phá các gợi ý phối đồ và lookbook do ${storeName} tuyển chọn.` : undefined)
      || (path === '/membership' ? `Tìm hiểu các hạng, cách tích điểm và quyền lợi thành viên tại ${storeName}.` : undefined)
      || (path === '/gift-cards' ? `Chọn mệnh giá, thiết kế và lời nhắn cho thẻ quà tặng ${storeName}.` : undefined)
      || (path === '/refer-a-friend' ? `Tìm hiểu chương trình giới thiệu bạn bè của ${storeName}.` : undefined)
      || (path === '/affiliate' ? `Tìm hiểu chương trình cộng tác viên của ${storeName}.` : undefined)
      || (path === '/compare' ? `So sánh thông tin các thiết kế đang kinh doanh tại ${storeName}.` : undefined)
      || (path === '/collections' ? `Khám phá các bộ sưu tập thời trang từ ${storeName}.` : undefined)
      || (path === '/new-arrivals' ? `Khám phá sản phẩm mới tại ${storeName}.` : undefined)
      || (path === '/best-sellers' ? `Các thiết kế được khách hàng lựa chọn nhiều tại ${storeName}.` : undefined)
      || (path === '/sale' ? `Khám phá sản phẩm đang có ưu đãi tại ${storeName}.` : undefined)
      || (path === '/brands' ? `Khám phá các thương hiệu đang kinh doanh tại ${storeName}.` : undefined)
      || (brandName ? brand?.meta_description || brand?.description || `Khám phá các thiết kế ${brandName} đang có tại ${storeName}.` : undefined)
      || (collection ? collection.meta_description || collection.description : undefined)
      || (category ? category.meta_description || category.description : undefined)
      || storeDescription
    const socialImage = blogPost?.cover_image
      ? new URL(blogPost.cover_image, origin).toString()
      : detailSlug && product?.images?.[0]?.url
      ? new URL(product.images[0].url, origin).toString()
      : collection?.banner
        ? new URL(collection.banner, origin).toString()
        : brand?.banner || brand?.logo
          ? mediaUrl(brand.banner || brand.logo)
        : category?.image
          ? new URL(category.image, origin).toString()
        : storeImage

    document.title = title || defaultTitle.current
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title || defaultTitle.current)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:image"]', 'property', 'og:image', socialImage)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title || defaultTitle.current)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImage)
    setMeta('meta[name="robots"]', 'name', 'robots', isPrivateOrTransactionalRoute(path) || noindex ? 'noindex,nofollow' : 'index,follow')

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    const canonicalUrl = new URL(getCmsCanonicalPath(path, page?.slug) || '/', origin)
    const categorySlug = path.startsWith('/categories/') ? path.split('/').filter(Boolean).at(-1) : path === '/products' ? new URLSearchParams(search).get('category') : null
    if (categorySlug && path === '/products') canonicalUrl.searchParams.set('category', categorySlug)
    canonical.href = canonicalUrl.toString()
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl.toString())
  }, [blogPost, brand, brandName, category, collection, detailSlug, noindex, origin, page, path, product, search, storeDescription, storeImage, storeName, storeTitle])

  useEffect(() => {
    const setPaginationLink = (rel: 'prev' | 'next', targetPage: number | null) => {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-storefront-seo-pagination]`)
      if (targetPage === null || !Number.isInteger(targetPage) || targetPage < 1) {
        link?.remove()
        return
      }
      const params = new URLSearchParams(search)
      if (targetPage === 1) params.delete('page')
      else params.set('page', String(targetPage))
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        link.dataset.storefrontSeoPagination = 'true'
        document.head.append(link)
      }
      link.href = new URL(`${path}${params.size ? `?${params.toString()}` : ''}`, origin).toString()
    }

    if (!listingPage || !listingCurrentPage || !listingLastPage || listingLastPage < 2) {
      setPaginationLink('prev', null)
      setPaginationLink('next', null)
      return
    }

    setPaginationLink('prev', listingCurrentPage > 1 ? listingCurrentPage - 1 : null)
    setPaginationLink('next', listingCurrentPage < listingLastPage ? listingCurrentPage + 1 : null)
  }, [listingCurrentPage, listingLastPage, listingPage, origin, path, search])

  const pageStructuredData = blogPost
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blogPost.title,
          description: blogPost.meta_description || blogPost.excerpt,
          url: new URL(`/blog/${encodeURIComponent(blogPost.slug)}`, origin).toString(),
          ...(blogPost.cover_image ? { image: new URL(blogPost.cover_image, origin).toString() } : {}),
          ...(blogPost.published_at ? { datePublished: blogPost.published_at } : {}),
          author: blogPost.author_name ? { '@type': 'Person', name: blogPost.author_name, ...(blogPost.author_bio ? { description: blogPost.author_bio } : {}) } : { '@type': 'Organization', name: storeName },
          publisher: { '@type': 'Organization', name: storeName },
          mainEntityOfPage: new URL(`/blog/${encodeURIComponent(blogPost.slug)}`, origin).toString(),
        }
      : path === '/blog'
        ? { '@context': 'https://schema.org', '@type': 'Blog', name: `Tạp chí phong cách | ${storeName}`, url: new URL('/blog', origin).toString() }
      : path === '/'
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': `${origin}/#organization`, name: storeName, url: `${origin}/`, logo: new URL('/branding/net-studio-mark.png', origin).toString() },
          { '@type': 'WebSite', '@id': `${origin}/#website`, name: storeName, url: `${origin}/`, publisher: { '@id': `${origin}/#organization` }, potentialAction: { '@type': 'SearchAction', target: `${origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
        ],
      }
      : detailSlug && product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': new URL(`/products/${encodeURIComponent(product.slug)}#product`, origin).toString(),
          name: product.name,
          description: product.meta_description || product.short_description || product.description,
          image: product.images?.map((image) => new URL(image.url, origin).toString()),
          url: new URL(`/products/${encodeURIComponent(product.slug)}`, origin).toString(),
          sku: product.variants?.find((variant) => variant.sku)?.sku,
          brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : { '@type': 'Brand', name: storeName },
          ...(product.rating && product.rating.count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating.average, reviewCount: product.rating.count, bestRating: 5, worstRating: 1 } } : {}),
          ...(product.review_samples?.length ? { review: product.review_samples.map((review) => ({
            '@type': 'Review',
            itemReviewed: { '@id': new URL(`/products/${encodeURIComponent(product.slug)}#product`, origin).toString() },
            author: { '@type': 'Person', name: review.customer?.name || 'Khách hàng' },
            datePublished: review.created_at,
            ...(review.title ? { name: review.title } : {}),
            ...(review.content ? { reviewBody: review.content } : {}),
            reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
          })) } : {}),
          ...(product.variants?.length ? {
            offers: {
              '@type': 'AggregateOffer',
              url: new URL(`/products/${encodeURIComponent(product.slug)}`, origin).toString(),
              priceCurrency: 'VND',
              lowPrice: Math.min(...product.variants.map((variant) => variant.price)),
              highPrice: Math.max(...product.variants.map((variant) => variant.price)),
              offerCount: product.variants.length,
              availability: product.variants.some((variant) => variant.available_quantity > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: { '@id': `${origin}/#organization` },
            },
          } : {}),
        }
        : page
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.meta_title || page.title,
            description: page.meta_description || undefined,
            url: new URL(getCmsCanonicalPath(path, page.slug), origin).toString(),
            isPartOf: { '@id': `${origin}/#website` },
            ...(page.created_at ? { datePublished: page.created_at } : {}),
            ...(page.updated_at ? { dateModified: page.updated_at } : {}),
          }
        : path === '/contact'
        ? {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: `Liên hệ ${storeName}`,
            url: new URL('/contact', origin).toString(),
            isPartOf: { '@id': `${origin}/#website` },
          }
        : path === '/membership'
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Chương trình thành viên | ${storeName}`,
            description: `Tìm hiểu các hạng, cách tích điểm và quyền lợi thành viên tại ${storeName}.`,
            url: new URL('/membership', origin).toString(),
            isPartOf: { '@id': `${origin}/#website` },
          }
        : path === '/gift-cards'
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Thẻ quà tặng | ${storeName}`,
            description: `Chọn mệnh giá, thiết kế và lời nhắn cho thẻ quà tặng ${storeName}.`,
            url: new URL('/gift-cards', origin).toString(),
            isPartOf: { '@id': `${origin}/#website` },
          }
        : path === '/refer-a-friend' || path === '/affiliate'
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${path === '/refer-a-friend' ? 'Giới thiệu bạn bè' : 'Cộng tác viên'} | ${storeName}`,
            description: path === '/refer-a-friend' ? `Tìm hiểu chương trình giới thiệu bạn bè của ${storeName}.` : `Tìm hiểu chương trình cộng tác viên của ${storeName}.`,
            url: new URL(path, origin).toString(),
            isPartOf: { '@id': `${origin}/#website` },
          }
        : collection || category || brandName || routeListingTitle
        ? {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: collection?.name ?? category?.name ?? brandName ?? routeListingTitle,
            description: collection?.meta_description || collection?.description || category?.meta_description || category?.description || undefined,
            url: new URL(collection ? collection.is_lookbook && path.startsWith('/lookbook/') ? `/lookbook/${encodeURIComponent(collection.slug)}` : `/collections/${encodeURIComponent(collection.slug)}` : category ? path.startsWith('/categories/') ? `/categories/${encodeURIComponent(category.slug)}` : `/products?category=${encodeURIComponent(category.slug)}` : path, origin).toString(),
            ...(collection?.banner || category?.image ? { image: new URL(collection?.banner ?? category?.image ?? '', origin).toString() } : {}),
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: listingProducts.map((item) => ({
                '@type': 'ListItem',
                url: new URL(`/products/${encodeURIComponent(item.slug)}`, origin).toString(),
                item: {
                  '@type': 'Product',
                  name: item.name,
                  ...(item.images?.[0]?.url ? { image: new URL(item.images[0].url, origin).toString() } : {}),
                },
              })),
            },
          }
        : null

  const breadcrumbStructuredData = breadcrumbs.length > 1 ? {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(item.href ?? path, origin).toString(),
    })),
  } : null
  const structuredData = pageStructuredData && breadcrumbStructuredData
    ? { '@context': 'https://schema.org', '@graph': [pageStructuredData, breadcrumbStructuredData] }
    : pageStructuredData ?? (breadcrumbStructuredData ? { '@context': 'https://schema.org', ...breadcrumbStructuredData } : null)

  return { structuredData }
}
