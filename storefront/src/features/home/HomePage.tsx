import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { preload } from 'react-dom'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { CategoryRail } from './CategoryRail'
import { HomeServiceStrip } from './HomeServiceStrip'
import { HomeProductRail } from './HomeProductRail'
import { HomeLatestArticles } from './HomeLatestArticles'
import { HomeReviewRail } from './HomeReviewRail'
import { HomeLookbook } from './HomeLookbook'
import { NewsletterForm } from './NewsletterForm'
import { CampaignCountdown } from './CampaignCountdown'
import { DEFAULT_STOREFRONT_HOME_SECTIONS, type StorefrontBanner, type StorefrontCategory, type StorefrontCollection, type StorefrontHomeSection, type StorefrontInstagramPost, type StorefrontPageLink } from './home-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import type { MembershipProgramData } from '../account/membership-api'
import { useStorefrontLocale } from '../../lib/storefront-locale'
import type { CatalogProduct } from '../catalog/catalog-api'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

type HomePageProps = {
  storeName: string
  codEnabled: boolean
  bankTransferEnabled: boolean
  homeSections?: StorefrontHomeSection[]
  instagramPosts?: StorefrontInstagramPost[]
  instagramProfileUrl?: string
  membershipProgram?: MembershipProgramData
  membershipProgramLoading?: boolean
  membershipProgramError?: boolean
  onRetryMembershipProgram?: () => void
  recentlyViewedContent?: ReactNode
  personalizedContent?: ReactNode
  storeEmail?: string | null
  storePhone?: string | null
  returnPolicyPage?: StorefrontPageLink
  contactPage?: StorefrontPageLink
  heroBanners: StorefrontBanner[]
  mobileHeroBanners: StorefrontBanner[]
  campaignBanner?: StorefrontBanner
  lookbookCollection?: StorefrontCollection
  collections: StorefrontCollection[]
  categories: StorefrontCategory[]
  bannersLoading: boolean
  bannersError: boolean
  categoriesLoading: boolean
  categoriesError: boolean
  collectionsLoading: boolean
  collectionsError: boolean
  onRetryBanners: () => void
  onRetryCategories: () => void
  onRetryCollections: () => void
  onAddToCart?: (item: NonNullable<StorefrontCollection['products']>[number], variantId: number | null) => Promise<boolean>
  isWishlisted: (productId: number) => boolean
  onToggleWishlist: (product: CatalogProduct) => void
  onAddCatalogProductToCart: (product: CatalogProduct, variantId: number) => Promise<boolean>
  cartSyncLoading?: boolean
  cartAddBusy?: boolean
  cartAddError?: string
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname ? url.href : null
  } catch {
    return null
  }
}

function findAccessoryCategorySlug(categories: StorefrontCategory[]): string | undefined {
  for (const category of categories) {
    if (/(^|-)phu-kien($|-)|accessor(y|ies)?/i.test(category.slug)) return category.slug
    const childSlug = findAccessoryCategorySlug(category.children ?? [])
    if (childSlug) return childSlug
  }
  return undefined
}

function containsAsciiControlOrWhitespace(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x20 || code === 0x7f
  })
}

function BannerLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const destination = href.trim()
  const isInternal = destination.startsWith('/') && !destination.startsWith('//') && !destination.includes('\\') && !containsAsciiControlOrWhitespace(destination)
  if (isInternal) return <Link className={className} to={destination}>{children}</Link>

  const safeUrl = safeHttpUrl(destination)
  if (safeUrl) return <a className={className} href={safeUrl}>{children}</a>

  // Keep legacy malformed destinations visible without making them clickable.
  return <span className={className}>{children}</span>
}

function CampaignMedia({ banner, videoUrl }: { banner: StorefrontBanner; videoUrl: string | null }) {
  const [videoFailed, setVideoFailed] = useState(false)
  if (!videoUrl || videoFailed) return <ResponsiveImage src={banner.image} alt={banner.alt} width={1200} height={800} />

  return <>
    <video src={videoUrl} poster={banner.image} controls playsInline preload="none" aria-label={banner.title} aria-describedby="campaign-video-description" onError={() => setVideoFailed(true)} />
    <p id="campaign-video-description" className="sr-only">{banner.description || banner.alt}</p>
  </>
}

function HomeHeroCarousel({ storeName, banners, mobileBanners, loading, error, onRetry, locale }: {
  storeName: string
  banners: StorefrontBanner[]
  mobileBanners: StorefrontBanner[]
  loading: boolean
  error: boolean
  onRetry: () => void
  locale: 'en' | 'vi'
}) {
  const slides = banners.slice(0, 4)
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 620px)').matches)
  const [failedHeroVideoUrl, setFailedHeroVideoUrl] = useState('')
  const prefersReducedMotion = useReducedMotion()
  const [autoplay] = useState(() => Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnFocusIn: true, stopOnInteraction: false, rootNode: (emblaRoot) => emblaRoot.closest('.hero') }))
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: slides.length > 1, duration: prefersReducedMotion === false ? 25 : 0 }, prefersReducedMotion === false ? [autoplay] : [])
  const activeIndex = Math.min(requestedIndex, Math.max(slides.length - 1, 0))
  const banner = slides[activeIndex]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 620px)')
    const update = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const updateIndex = () => setRequestedIndex(emblaApi.selectedScrollSnap())
    updateIndex()
    emblaApi.on('select', updateIndex)
    emblaApi.on('reInit', updateIndex)
    return () => {
      emblaApi.off('select', updateIndex)
      emblaApi.off('reInit', updateIndex)
    }
  }, [emblaApi])

  if (!banner?.image) {
    if (loading) return <section className="hero" aria-busy="true"><div className="hero-copy"><p className="eyebrow">{storeName}</p><div className="hero-copy-skeleton" aria-hidden="true" /><p className="sr-only" role="status">{locale === 'en' ? 'Loading campaign…' : 'Đang tải chiến dịch…'}</p></div><div className="hero-visual"><div className="hero-media-skeleton" aria-hidden="true" /></div></section>
    if (error) return <section className="container home-banner-error" role="alert"><img src="/illustrations/connection-error.svg" alt="" aria-hidden="true" /><div><p>{locale === 'en' ? 'Campaign content could not be loaded.' : 'Chưa tải được nội dung chiến dịch.'}</p><button className="button dark" type="button" onClick={onRetry}>{locale === 'en' ? 'Try again' : 'Thử lại'}</button></div></section>
    return null
  }

  return <section className="hero" aria-roledescription={slides.length > 1 ? 'carousel' : undefined} aria-label={slides.length > 1 ? 'Chiến dịch nổi bật' : undefined}>
    <div className="hero-copy" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">{storeName} · CHIẾN DỊCH</p>
      <h1>{banner.title}</h1>
      {banner.description && <p className="hero-description">{banner.description}</p>}
      <BannerLink className="button light" href={banner.link ?? '/products'}>{locale === 'en' ? 'Discover ↗' : 'Khám phá ↗'}</BannerLink>
    </div>
    <div className="hero-visual">
      <div className="hero-carousel-viewport" ref={emblaRef}>
        <div className="hero-carousel-container">
          {slides.map((slide, index) => {
            const slideMobile = mobileBanners[index]?.image ? mobileBanners[index] : null
            const slideAlt = isMobile && slideMobile ? slideMobile.alt?.trim() || slideMobile.title : slide.alt
            const slideVideoUrl = safeHttpUrl(slide.video_url)
            const slideVideoFailed = Boolean(slideVideoUrl && failedHeroVideoUrl === slideVideoUrl)
            return <div className="hero-carousel-slide" key={slide.id} aria-hidden={index !== activeIndex} inert={index !== activeIndex}>
              {slideVideoUrl && !slideVideoFailed
                ? <><video className="hero-banner-video" src={slideVideoUrl} poster={slide.image} controls playsInline preload="none" aria-label={slide.title} aria-describedby={`hero-video-description-${slide.id}`} onError={() => setFailedHeroVideoUrl(slideVideoUrl)} /><p id={`hero-video-description-${slide.id}`} className="sr-only">Video chiến dịch: {slide.description || slideAlt}</p></>
                : <ResponsiveImage pictureClassName="hero-banner" mobileSrc={slideMobile?.image} src={slide.image} alt={slideAlt} width={1600} height={900} fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} sizes="100vw" />}
              {index === activeIndex && getMediaDisclosureLabel(slideAlt) && <DemoConceptBadge label={getMediaDisclosureLabel(slideAlt) ?? undefined} />}
            </div>
          })}
        </div>
      </div>
      {slides.length > 1 && <div className="home-hero-controls" role="group" aria-label="Điều khiển chiến dịch">
        <button type="button" className="home-hero-arrow" aria-label="Chiến dịch trước" onClick={() => emblaApi?.scrollPrev()}>‹</button>
        <div className="home-hero-pagination" role="group" aria-label="Chọn chiến dịch">
          {slides.map((slide, index) => <button key={slide.id} type="button" aria-label={`Đến chiến dịch ${index + 1}: ${slide.title}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => emblaApi?.scrollTo(index)} />)}
        </div>
        <button type="button" className="home-hero-arrow" aria-label="Chiến dịch tiếp theo" onClick={() => emblaApi?.scrollNext()}>›</button>
      </div>}
    </div>
  </section>
}

export function HomePage({
  storeName,
  codEnabled,
  bankTransferEnabled,
  homeSections = DEFAULT_STOREFRONT_HOME_SECTIONS,
  instagramPosts = [],
  instagramProfileUrl,
  membershipProgram,
  membershipProgramLoading = false,
  membershipProgramError = false,
  onRetryMembershipProgram,
  recentlyViewedContent,
  personalizedContent,
  storeEmail,
  storePhone,
  returnPolicyPage,
  contactPage,
  heroBanners,
  mobileHeroBanners,
  campaignBanner,
  lookbookCollection,
  collections,
  categories,
  bannersLoading,
  bannersError,
  categoriesLoading,
  categoriesError,
  collectionsLoading,
  collectionsError,
  onRetryBanners,
  onRetryCategories,
  onRetryCollections,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onAddCatalogProductToCart,
  cartSyncLoading = false,
  cartAddBusy = false,
  cartAddError = '',
}: HomePageProps) {
  const locale = useStorefrontLocale()
  const prefersReducedMotion = useReducedMotion()
  const campaignVideoUrl = safeHttpUrl(campaignBanner?.video_url)
  const firstHeroBanner = heroBanners[0]
  const firstMobileHeroBanner = mobileHeroBanners[0]
  if (firstHeroBanner?.image) {
    preload(firstHeroBanner.image, { as: 'image', fetchPriority: 'high', imageSizes: '100vw', media: '(min-width: 621px)' })
    preload(firstMobileHeroBanner?.image || firstHeroBanner.image, { as: 'image', fetchPriority: 'high', imageSizes: '100vw', media: '(max-width: 620px)' })
  }
  const accessoryCategorySlug = findAccessoryCategorySlug(categories)
  const bestSellerTabs = [
    { key: 'all', label: locale === 'en' ? 'All' : 'Tất cả' },
    { key: 'men', label: locale === 'en' ? 'Men' : 'Nam', targetGender: 'men' as const },
    { key: 'women', label: locale === 'en' ? 'Women' : 'Nữ', targetGender: 'women' as const },
    ...(accessoryCategorySlug ? [{ key: 'accessories', label: locale === 'en' ? 'Accessories' : 'Phụ kiện', category: accessoryCategorySlug }] : []),
  ]

  const blocks: Record<StorefrontHomeSection['key'], ReactNode> = {
    hero: <HomeHeroCarousel storeName={storeName} banners={heroBanners} mobileBanners={mobileHeroBanners} loading={bannersLoading} error={bannersError} onRetry={onRetryBanners} locale={locale} />, service_strip: <HomeServiceStrip codEnabled={codEnabled} bankTransferEnabled={bankTransferEnabled} storeEmail={storeEmail} storePhone={storePhone} returnPolicyPage={returnPolicyPage} contactPage={contactPage} />, categories: <CategoryRail categories={categories} isLoading={categoriesLoading} isError={categoriesError} onRetry={onRetryCategories} />, collections: collectionsLoading ? <section className="container home-collections" aria-label="Bộ sưu tập" aria-busy="true"><div className="section-title"><div><p className="eyebrow">CHỌN THEO CÂU CHUYỆN</p><h2>Bộ sưu tập</h2></div></div><div className="home-collection-grid" aria-hidden="true"><div className="home-collection-skeleton" /><div className="home-collection-skeleton" /></div><p className="sr-only" role="status">Đang tải bộ sưu tập…</p></section> : collectionsError ? <section className="container home-collections" aria-label="Bộ sưu tập"><div className="empty"><img className="storefront-state-illustration" src="/illustrations/connection-error.svg" alt="" aria-hidden="true" /><h2>Chưa tải được bộ sưu tập</h2><p>Kiểm tra kết nối rồi thử lại.</p><button className="button dark" type="button" onClick={onRetryCollections}>Thử lại</button></div></section> : collections.length > 0 && <section className="container home-collections" aria-label="Bộ sưu tập"><div className="section-title"><div><p className="eyebrow">CHỌN THEO CÂU CHUYỆN</p><h2>Bộ sưu tập {storeName}</h2></div><Link to="/products">Xem tất cả ↗</Link></div><div className="home-collection-grid">{collections.map((collection) => <Link className="home-collection-card" to={`/collections/${collection.slug}`} key={collection.id}><ResponsiveImage src={collection.banner} alt={collection.banner_alt?.trim() || `Ảnh bộ sưu tập ${collection.name}`} width={800} height={1000} sizes="(max-width: 620px) 100vw, 33vw" />{getMediaDisclosureLabel(collection.banner_alt) && <DemoConceptBadge label={getMediaDisclosureLabel(collection.banner_alt) ?? undefined} />}<span>{collection.name}</span><small>{collection.description}</small></Link>)}</div></section>, new_arrivals: <HomeProductRail eyebrow="MỚI TỪ SARADA" title="Sản phẩm mới" sort="newest" filter="new" isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAddToCart={onAddCatalogProductToCart} cartSyncLoading={cartSyncLoading} cartAddBusy={cartAddBusy} cartAddError={cartAddError} />, best_sellers: <HomeProductRail eyebrow="ĐƯỢC YÊU THÍCH" title="Sản phẩm bán chạy" sort="bestseller" filter="best_seller" tabs={bestSellerTabs} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAddToCart={onAddCatalogProductToCart} cartSyncLoading={cartSyncLoading} cartAddBusy={cartAddBusy} cartAddError={cartAddError} />, recently_viewed: recentlyViewedContent, personalized: personalizedContent,
    campaign: campaignBanner && <section className="story"><div className="story-image"><CampaignMedia key={campaignVideoUrl ?? campaignBanner.image} banner={campaignBanner} videoUrl={campaignVideoUrl} />{getMediaDisclosureLabel(campaignBanner.alt) && <DemoConceptBadge label={getMediaDisclosureLabel(campaignBanner.alt) ?? undefined} />}</div><div><p className="eyebrow">CÂU CHUYỆN {storeName.toLocaleUpperCase('vi-VN')}</p><h2>{campaignBanner.title}</h2>{campaignBanner.description && <p className="story-description">{campaignBanner.description}</p>}{campaignBanner.show_countdown && <CampaignCountdown banner={campaignBanner} />}<BannerLink className="underline" href={campaignBanner.link ?? '/products'}>Khám phá chiến dịch ↗</BannerLink></div></section>, lookbook: lookbookCollection && <HomeLookbook collection={lookbookCollection} storeName={storeName} onAddToCart={onAddToCart} cartSyncLoading={cartSyncLoading} cartAddBusy={cartAddBusy} cartAddError={cartAddError} />, newsletter: <section className="newsletter footer-newsletter-band" aria-labelledby="home-newsletter-title"><h2 id="home-newsletter-title">Đăng ký nhận tin</h2><p>Câu chuyện về bộ sưu tập, chất liệu và thiết kế sắp ra mắt.</p><NewsletterForm storeName={storeName} idPrefix="home-footer-newsletter" /><Link className="footer-unsubscribe-link" to="/newsletter/unsubscribe">Hủy nhận email</Link></section>,
    membership: <section className="container home-membership" aria-labelledby="home-membership-title"><div className="home-membership__copy"><p className="eyebrow">ĐẶC QUYỀN THÀNH VIÊN</p><h2 id="home-membership-title">Mỗi lần mua sắm, thêm quyền lợi</h2><p>Tích điểm sau đơn hàng đã giao và thanh toán, rồi dùng điểm để giảm giá cho lần mua tiếp theo.</p>{membershipProgramLoading ? <p role="status" aria-busy="true">Đang tải quyền lợi thành viên…</p> : membershipProgramError ? <div role="status"><p>Chưa tải được các hạng thành viên.</p><button type="button" className="text-button" onClick={onRetryMembershipProgram}>Thử lại</button></div> : membershipProgram ? <><p className="home-membership__rule">1 điểm = {money.format(membershipProgram.point_value_vnd)} · Hết hạn sau {membershipProgram.points_expire_after_months} tháng</p><ul aria-label="Các hạng thành viên">{membershipProgram.tiers.map((tier) => <li key={tier.key}><span>{tier.name}</span><small>{(tier.earn_rate_basis_points / 10_000).toLocaleString('vi-VN')}× tích điểm</small></li>)}</ul></> : null}<Link className="button dark" to="/membership">Khám phá chương trình ↗</Link></div><div className="home-membership__aside" aria-hidden="true"><span>MEMBER</span><strong>Điểm tích lũy<br />quyền lợi dài lâu</strong><i>✳</i></div></section>,
    instagram: instagramPosts.length > 0 && <section className="container home-instagram" aria-labelledby="home-instagram-title"><div className="section-title"><div><p className="eyebrow">THEO DÕI {storeName.toLocaleUpperCase('vi-VN')}</p><h2 id="home-instagram-title">{storeName} trên Instagram</h2></div><a href={safeHttpUrl(instagramProfileUrl) ?? instagramPosts[0].post_url} target="_blank" rel="noreferrer">Xem Instagram ↗</a></div><div className="home-instagram__grid">{instagramPosts.slice(0, 6).map((post) => <a key={post.post_url} href={post.post_url} target="_blank" rel="noreferrer" aria-label={post.alt}><ResponsiveImage src={post.image_url} alt={post.alt} width={480} height={480} loading="lazy" sizes="(max-width: 620px) 50vw, 16vw" /></a>)}</div></section>,
  }
  const configured = homeSections.length === DEFAULT_STOREFRONT_HOME_SECTIONS.length ? homeSections : DEFAULT_STOREFRONT_HOME_SECTIONS
  const enabledSections = configured.filter((section) => section.enabled)
  const sectionNodes = enabledSections.map(({ key }, index) => blocks[key] ? <motion.div
    className="home-section-reveal"
    key={key}
    initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.6, delay: index === 0 ? 0 : 0.04, ease: [0.22, 1, 0.36, 1] }}
  >{blocks[key]}</motion.div> : null)
  const latestArticlesNode = <motion.div
    className="home-section-reveal"
    key="latest-articles"
    initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.6, delay: enabledSections.length ? 0.04 : 0, ease: [0.22, 1, 0.36, 1] }}
  ><HomeLatestArticles /></motion.div>
  const latestReviewsNode = <motion.div
    className="home-section-reveal"
    key="latest-reviews"
    initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.6, delay: enabledSections.length ? 0.04 : 0, ease: [0.22, 1, 0.36, 1] }}
  ><HomeReviewRail /></motion.div>
  const instagramSectionIndex = enabledSections.findIndex((section) => section.key === 'instagram')
  if (instagramSectionIndex >= 0) sectionNodes.splice(instagramSectionIndex, 0, latestReviewsNode, latestArticlesNode)
  else sectionNodes.push(latestReviewsNode, latestArticlesNode)
  return (
    <div>
      {!configured.some((section) => section.key === 'hero' && section.enabled) && <h1 className="sr-only">{storeName}</h1>}
      {sectionNodes}
    </div>
  )
}
