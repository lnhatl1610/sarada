import { lazy, Suspense, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useStorefrontCart } from '../features/cart/useStorefrontCart'
import { useCheckoutActions } from '../features/checkout/useCheckoutActions'
import { useStorefrontAccount } from '../features/account/useStorefrontAccount'
import { CustomerAccountLayout } from '../features/account/CustomerAccountLayout'
import { MembershipPage } from '../features/account/MembershipPage'
import type { useMembership, useMembershipProgram } from '../features/account/membership-api'
import { MembershipProgramPage } from '../features/account/MembershipProgramPage'
import { VoucherWalletPage } from '../features/account/VoucherWalletPage'
import { NotificationInboxPage } from '../features/account/NotificationInboxPage'
import { NotificationPreferencesPage } from '../features/account/NotificationPreferencesPage'
import { useStorefrontLogin } from '../features/auth/useStorefrontLogin'
import { useStorefrontLogout } from '../features/auth/useStorefrontLogout'
import { useAddressLocations } from '../features/checkout/useAddressLocations'
import { useStorefrontCatalog } from '../features/catalog/useStorefrontCatalog'
import { useHomeContentQueries } from '../features/home/useHomeContentQueries'
import { useStorefrontAppearance } from '../features/appearance/useStorefrontAppearance'
import { StorefrontContentPageError, useStorefrontContentPage } from '../features/content/content-api'
import { BlogRequestError, type useBlogPost } from '../features/content/blog-api'
import { StorefrontAccountRouteGuard } from '../features/auth/StorefrontAccountRouteGuard'
import { isStorefrontPublicAuthRoute } from '../features/auth/isStorefrontPublicAuthRoute'
import { AppearancePicker } from '../features/appearance/AppearancePicker'
import { StorefrontHeader } from '../features/home/StorefrontHeader'
import { StorefrontFooter } from '../features/home/StorefrontFooter'
import { BackToTopButton } from '../features/home/BackToTopButton'
import { StorefrontBreadcrumbs, type StorefrontBreadcrumbItem } from '../components/shared/StorefrontBreadcrumbs'
import { OrderChangeRequestDialog } from '../features/orders/OrderChangeRequestDialog'
import type { TrackedOrder } from '../features/orders/order-types'
import { formatVnd as money } from '../lib/money'
import { serializeStorefrontJsonLd, useStorefrontSeo } from '../features/seo/useStorefrontSeo'
import { isKnownStorefrontPath } from './route-paths'
import { useProductCompare } from '../features/catalog/useProductCompare'
import { StorefrontRecoveryPanel } from './StorefrontRecoveryPanel'
import './StorefrontRecoveryPanel.css'
import type { StorefrontConfiguration } from '../features/storefront/storefront-api'
import type { components } from '../types/api'

const CartPage = lazy(() => import('../features/cart/CartPage').then((module) => ({ default: module.CartPage })))
const BankTransferPaymentPage = lazy(() => import('../features/checkout/BankTransferPaymentPage').then((module) => ({ default: module.BankTransferPaymentPage })))
const BrandsIndexPage = lazy(() => import('../features/catalog/BrandsIndexPage').then((module) => ({ default: module.BrandsIndexPage })))
const NewsletterWelcomePopup = lazy(() => import('../features/home/NewsletterWelcomePopup').then((module) => ({ default: module.NewsletterWelcomePopup })))
const GiftCardPage = lazy(() => import('../features/marketing/GiftCardPage').then((module) => ({ default: module.GiftCardPage })))
const ReferralProgramPage = lazy(() => import('../features/marketing/ReferralProgramPage').then((module) => ({ default: module.ReferralProgramPage })))
const AffiliateProgramPage = lazy(() => import('../features/marketing/ReferralProgramPage').then((module) => ({ default: module.AffiliateProgramPage })))
const SitemapPage = lazy(() => import('../features/content/SitemapPage').then((module) => ({ default: module.SitemapPage })))
const LookbookEditorialPage = lazy(() => import('../features/catalog/LookbookEditorialPage').then((module) => ({ default: module.LookbookEditorialPage })))
const AddressBookPage = lazy(() => import('../features/account/AddressBookPage').then((module) => ({ default: module.AddressBookPage })))
const SharedWishlistPage = lazy(() => import('../features/account/SharedWishlistPage').then((module) => ({ default: module.SharedWishlistPage })))
const AccountDashboardPage = lazy(() => import('../features/account/AccountDashboardPage').then((module) => ({ default: module.AccountDashboardPage })))
const AccountSettingsPage = lazy(() => import('../features/account/AccountSettingsPage').then((module) => ({ default: module.AccountSettingsPage })))
const WishlistPage = lazy(() => import('../features/account/WishlistPage').then((module) => ({ default: module.WishlistPage })))
const StorefrontPublicAuthRoute = lazy(() => import('../features/auth/StorefrontPublicAuthRoute').then((module) => ({ default: module.StorefrontPublicAuthRoute })))
const StorefrontAuthLayout = lazy(() => import('../features/auth/StorefrontAuthLayout').then((module) => ({ default: module.StorefrontAuthLayout })))
const TrackOrderPage = lazy(() => import('../features/orders/TrackOrderPage').then((module) => ({ default: module.TrackOrderPage })))
const AccountOrdersListPage = lazy(() => import('../features/orders/AccountOrdersPage').then((module) => ({ default: module.AccountOrdersListPage })))
const AccountOrderDetailPage = lazy(() => import('../features/orders/AccountOrdersPage').then((module) => ({ default: module.AccountOrderDetailPage })))
const ProductDetailPage = lazy(() => import('../features/catalog/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const StorefrontProductUiFirst = lazy(() => import('../features/catalog/StorefrontProductUiFirst').then((module) => ({ default: module.StorefrontProductUiFirst })))
const RecentlyViewedProducts = lazy(() => import('../features/catalog/RecentlyViewedProducts').then((module) => ({ default: module.RecentlyViewedProducts })))
const PersonalizedProducts = lazy(() => import('../features/catalog/PersonalizedProducts').then((module) => ({ default: module.PersonalizedProducts })))
const CatalogPage = lazy(() => import('../features/catalog/CatalogPage').then((module) => ({ default: module.CatalogPage })))
const StorefrontCatalogUiFirst = lazy(() => import('../features/catalog/StorefrontCatalogUiFirst').then((module) => ({ default: module.StorefrontCatalogUiFirst })))
const ProductComparePage = lazy(() => import('../features/catalog/ProductComparePage').then((module) => ({ default: module.ProductComparePage })))
const CollectionsIndexPage = lazy(() => import('../features/catalog/CollectionsIndexPage').then((module) => ({ default: module.CollectionsIndexPage })))
const StyleGuidePage = lazy(() => import('../features/catalog/StyleGuidePage').then((module) => ({ default: module.StyleGuidePage })))
const StoreLocationsPage = lazy(() => import('../features/content/StoreLocationsPage').then((module) => ({ default: module.StoreLocationsPage })))
const FaqPage = lazy(() => import('../features/content/FaqPage').then((module) => ({ default: module.FaqPage })))
const BlogPage = lazy(() => import('../features/content/BlogPage').then((module) => ({ default: module.BlogPage })))
const CollectionRouteState = lazy(() => import('../features/catalog/CollectionRouteState').then((module) => ({ default: module.CollectionRouteState })))
const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })))
const StorefrontHomeUiFirst = lazy(() => import('../features/home/StorefrontHomeUiFirst').then((module) => ({ default: module.StorefrontHomeUiFirst })))
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const CheckoutSuccessPage = lazy(() => import('../features/checkout/CheckoutSuccessPage').then((module) => ({ default: module.CheckoutSuccessPage })))
const PublicContentPage = lazy(() => import('../features/content/PublicContentPage').then((module) => ({ default: module.PublicContentPage })))

type Customer = components['schemas']['StorefrontUser']

type Props = {
  accessToken: string
  customer: Customer | null
  setAccessToken: Dispatch<SetStateAction<string>>
  setCustomer: Dispatch<SetStateAction<Customer | null>>
  sessionRestored: boolean
  login: ReturnType<typeof useStorefrontLogin>
  logout: ReturnType<typeof useStorefrontLogout>
  cart: ReturnType<typeof useStorefrontCart>
  checkout: ReturnType<typeof useCheckoutActions>
  account: ReturnType<typeof useStorefrontAccount>
  membershipQuery: ReturnType<typeof useMembership>
  membershipProgramQuery: ReturnType<typeof useMembershipProgram>
  membershipPage: number
  setMembershipPage: Dispatch<SetStateAction<number>>
  locations: ReturnType<typeof useAddressLocations>
  catalog: ReturnType<typeof useStorefrontCatalog>
  home: ReturnType<typeof useHomeContentQueries>
  appearance: ReturnType<typeof useStorefrontAppearance>
  contentPageQuery: ReturnType<typeof useStorefrontContentPage>
  blogPostQuery: ReturnType<typeof useBlogPost>
  storefrontConfiguration?: StorefrontConfiguration
  storefrontConfigurationLoading: boolean
  storefrontConfigurationError: boolean
  retryStorefrontConfiguration: () => Promise<unknown>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  mobileMenuOpen: boolean
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>
  toast: string
  checkoutProvinceCode: string
  setCheckoutProvinceCode: Dispatch<SetStateAction<string>>
  cartProvinceCode: string
  setCartProvinceCode: Dispatch<SetStateAction<string>>
}

const DEFAULT_STORE_NAME = 'Sarada'
const DEFAULT_STORE_TITLE = 'Sarada — Thời trang tinh giản'
const DEFAULT_STORE_DESCRIPTION = 'Những thiết kế tinh giản, chất liệu tự nhiên và phom dáng dành cho nhịp sống mỗi ngày.'
const DEFAULT_STORE_OG_IMAGE = new URL('/og-image.svg', window.location.origin).toString()

export function StorefrontRouteContent(props: Props) {
  const membershipProgramQuery = props.membershipProgramQuery
  const [openCartSignal, setOpenCartSignal] = useState(0)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const productCompare = useProductCompare()
  const replaceComparedProducts = productCompare.replace
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const path = routerLocation.pathname
  const checkoutFocusMode = path === '/checkout'
  const showHomeUiFirstPreview = import.meta.env.DEV && path === '/' && new URLSearchParams(routerLocation.search).get('mode') !== 'api'
  const showCatalogUiFirstPreview = import.meta.env.DEV && path === '/products' && new URLSearchParams(routerLocation.search).get('mode') === 'ui'
  const showProductUiFirstPreview = import.meta.env.DEV && path.startsWith('/products/') && new URLSearchParams(routerLocation.search).get('mode') === 'ui'
  const showUiFirstPreview = showHomeUiFirstPreview || showCatalogUiFirstPreview || showProductUiFirstPreview
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])
  const sharedCompareProducts = new URLSearchParams(routerLocation.search).get('products')
  useEffect(() => {
    if (path !== '/compare' || sharedCompareProducts === null) return
    replaceComparedProducts(sharedCompareProducts.split(',').filter(Boolean))
  }, [path, sharedCompareProducts, replaceComparedProducts])
  const { accessToken, customer, setAccessToken, setCustomer, sessionRestored, login, logout } = props
  const { appearance, resolvedMode, setAppearance, appearanceOpen, setAppearanceOpen, closeAppearancePicker, appearanceTokens, themeColor } = props.appearance
  const { cart, cartToken, recoveryEmail: cartRecoveryEmail, setRecoveryEmail: setCartRecoveryEmail, cartSyncStatus, cartSyncError, cartExpired, retry: retryCart, busyItemIds: cartBusyItemIds, changeQuantity: changeCartQuantity, changeVariant: changeCartVariant, removeLine: removeCartLine, add, addBusy: cartAddBusy, addError: cartAddError } = props.cart
  const addToCartAndOpen = async (item: Parameters<typeof add>[0], variantId: Parameters<typeof add>[1], quantity: Parameters<typeof add>[2]) => {
    const added = await add(item, variantId, quantity)
    if (added) setOpenCartSignal((signal) => signal + 1)
    return added
  }
  const reorderOrder = async (order: TrackedOrder) => {
    if (cartSyncStatus !== 'ready') return { added: 0, failed: order.items.length }
    let added = 0
    let failed = 0
    for (const item of order.items) {
      if (item.product_id == null || item.variant_id == null) {
        failed += 1
        continue
      }
      const success = await add({ id: item.product_id, name: item.product_name, slug: '', price: item.unit_price }, item.variant_id, item.quantity)
      if (success) added += 1
      else failed += 1
    }
    if (added > 0 && failed === 0) navigate('/cart')
    return { added, failed }
  }
  const { quote: checkoutQuote, busy: checkoutBusy, previewBusy, previewError, clearPreview: clearCheckoutPreview } = props.checkout
  const { addressActions, wishlist, orderActions, accountQueries } = props.account
  const { addressesQuery, addresses, addressLoadError, customerOrdersQuery, customerOrders, customerOrdersMeta, accountOrderQuery, accountOrder } = accountQueries
  const { provinces: addressProvinceOptions, wards: addressWardOptions, provincesLoading: addressProvincesLoading, provincesError: addressProvincesError, locationsLoading: addressLocationsLoading, locationsError: addressLocationsError, shippingFee, shippingFeeLoading, shippingFeeError, retryShippingFee, retry: retryAddressLocations } = props.locations
  const storefrontConfiguration = props.storefrontConfiguration
  const { banners: storefrontBanners, bannersLoading, bannersError, refetchBanners, categories, categoriesLoading, categoriesError, refetchCategories, collections: storefrontCollections, collectionsLoading, collectionsError, refetchCollections, pageLinks: storefrontPageLinks } = props.home
  const catalog = props.catalog
  const { productPage, products, loading, productsFetching, catalogIsStale, apiUnavailable, refetchProducts, productDetailLoading, productDetailError, refetchProductDetail, product, relatedProducts, relatedLoading, relatedError, refetchRelatedProducts, productReviews, productReviewsMeta, productReviewFilterOptions, setReviewPage, reviewSort, reviewFilters, changeReviewSort, changeReviewFilters, reviewsLoading, reviewsError, refetchProductReviews } = catalog.queries
  const { public_registration_enabled: publicRegistrationEnabled = false, maintenance_enabled: maintenanceEnabled = false, maintenance_message: maintenanceMessage = '', maintenance_expected_until: maintenanceExpectedUntil = '', store_name, seo_title, seo_description, seo_og_image, social_zalo_oa_id: socialZaloOaId } = storefrontConfiguration ?? {}
  const storeBrandName = store_name?.trim() || DEFAULT_STORE_NAME
  const storeSeoTitle = seo_title?.trim() || DEFAULT_STORE_TITLE
  const storeSeoDescription = seo_description?.trim() || DEFAULT_STORE_DESCRIPTION
  const storeSeoImage = seo_og_image?.trim() || DEFAULT_STORE_OG_IMAGE

  useEffect(() => {
    let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.name = 'theme-color'
      document.head.append(themeColorMeta)
    }
    themeColorMeta.content = themeColor
  }, [themeColor])

  const lookbookRoute = path.startsWith('/lookbook/')
  const collectionSlug = path.startsWith('/collections/') || lookbookRoute ? path.split('/').filter(Boolean).at(-1) : undefined
  const categoryRouteSlug = path.startsWith('/categories/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const merchandisingRoute = ['/new-arrivals', '/best-sellers', '/sale'].includes(path)
  const catalogBasePath = collectionSlug ? `/${lookbookRoute ? 'lookbook' : 'collections'}/${encodeURIComponent(collectionSlug)}` : categoryRouteSlug ? `/categories/${encodeURIComponent(categoryRouteSlug)}` : catalog.brandSlug ? `/brands/${encodeURIComponent(catalog.brandSlug)}` : path === '/search' || merchandisingRoute ? path : '/products'
  const detailSlug = path.startsWith('/products/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const slug = path.split('/').filter(Boolean).at(-1)
  const isCatalogRoute = path === '/products' || path === '/search' || merchandisingRoute || Boolean(collectionSlug) || Boolean(categoryRouteSlug) || Boolean(catalog.brandSlug)
  const catalogRouteTitle = path === '/new-arrivals' ? 'Hàng mới' : path === '/best-sellers' ? 'Bán chạy' : path === '/sale' ? 'Khuyến mãi' : undefined
  const isCartRoute = path === '/cart'
  const productPageMeta = productPage?.meta
  const activeCollection = catalog.collection
  const collectionRouteStatus: 'loading' | 'error' | 'not-found' | null = collectionSlug
    ? catalog.collectionLoading
      ? 'loading'
      : catalog.collectionError
        ? catalog.collectionNotFound ? 'not-found' : 'error'
        : lookbookRoute && !catalog.collection?.is_lookbook ? 'not-found' : null
    : path.startsWith('/collections/') || lookbookRoute ? 'not-found' : null
  const activeCategorySlug = categoryRouteSlug ?? (path === '/products' ? new URLSearchParams(routerLocation.search).get('category') : null)
  const findCategory = (items: typeof categories, target: string): (typeof categories)[number] | undefined => {
    for (const item of items) {
      if (item.slug === target) return item
      const nested = item.children ? findCategory(item.children, target) : undefined
      if (nested) return nested
    }
    return undefined
  }
  const activeCategory = activeCategorySlug ? findCategory(categories, activeCategorySlug) : undefined
  const activeBrand = catalog.queries.catalogFilterOptions?.brands.find((brand) => brand.slug === catalog.brandSlug)
  const missingBrand = Boolean(catalog.brandSlug && catalog.queries.catalogFilterOptions && !catalog.queries.catalogFilterOptionsError && !activeBrand)
  const missingCategory = Boolean(activeCategorySlug && !categoriesLoading && !categoriesError && !activeCategory)
  const categoryLookupUnavailable = Boolean(activeCategorySlug && categoriesError)
  const isContentPageRoute = path.startsWith('/pages/') || path === '/contact'
  const missingContentPage = isContentPageRoute && path !== '/contact'
    && props.contentPageQuery.error instanceof StorefrontContentPageError
    && props.contentPageQuery.error.status === 404
  const missingBlogPost = path.startsWith('/blog/') && props.blogPostQuery.error instanceof BlogRequestError && props.blogPostQuery.error.status === 404
  const unresolvedProduct = Boolean(detailSlug && !productDetailLoading && (productDetailError || !product))
  const mobileHeroBanners = storefrontBanners.filter((banner) => banner.placement === 'hero-mobile').slice(0, 4)
  const desktopHeroBanners = storefrontBanners.filter((banner) => banner.placement === 'hero').slice(0, 4)
  const heroBanners = desktopHeroBanners.length > 0 ? desktopHeroBanners : mobileHeroBanners.slice(0, 1)
  const campaignBanner = storefrontBanners.find((banner) => banner.placement === 'campaign')
  const lookbookCollection = storefrontCollections.find((collection) => collection.is_lookbook && Boolean(collection.banner))
  const collectionRail = storefrontCollections.filter((collection) => collection.id !== lookbookCollection?.id)
  const accountBreadcrumb = { label: 'Tài khoản', href: '/account' }
  const categoryTrail = (items: typeof categories, target: string, ancestors: typeof categories = []): typeof categories => {
    for (const item of items) {
      const trail = [...ancestors, item]
      if (item.slug === target) return trail
      const childTrail = item.children?.length ? categoryTrail(item.children, target, trail) : []
      if (childTrail.length) return childTrail
    }
    return []
  }
  const activeCategoryTrail = activeCategorySlug ? categoryTrail(categories, activeCategorySlug) : []
  const currentRouteTrail: StorefrontBreadcrumbItem[] = detailSlug
    ? [{ label: 'Sản phẩm', href: '/products' }, { label: product?.name ?? 'Chi tiết sản phẩm' }]
    : isContentPageRoute ? [{ label: props.contentPageQuery.data?.title ?? (path === '/contact' ? 'Liên hệ' : 'Trang thông tin') }]
    : path === '/search' ? [{ label: 'Sản phẩm', href: '/products' }, { label: 'Tìm kiếm' }]
    : categoryRouteSlug || (path === '/products' && activeCategorySlug)
      ? [{ label: 'Sản phẩm', href: '/products' }, ...activeCategoryTrail.map((item, index) => ({ label: item.name, ...(index < activeCategoryTrail.length - 1 ? { href: `/categories/${encodeURIComponent(item.slug)}` } : {}) }))]
    : path === '/products' ? [{ label: catalogRouteTitle ?? 'Sản phẩm' }]
    : collectionSlug ? [{ label: 'Bộ sưu tập', href: '/collections' }, { label: lookbookRoute ? 'Lookbook' : activeCollection?.name ?? 'Bộ sưu tập' }, ...(lookbookRoute && activeCollection?.name ? [{ label: activeCollection.name }] : [])]
    : path === '/collections' ? [{ label: 'Bộ sưu tập' }]
    : path === '/style-guide' ? [{ label: 'Phối đồ theo dịp' }]
    : path === '/brands' ? [{ label: 'Thương hiệu' }]
    : catalog.brandSlug ? [{ label: 'Thương hiệu', href: '/brands' }, { label: activeBrand?.name ?? 'Thương hiệu' }]
    : path === '/new-arrivals' ? [{ label: 'Hàng mới' }]
    : path === '/best-sellers' ? [{ label: 'Bán chạy' }]
    : path === '/sale' ? [{ label: 'Khuyến mãi' }]
    : path === '/compare' ? [{ label: 'So sánh sản phẩm' }]
    : path === '/stores' ? [{ label: 'Hệ thống cửa hàng' }]
    : path === '/faq' ? [{ label: 'Câu hỏi thường gặp' }]
    : path === '/sitemap' ? [{ label: 'Sơ đồ website' }]
    : path === '/membership' ? [{ label: 'Chương trình thành viên' }]
    : path === '/gift-cards' ? [{ label: 'Thẻ quà tặng' }]
    : path === '/refer-a-friend' ? [{ label: 'Giới thiệu bạn bè' }]
    : path === '/affiliate' ? [{ label: 'Cộng tác viên' }]
    : path === '/cart' ? [{ label: 'Giỏ hàng' }]
    : path === '/checkout' ? [{ label: 'Giỏ hàng', href: '/cart' }, { label: 'Thanh toán' }]
    : path.startsWith('/checkout/payment/') ? [{ label: 'Giỏ hàng', href: '/cart' }, { label: 'Thanh toán', href: '/checkout' }, { label: 'Chuyển khoản' }]
    : path.startsWith('/checkout/success/') || path.startsWith('/order-success/') ? [{ label: 'Giỏ hàng', href: '/cart' }, { label: 'Thanh toán', href: '/checkout' }, { label: 'Đặt hàng thành công' }]
    : path === '/track-order' ? [{ label: 'Theo dõi đơn hàng' }]
    : path === '/account/membership' ? [{ label: 'Tài khoản', href: '/account' }, { label: 'Điểm và quyền lợi' }]
    : path === '/account' ? [{ label: 'Tài khoản' }]
    : path === '/account/settings' ? [accountBreadcrumb, { label: 'Hồ sơ' }]
    : path === '/account/addresses' ? [accountBreadcrumb, { label: 'Địa chỉ' }]
    : path === '/account/wishlist' ? [accountBreadcrumb, { label: 'Yêu thích' }]
    : path === '/account/orders' ? [accountBreadcrumb, { label: 'Đơn hàng' }]
    : path.startsWith('/account/orders/') ? [accountBreadcrumb, { label: 'Đơn hàng', href: '/account/orders' }, { label: slug ?? 'Chi tiết đơn hàng' }]
    : isStorefrontPublicAuthRoute(path) ? [{ label: path === '/login' ? 'Đăng nhập' : path === '/register' ? 'Đăng ký' : path.startsWith('/forgot-password') ? 'Khôi phục mật khẩu' : path.startsWith('/reset-password') ? 'Đặt lại mật khẩu' : path === '/verify-email' ? 'Xác minh email' : 'Tài khoản đang chờ duyệt' }]
    : [{ label: 'Trang thông tin' }]
  const breadcrumbItems: StorefrontBreadcrumbItem[] = path === '/' ? [] : [
    { label: 'Trang chủ', href: '/' },
    ...(maintenanceEnabled ? [{ label: 'Cửa hàng đang bảo trì' }] : currentRouteTrail),
  ]
  const showRouteBreadcrumbs = !isCatalogRoute && path !== '/collections' && path !== '/style-guide'
  const { structuredData } = useStorefrontSeo({ path, search: routerLocation.search, detailSlug, product, collection: activeCollection, category: activeCategory, brand: activeBrand, brandName: activeBrand?.name, routeListingTitle: catalogRouteTitle, listingProducts: products, listingPage: isCatalogRoute && path !== '/brands', listingCurrentPage: productPageMeta?.current_page, listingLastPage: productPageMeta?.last_page, page: isContentPageRoute ? props.contentPageQuery.data : undefined, blogPost: props.blogPostQuery.data, breadcrumbs: breadcrumbItems, storeName: storeBrandName, storeTitle: storeSeoTitle, storeDescription: storeSeoDescription, storeImage: storeSeoImage, favicon: props.storefrontConfiguration?.store_favicon || null, noindex: path === '/compare' || path === '/search' || path === '/gift-cards' || path === '/refer-a-friend' || path === '/affiliate' || (path === '/products' && new URLSearchParams(routerLocation.search).has('q')) || !isKnownStorefrontPath(path) || missingContentPage || missingBlogPost || unresolvedProduct || missingCategory || missingBrand || categoryLookupUnavailable || (collectionSlug !== undefined && collectionRouteStatus !== null) })
  const searchProducts = (value: string) => {
    const query = new URLSearchParams()
    if (value.trim()) query.set('q', value.trim())
    navigate(`/search${query.size ? `?${query.toString()}` : ''}`)
  }
  const removeComparedProduct = (slugToRemove: string) => {
    const next = productCompare.slugs.filter((slug) => slug !== slugToRemove)
    productCompare.replace(next)
    navigate(next.length ? `/compare?products=${encodeURIComponent(next.join(','))}` : '/compare', { replace: true })
  }
  const clearComparedProducts = () => {
    productCompare.clear()
    navigate('/compare', { replace: true })
  }
  const filterProducts = catalog.urlState.applyFilters
  const clearCatalogFilters = catalog.urlState.clearFilters
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const total = cart.every((line) => line.pricedQuantity === line.quantity && line.lineTotal !== undefined)
    ? cart.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0)
    : null
  const selectedShippingProvinceCode = path === '/cart' ? props.cartProvinceCode : path === '/checkout' ? props.checkoutProvinceCode : ''
  const miniCartFreeShippingThreshold = selectedShippingProvinceCode
    ? (shippingFeeLoading || shippingFeeError ? null : shippingFee?.free_shipping_threshold ?? null)
    : storefrontConfiguration?.free_shipping_threshold

  // The search field is a draft; synchronize it when browser navigation changes the URL.

  if (isStorefrontPublicAuthRoute(path)) return <>
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStorefrontJsonLd(structuredData) }} />}
    <StorefrontBreadcrumbs items={breadcrumbItems} />
    <StorefrontPublicAuthRoute path={path} login={login} registrationEnabled={publicRegistrationEnabled} />
  </>

  return <StorefrontAccountRouteGuard path={path} search={routerLocation.search} hash={routerLocation.hash} sessionRestored={sessionRestored} accessToken={accessToken}>
    {!isOnline && <div className="storefront-offline-status" role="status" aria-live="polite">Bạn đang ngoại tuyến. Nội dung đã lưu trên thiết bị có thể đã cũ.</div>}
    {maintenanceEnabled && !path.startsWith('/admin') ? <StorefrontAuthLayout><main className="container subpage auth-page"><StorefrontRecoveryPanel code="BẢO TRÌ" title="Cửa hàng đang bảo trì" message={maintenanceMessage || 'Chúng tôi đang cập nhật cửa hàng. Vui lòng quay lại sau.'} />{maintenanceExpectedUntil && <p className="storefront-recovery__message">Dự kiến hoạt động lại: {new Date(maintenanceExpectedUntil).toLocaleString('vi-VN')}</p>}</main></StorefrontAuthLayout> : <div className="store" data-ui-style={appearance.styleId} data-theme-mode={resolvedMode} style={appearanceTokens}>
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStorefrontJsonLd(structuredData) }} />}
    {!showUiFirstPreview && !checkoutFocusMode && <StorefrontHeader key={`${path}${routerLocation.search}`} categories={categories} collections={storefrontCollections} storeName={storeBrandName} codEnabled={storefrontConfiguration?.payment_cod_enabled ?? false} search={props.search} cartCount={count} wishlistCount={wishlist.products.length} customerName={customer?.name ?? null} onLogout={logout} cart={cart} cartSyncStatus={cartSyncStatus} cartSyncError={cartSyncError} cartExpired={cartExpired} cartBusyItemIds={cartBusyItemIds} cartTotal={total} freeShippingThreshold={miniCartFreeShippingThreshold} cartAddBusy={cartAddBusy} cartAddError={cartAddError} onAddRecommended={(product, variantId) => add(product, variantId, 1)} openCartSignal={openCartSignal} formatMoney={money} mobileMenuOpen={props.mobileMenuOpen} onSearchChange={props.setSearch} onSearchSubmit={searchProducts} onOpenMobileMenu={() => props.setMobileMenuOpen(true)} onCloseMobileMenu={() => props.setMobileMenuOpen(false)} onOpenAppearance={() => setAppearanceOpen(true)} onRetryCart={retryCart} onChangeCartQuantity={changeCartQuantity} onRemoveCartLine={removeCartLine} />}
    {!showUiFirstPreview && appearanceOpen && <AppearancePicker value={appearance} resolvedMode={resolvedMode} onChange={setAppearance} onClose={closeAppearancePicker} />}
    {!showUiFirstPreview && orderActions.orderChangeDialog && <OrderChangeRequestDialog open busy={orderActions.orderChangeBusy} orderCode={orderActions.orderChangeDialog.order.code} type={orderActions.orderChangeDialog.type} onClose={() => orderActions.setOrderChangeDialog(null)} onSubmit={orderActions.submitCustomerOrderChange} />}
    {!showUiFirstPreview && props.toast && <div className="toast" role="status">{props.toast}</div>}

    {path === '/' && !showHomeUiFirstPreview && storefrontConfiguration?.newsletter_welcome_offer_enabled && <Suspense fallback={null}><NewsletterWelcomePopup storeName={storeBrandName} welcomeOfferEnabled={storefrontConfiguration.newsletter_welcome_offer_enabled} /></Suspense>}
    <main id="primary-content" className={`storefront-main${showUiFirstPreview ? ' ui-first-main' : ''}`} aria-label="Nội dung chính" tabIndex={-1}>
      {showHomeUiFirstPreview ? <Suspense fallback={<p className="state" role="status">Đang tải giao diện trang chủ…</p>}><StorefrontHomeUiFirst storeName={storeBrandName} /></Suspense> : showCatalogUiFirstPreview ? <Suspense fallback={<p className="state" role="status">Đang tải giao diện danh sách sản phẩm…</p>}><StorefrontCatalogUiFirst storeName={storeBrandName} /></Suspense> : showProductUiFirstPreview ? <Suspense fallback={<p className="state" role="status">Đang tải giao diện chi tiết sản phẩm…</p>}><StorefrontProductUiFirst storeName={storeBrandName} /></Suspense> : <>
      {showRouteBreadcrumbs && <StorefrontBreadcrumbs items={breadcrumbItems} />}
      {path === '/blog' || path.startsWith('/blog/') ? <BlogPage query={props.blogPostQuery} />
      : path === '/stores' ? <StoreLocationsPage />
      : path === '/faq' ? <FaqPage customer={customer} contactFormEnabled={storefrontConfiguration?.contact_form_enabled !== false} />
      : path === '/sitemap' ? <Suspense fallback={<p className="state" role="status">Đang tải sơ đồ website…</p>}><SitemapPage /></Suspense>
      : path === '/style-guide' ? <Suspense fallback={<p className="state" role="status">Đang tải gợi ý phối đồ…</p>}><StyleGuidePage collections={storefrontCollections} loading={collectionsLoading} error={collectionsError} onRetry={() => void refetchCollections()} /></Suspense>
      : path.startsWith('/shared-wishlist/') ? <SharedWishlistPage token={path.split('/').filter(Boolean).at(-1) ?? ''} />
      : path === '/membership' ? <MembershipProgramPage query={props.membershipProgramQuery} />
      : path === '/gift-cards' ? <Suspense fallback={<p className="state" role="status">Đang tải trang thẻ quà tặng…</p>}><GiftCardPage storeName={storeBrandName} /></Suspense>
      : path === '/refer-a-friend' ? <Suspense fallback={<p className="state" role="status">Đang tải chương trình giới thiệu…</p>}><ReferralProgramPage /></Suspense>
      : path === '/affiliate' ? <Suspense fallback={<p className="state" role="status">Đang tải chương trình cộng tác viên…</p>}><AffiliateProgramPage /></Suspense>
      : path === '/compare' ? <ProductComparePage slugs={productCompare.slugs} onRemove={removeComparedProduct} onClear={clearComparedProducts} formatMoney={money} />
      : isContentPageRoute ? <PublicContentPage query={props.contentPageQuery} isContact={path === '/contact'} configuration={storefrontConfiguration} customer={customer} />
      : path === '/collections' ? <CollectionsIndexPage collections={storefrontCollections} loading={collectionsLoading} error={collectionsError} onRetry={() => void refetchCollections()} />
      : catalog.brandsIndexRoute ? <BrandsIndexPage brands={catalog.queries.catalogFilterOptions?.brands ?? []} loading={!catalog.queries.catalogFilterOptions && !catalog.queries.catalogFilterOptionsError} error={catalog.queries.catalogFilterOptionsError} onRetry={() => void catalog.queries.refetchCatalogFilterOptions()} />
      : isCatalogRoute ? collectionRouteStatus
        ? <CollectionRouteState state={collectionRouteStatus} onRetry={() => void catalog.refetchCollection()} />
        : categoryRouteSlug && missingCategory ? <div className="container subpage not-found-page"><section className="empty"><img className="storefront-state-illustration" src="/illustrations/not-found.svg" alt="" aria-hidden="true" /><p className="eyebrow">404</p><h1>Không tìm thấy danh mục</h1><p>Danh mục có thể đã ngừng hoạt động hoặc đường dẫn không còn tồn tại.</p><Link className="button dark" to="/products">Xem tất cả sản phẩm</Link></section></div>
        : catalog.brandSlug && missingBrand ? <div className="container subpage not-found-page"><section className="empty"><img className="storefront-state-illustration" src="/illustrations/not-found.svg" alt="" aria-hidden="true" /><p className="eyebrow">404</p><h1>Không tìm thấy thương hiệu</h1><p>Thương hiệu có thể không còn sản phẩm đang kinh doanh.</p><Link className="button dark" to="/brands">Xem thương hiệu</Link></section></div>
        : lookbookRoute && activeCollection ? <Suspense fallback={<p className="state" role="status">Đang tải Lookbook…</p>}><LookbookEditorialPage collection={activeCollection} storeName={storeBrandName} products={activeCollection.products ?? products} cartSyncLoading={cartSyncStatus === 'loading'} cartAddBusy={cartAddBusy} onAddToCart={(item, variantId) => addToCartAndOpen(item, variantId, 1)} /></Suspense>
        : <CatalogPage searchRoute={path === '/search'} collectionRoute={Boolean(collectionSlug)} collectionLookbookPins={activeCollection?.lookbook_products ?? []} categoryRoute={Boolean(activeCategorySlug)} lockBrandFilter={Boolean(activeBrand)} brand={activeBrand} routeTitle={activeBrand?.name ?? catalogRouteTitle} saleCampaign={campaignBanner ?? null} collectionName={activeCollection?.name} collectionDescription={activeCollection?.description ?? undefined} collectionImage={activeCollection?.banner} collectionImageAlt={activeCollection?.banner_alt} categoryName={activeCategory?.name} categoryDescription={activeCategory?.description ?? undefined} categoryImage={activeCategory?.image} categoryImageAlt={activeCategory?.image_alt} categoryChildren={activeCategory?.children ?? []} total={productPageMeta?.total} loading={loading} fetching={productsFetching} stale={catalogIsStale} apiUnavailable={apiUnavailable} hasFilters={catalog.urlState.query.size > 0} basePath={catalogBasePath} search={props.search} searchKey={`${path}${routerLocation.search}`} products={products} activeFilterCount={catalog.urlState.activeFilters.length} filterValues={catalog.filterValues} lockedMerchandisingFilters={catalog.lockedMerchandisingFilters} filterOptions={catalog.filterOptions} categoryOptions={catalog.categoryOptions} urlFilterError={catalog.urlFilterError} filterError={catalog.filterError} filterChips={catalog.filterChips} pagination={catalog.pagination} isWishlisted={(productId) => wishlist.products.some((saved) => saved.id === productId)} compareSlugs={productCompare.slugs} compareLimitReached={productCompare.limitReached} onToggleCompare={productCompare.toggle} formatMoney={money} onSearchChange={props.setSearch} onSearchSubmit={searchProducts} onFilterSubmit={filterProducts} onClearFilters={clearCatalogFilters} onRetryProducts={() => void refetchProducts()} onToggleWishlist={(item) => void wishlist.toggle(item)} onAddToCart={(item, variantId) => addToCartAndOpen(item, variantId, 1)} cartAddBusy={cartAddBusy} cartAddError={cartAddError} cartSyncLoading={cartSyncStatus === 'loading'} />
      : isCartRoute ? <><CartPage accessToken={accessToken} customerId={customer?.id ?? null} initialCouponCode={new URLSearchParams(routerLocation.search).get('coupon') ?? ''} cartToken={cartToken} recoveryEmail={cartRecoveryEmail} onRecoveryEmailChange={setCartRecoveryEmail} cart={cart} syncStatus={cartSyncStatus} syncError={cartSyncError} cartExpired={cartExpired} busyItemIds={cartBusyItemIds} total={total} provinces={addressProvinceOptions} provincesLoading={addressProvincesLoading} provincesError={addressProvincesError} provinceCode={props.cartProvinceCode} shippingFee={shippingFee} shippingFeeLoading={shippingFeeLoading} shippingFeeError={shippingFeeError} formatMoney={money} onRetry={retryCart} onProvinceChange={props.setCartProvinceCode} onRetryProvinces={retryAddressLocations} onRetryShippingFee={() => void retryShippingFee()} onChangeQuantity={changeCartQuantity} onChangeVariant={changeCartVariant} onRemoveLine={removeCartLine} onSaveToWishlist={wishlist.save} addBusy={cartAddBusy} onAddRecommended={(item, variantId) => addToCartAndOpen(item, variantId, 1)} /><Suspense fallback={null}><RecentlyViewedProducts accountId={customer?.id ?? null} formatMoney={money} /></Suspense></>
      : path === '/checkout' ? <CheckoutPage storeName={storeBrandName} initialCouponCode={typeof routerLocation.state?.couponCode === 'string' ? routerLocation.state.couponCode : ''} codEnabled={storefrontConfiguration?.payment_cod_enabled} bankTransferEnabled={storefrontConfiguration?.payment_bank_transfer_enabled} configurationLoading={props.storefrontConfigurationLoading} configurationError={props.storefrontConfigurationError} onRetryConfiguration={() => void props.retryStorefrontConfiguration()} addresses={accessToken ? addresses : []} addressError={accessToken ? addressActions.addressError || addressLoadError : ''} provinces={addressProvinceOptions} wards={addressWardOptions} locationsLoading={addressLocationsLoading} locationsError={addressLocationsError} shippingThreshold={shippingFee?.free_shipping_threshold} shippingThresholdLoading={shippingFeeLoading} shippingThresholdError={shippingFeeError} previewBusy={previewBusy} previewError={previewError} onClearPreview={clearCheckoutPreview} onRetryLocations={retryAddressLocations} onRetryShippingThreshold={() => void retryShippingFee()} cartReady={cartSyncStatus === 'ready'} cartError={cartSyncError} cartExpired={cartExpired} cartHasUnavailableItems={cart.some((line) => line.availableQuantity !== undefined && line.quantity > line.availableQuantity)} onRetryCart={retryCart} onProvinceChange={props.setCheckoutProvinceCode} onSubmit={props.checkout.placeOrder} onPreview={props.checkout.previewCheckout} authenticated={Boolean(accessToken && customer)} membershipPointsAvailable={props.membershipQuery.data?.data?.summary.current_points ?? 0} membershipLoading={props.membershipQuery.isPending} membershipError={props.membershipQuery.isError ? props.membershipQuery.error.message : ''} onRetryMembership={() => void props.membershipQuery.refetch()} cart={cart} checkoutBusy={checkoutBusy} quote={checkoutQuote} pickupLocations={props.checkout.pickupLocations} pickupLocationsLoading={props.checkout.pickupLocationsLoading} pickupLocationsError={props.checkout.pickupLocationsError} money={money} />
      : path.startsWith('/checkout/payment/') ? <BankTransferPaymentPage code={slug ?? ''} formatMoney={money} />
      : path.startsWith('/checkout/success/') || path.startsWith('/order-success/') ? <CheckoutSuccessPage code={slug} order={routerLocation.state?.order && typeof routerLocation.state.order === 'object' ? routerLocation.state.order as components['schemas']['StorefrontPlacedOrder'] : undefined} formatMoney={money} showRegistrationPrompt={props.sessionRestored && !customer} />
      : path === '/account' ? <CustomerAccountLayout activeSection="overview" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><AccountDashboardPage orders={customerOrders} ordersLoading={customerOrdersQuery.isPending} ordersError={customerOrdersQuery.isError ? customerOrdersQuery.error.message : ''} onRetryOrders={() => void customerOrdersQuery.refetch()} addresses={addresses} addressesLoading={addressesQuery.isPending} addressesError={addressLoadError} onRetryAddresses={() => void addressesQuery.refetch()} formatMoney={money} membershipSummary={props.membershipQuery.data?.data?.summary} /></CustomerAccountLayout>
      : path === '/account/membership' ? <CustomerAccountLayout activeSection="membership" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><MembershipPage query={props.membershipQuery} page={props.membershipPage} onPageChange={props.setMembershipPage} /></CustomerAccountLayout>
      : path === '/account/vouchers' ? <CustomerAccountLayout activeSection="vouchers" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><VoucherWalletPage enabled={Boolean(accessToken && customer)} formatMoney={money} /></CustomerAccountLayout>
      : path === '/account/notifications' ? <CustomerAccountLayout activeSection="notifications" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><NotificationInboxPage enabled={Boolean(accessToken && customer)} /></CustomerAccountLayout>
      : path === '/account/notifications/preferences' ? <CustomerAccountLayout activeSection="notifications" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><NotificationPreferencesPage enabled={Boolean(accessToken && customer)} /></CustomerAccountLayout>
      : path === '/account/settings' ? <CustomerAccountLayout activeSection="profile" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><AccountSettingsPage accessToken={accessToken} customerId={customer?.id ?? null} onAccountUpdated={(data) => setCustomer((old) => old ? { ...old, ...data } : old)} onDeleted={() => { setCustomer(null); setAccessToken(''); navigate('/login', { replace: true }) }} /></CustomerAccountLayout>
      : path === '/track-order' ? <TrackOrderPage initialCode={new URLSearchParams(routerLocation.search).get('code') ?? ''} formatMoney={money} />
      : path === '/account/addresses' ? <CustomerAccountLayout activeSection="addresses" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><AddressBookPage addresses={addresses} loading={Boolean(accessToken) && addressesQuery.isPending} error={addressActions.addressError || addressLoadError} fieldErrors={addressActions.addressFieldErrors} values={addressActions.addressValues} editing={addressActions.editingAddress} provinceCode={addressActions.addressProvinceCode} provinces={addressProvinceOptions} wards={addressWardOptions} provincesLoading={addressProvincesLoading} provincesError={addressProvincesError} locationsLoading={addressLocationsLoading} locationsError={addressLocationsError} busy={addressActions.addressBusy} busyDefaultAddressId={addressActions.busyDefaultAddressId} busyDeletingAddressId={addressActions.busyDeletingAddressId} pendingAddressDeletion={addressActions.pendingAddressDeletion} onSubmit={addressActions.submitAddress} onClearFieldError={addressActions.clearAddressFieldError} onProvinceChange={addressActions.changeProvince} onRetryLocations={retryAddressLocations} onMakeDefault={(address) => void addressActions.makeAddressDefault(address)} onEdit={addressActions.editAddress} onRemove={addressActions.removeAddress} onConfirmRemove={addressActions.confirmAddressDeletion} onCancelRemove={addressActions.cancelAddressDeletion} onCancelEdit={addressActions.resetDraft} /></CustomerAccountLayout>
      : path === '/account/wishlist' ? <CustomerAccountLayout activeSection="wishlist" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><WishlistPage lists={wishlist.lists} listsLoading={wishlist.listsLoading} listsError={wishlist.listsError} activeListId={wishlist.activeListId} onSelectList={wishlist.selectList} onCreateList={wishlist.createList} onRenameList={wishlist.renameList} onDeleteList={wishlist.deleteList} onShareList={wishlist.shareList} loading={wishlist.loading} error={wishlist.error} products={wishlist.products} formatMoney={money} onRemove={(item) => void wishlist.toggle(item)} priceAlertProductIds={wishlist.priceAlertProductIds} priceAlertsError={wishlist.priceAlertsError} onRetryPriceAlerts={wishlist.retryPriceAlerts} priceAlertBusyProductId={wishlist.priceAlertBusyProductId} restockBusyVariantId={wishlist.restockBusyVariantId} onTogglePriceAlert={(productId) => void wishlist.togglePriceAlert(productId)} onNotifyWhenRestocked={(productId, variantId) => void wishlist.notifyWhenRestocked(productId, variantId)} onAddToCart={(item, variantId, quantity) => void addToCartAndOpen(item, variantId, quantity)} cartReady={cartSyncStatus === 'ready'} cartSyncStatus={cartSyncStatus} cartSyncError={cartSyncError} onRetryCart={retryCart} addingToCart={cartAddBusy} addToCartError={cartAddError} onRetry={wishlist.retry} /></CustomerAccountLayout>
      : path.startsWith('/account/orders/') ? <CustomerAccountLayout activeSection="orders" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><AccountOrderDetailPage key={path} authenticated={Boolean(accessToken)} order={accountOrder} loading={accountOrderQuery.isPending} error={accountOrderQuery.isError ? accountOrderQuery.error.message : ''} reviewBusy={orderActions.reviewBusy} formatMoney={money} onRetry={() => void accountOrderQuery.refetch()} onReorder={reorderOrder} onReviewSubmit={orderActions.submitReview} onChangeRequest={orderActions.cancelCustomerOrder} /></CustomerAccountLayout>
      : path === '/account/orders' ? <CustomerAccountLayout activeSection="orders" customerName={customer?.name ?? "Khách hàng"} customerEmail={customer?.email ?? ""} onLogout={logout}><AccountOrdersListPage authenticated={Boolean(accessToken && customer)} orders={customerOrders} page={customerOrdersMeta} loading={customerOrdersQuery.isPending} error={customerOrdersQuery.isError ? customerOrdersQuery.error.message : ''} formatMoney={money} onRetry={() => void customerOrdersQuery.refetch()} /></CustomerAccountLayout>
        : path.startsWith('/products/') ? <ProductDetailPage accessToken={accessToken} key={product?.id ?? detailSlug} product={product ?? null} codEnabled={storefrontConfiguration?.payment_cod_enabled ?? false} bankTransferEnabled={storefrontConfiguration?.payment_bank_transfer_enabled ?? false} smsStockAlertsEnabled={storefrontConfiguration?.sms_stock_alerts_enabled ?? false} loading={productDetailLoading} error={productDetailError} relatedProducts={relatedProducts} relatedLoading={relatedLoading} relatedError={relatedError} reviews={productReviews} reviewMeta={productReviewsMeta} reviewFilterOptions={productReviewFilterOptions} reviewSort={reviewSort} reviewFilters={reviewFilters} onChangeReviewPage={setReviewPage} onChangeReviewSort={changeReviewSort} onChangeReviewFilters={changeReviewFilters} reviewsLoading={reviewsLoading} reviewsError={reviewsError} wishlisted={wishlist.products.some((saved) => saved.id === product?.id)} compareSelected={productCompare.slugs.includes(product?.slug ?? '')} compareLimitReached={productCompare.limitReached} onToggleCompare={() => product ? productCompare.toggle(product.slug) : false} priceAlertEnabled={wishlist.priceAlertProductIds.includes(product?.id ?? -1)} priceAlertLoading={wishlist.priceAlertsLoading} priceAlertError={wishlist.priceAlertsError} priceAlertBusy={wishlist.priceAlertBusyProductId === product?.id} onRetryPriceAlerts={wishlist.retryPriceAlerts} onTogglePriceAlert={() => { if (product) void wishlist.togglePriceAlert(product.id) }} onNotifyWhenRestocked={(variantId) => { if (product) void wishlist.notifyWhenRestocked(product.id, variantId) }} restockBusyVariantId={wishlist.restockBusyVariantId} cartAddBusy={cartAddBusy} cartAddError={cartAddError} cartSyncLoading={cartSyncStatus === 'loading'} cartReady={cartSyncStatus === 'ready'} accountId={customer?.id ?? null} socialZaloOaId={socialZaloOaId} formatMoney={money} onRetryProduct={() => void refetchProductDetail()} onRetryRelated={() => void refetchRelatedProducts()} onRetryReviews={() => void refetchProductReviews()} onToggleWishlist={() => { if (product) void wishlist.toggle(product) }} onAddToCart={(item, variantId, amount) => addToCartAndOpen(item, variantId, amount)} onBuyNow={async (item, variantId, amount) => { if (await add(item, variantId, amount)) navigate('/checkout') }} />
        : path !== '/' ? <div className="container subpage not-found-page"><StorefrontRecoveryPanel code="404" title="Không tìm thấy trang này" message="Đường dẫn có thể đã thay đổi hoặc không còn tồn tại." /></div> : <><HomePage storeName={storeBrandName} codEnabled={storefrontConfiguration?.payment_cod_enabled ?? false} bankTransferEnabled={storefrontConfiguration?.payment_bank_transfer_enabled ?? false} storeEmail={storefrontConfiguration?.store_email} storePhone={storefrontConfiguration?.store_phone} returnPolicyPage={storefrontPageLinks.find((page) => /doi-tra|return/i.test(page.slug))} contactPage={storefrontPageLinks.find((page) => /contact|lien-he|ho-tro/i.test(page.slug))} homeSections={storefrontConfiguration?.home_sections} instagramPosts={storefrontConfiguration?.instagram_posts} instagramProfileUrl={storefrontConfiguration?.social_instagram} membershipProgram={membershipProgramQuery.data?.data} membershipProgramLoading={membershipProgramQuery.isPending} membershipProgramError={membershipProgramQuery.isError} onRetryMembershipProgram={() => void membershipProgramQuery.refetch()} heroBanners={heroBanners} mobileHeroBanners={mobileHeroBanners} campaignBanner={campaignBanner} lookbookCollection={lookbookCollection} collections={collectionRail} categories={catalog.categoryOptions} bannersLoading={bannersLoading} bannersError={bannersError} categoriesLoading={categoriesLoading} categoriesError={categoriesError} collectionsLoading={collectionsLoading} collectionsError={collectionsError} onRetryBanners={() => void refetchBanners()} onRetryCategories={() => void refetchCategories()} onRetryCollections={() => void refetchCollections()} onAddToCart={(item, variantId) => addToCartAndOpen(item, variantId, 1)} cartSyncLoading={cartSyncStatus === 'loading'} cartAddBusy={cartAddBusy} cartAddError={cartAddError} recentlyViewedContent={<Suspense fallback={null}><RecentlyViewedProducts accountId={customer?.id ?? null} formatMoney={money} /></Suspense>} personalizedContent={<Suspense fallback={null}><PersonalizedProducts accountId={customer?.id ?? null} formatMoney={money} /></Suspense>} /></>}
      </>}
    </main>{!showUiFirstPreview && !checkoutFocusMode && <><StorefrontFooter pages={storefrontPageLinks} storeName={storeBrandName} configuration={storefrontConfiguration} /><BackToTopButton /></>}
  </div>}
  </StorefrontAccountRouteGuard>
}
