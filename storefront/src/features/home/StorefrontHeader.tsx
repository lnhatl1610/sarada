import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight, Heart, Menu, Pause, Play, UserRound, X } from 'lucide-react'
import { MobileNavigationSheet } from './MobileNavigationSheet'
import { MobileBottomNavigation } from './MobileBottomNavigation'
import { StorefrontBrand } from './StorefrontBrand'
import { CartDrawer } from '../cart/CartDrawer'
import type { CartLine } from '../cart/cart-types'
import type { CatalogProduct } from '../catalog/catalog-api'
import type { StorefrontCategory, StorefrontCollection } from './home-api'
import { StorefrontSearchBox } from '../search/StorefrontSearchBox'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { setStorefrontLocale, useStorefrontLocale } from '../../lib/storefront-locale'

type StorefrontHeaderProps = {
  categories: StorefrontCategory[]
  collections: StorefrontCollection[]
  storeName: string
  codEnabled: boolean
  search: string
  cartCount: number
  wishlistCount: number
  customerName: string | null
  onLogout: () => void
  cart: CartLine[]
  cartSyncStatus: 'loading' | 'ready' | 'error'
  cartSyncError: string
  cartExpired: boolean
  cartBusyItemIds: number[]
  cartTotal: number | null
  freeShippingThreshold?: number | null
  cartAddBusy: boolean
  cartAddError: string
  openCartSignal: number
  formatMoney: (amount: number) => string
  mobileMenuOpen: boolean
  onSearchChange: (value: string) => void
  onSearchSubmit: (value: string) => void
  onOpenMobileMenu: () => void
  onCloseMobileMenu: () => void
  onOpenAppearance: () => void
  onRetryCart: () => void
  onChangeCartQuantity: (line: CartLine, quantity: number) => Promise<boolean>
  onRemoveCartLine: (line: CartLine) => void
  onAddRecommended: (product: CatalogProduct, variantId: number) => Promise<boolean>
}

const flattenCategories = (categories: StorefrontCategory[]): StorefrontCategory[] =>
  categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])

export function StorefrontHeader({
  categories,
  collections,
  storeName,
  codEnabled,
  search,
  cartCount,
  wishlistCount,
  customerName,
  onLogout,
  cart,
  cartSyncStatus,
  cartSyncError,
  cartExpired,
  cartBusyItemIds,
  cartTotal,
  freeShippingThreshold,
  cartAddBusy,
  cartAddError,
  openCartSignal,
  formatMoney,
  mobileMenuOpen,
  onSearchChange,
  onSearchSubmit,
  onOpenMobileMenu,
  onCloseMobileMenu,
  onOpenAppearance,
  onRetryCart,
  onChangeCartQuantity,
  onRemoveCartLine,
  onAddRecommended,
}: StorefrontHeaderProps) {
  const locale = useStorefrontLocale()
  const wishlistPath = customerName ? '/account/wishlist' : '/wishlist'
  const [cartOpen, setCartOpen] = useState(false)
  const lastOpenCartSignal = useRef(openCartSignal)
  const [announcementVisible, setAnnouncementVisible] = useState(() => readBrowserStorage('fashion-store-announcement-dismissed') !== '1')
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [announcementPaused, setAnnouncementPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [headerHidden, setHeaderHidden] = useState(false)
  const headerShellRef = useRef<HTMLDivElement>(null)
  const categoryLinks = flattenCategories(categories)
  const announcements = locale === 'en'
    ? ['DELIVERY ACROSS VIETNAM', 'SHIPPING FEES CALCULATED AT CHECKOUT', ...(codEnabled ? ['CASH ON DELIVERY AVAILABLE'] : [])]
    : ['GIAO HÀNG TOÀN QUỐC', 'PHÍ GIAO HÀNG TÍNH THEO ĐỊA CHỈ', ...(codEnabled ? ['THANH TOÁN KHI NHẬN HÀNG'] : [])]
  const announcementCount = announcements.length
  const visibleAnnouncementIndex = announcementIndex % announcements.length
  const featuredCategoryImages = categories.filter((category) => category.image).slice(0, 2)

  const closeDesktopCategoryMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }
  const closeAccountMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }
  const renderCategoryBranch = (category: StorefrontCategory): ReactNode => {
    const children = (category.children ?? []).filter((child) => child.slug !== 'hang-moi')
    return <div className="desktop-category-branch" key={category.id}>
      <Link to={`/categories/${encodeURIComponent(category.slug)}`} onClick={closeDesktopCategoryMenu}>{category.name}</Link>
      {children.length > 0 && <div className="desktop-category-children">{children.map(renderCategoryBranch)}</div>}
    </div>
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (lastOpenCartSignal.current !== openCartSignal) {
      lastOpenCartSignal.current = openCartSignal
      setCartOpen(true)
    }
  }, [openCartSignal])

  useEffect(() => {
    let previousY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      if (headerShellRef.current?.contains(document.activeElement) || currentY < 80 || currentY < previousY - 4) setHeaderHidden(false)
      else if (currentY > previousY + 4) setHeaderHidden(true)
      previousY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!announcementVisible || announcementPaused || announcementCount < 2) return
    const timer = window.setInterval(() => setAnnouncementIndex((current) => (current + 1) % announcementCount), 18000)
    return () => window.clearInterval(timer)
  }, [announcementCount, announcementPaused, announcementVisible])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (event: MediaQueryListEvent) => {
      if (event.matches) setAnnouncementPaused(true)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return <>
    <a className="skip-link" href="#primary-content">{locale === 'en' ? 'Skip to content' : 'Bỏ qua điều hướng'}</a>
    <div ref={headerShellRef} className={`storefront-header-shell${headerHidden ? ' is-hidden' : ''}`}>
      {announcementVisible && <div className="topline" role="region" aria-label={locale === 'en' ? 'Shipping and payment information' : 'Thông tin giao hàng và thanh toán'} aria-live={announcementPaused ? 'polite' : 'off'}>
        <div className={`announcement-marquee${announcementPaused ? ' is-paused' : ''}`}>
          <span key={visibleAnnouncementIndex}>{announcements[visibleAnnouncementIndex]}</span>
          <span aria-hidden="true">{announcements[visibleAnnouncementIndex]}</span>
        </div>
        <div className="topline-controls" role="group" aria-label="Điều khiển thông báo">
          <button type="button" aria-label="Thông báo trước" title="Thông báo trước" onClick={() => setAnnouncementIndex((current) => (current - 1 + announcements.length) % announcements.length)}><ChevronLeft aria-hidden="true" size={14} /></button>
          <button type="button" aria-label={announcementPaused ? 'Tiếp tục tự xoay thông báo' : 'Tạm dừng tự xoay thông báo'} aria-pressed={announcementPaused} title={announcementPaused ? 'Tiếp tục tự xoay thông báo' : 'Tạm dừng tự xoay thông báo'} onClick={() => setAnnouncementPaused((paused) => !paused)}>{announcementPaused ? <Play aria-hidden="true" size={12} /> : <Pause aria-hidden="true" size={12} />}</button>
          <button type="button" aria-label="Thông báo tiếp theo" title="Thông báo tiếp theo" onClick={() => setAnnouncementIndex((current) => (current + 1) % announcements.length)}><ChevronRight aria-hidden="true" size={14} /></button>
          <button type="button" aria-label="Ẩn thông báo giao hàng" title="Ẩn thông báo" onClick={() => { setAnnouncementVisible(false); writeBrowserStorage('fashion-store-announcement-dismissed', '1') }}><X aria-hidden="true" size={13} /></button>
        </div>
      </div>}
      <header>
        <StorefrontBrand name={storeName} />
        <nav aria-label={locale === 'en' ? 'Main navigation' : 'Điều hướng chính'}>
          <Link to="/products">{locale === 'en' ? 'Shop' : 'Sản phẩm'}</Link>
          <Link to="/new-arrivals">{locale === 'en' ? 'New arrivals' : 'Hàng mới'}</Link>
          <Link to="/sale">{locale === 'en' ? 'Sale' : 'Ưu đãi'}</Link>
          <details className="desktop-category-menu" onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.removeAttribute('open')
              event.currentTarget.querySelector('summary')?.focus()
            }
          }}>
            <summary>{locale === 'en' ? 'Categories' : 'Danh mục'}</summary>
            <div className="desktop-category-panel">
              <div className="desktop-category-groups">
                {categories.filter((category) => category.slug !== 'hang-moi').map((category) => <section key={category.id}>
                  {renderCategoryBranch(category)}
                </section>)}
                <section aria-label="Khám phá thêm"><Link to="/brands" onClick={closeDesktopCategoryMenu}>Thương hiệu</Link><Link to="/best-sellers" onClick={closeDesktopCategoryMenu}>Bán chạy</Link><Link to="/collections" onClick={closeDesktopCategoryMenu}>Tất cả bộ sưu tập</Link>{collections.length > 0 && <><span>Bộ sưu tập</span>{collections.map((collection) => <Link key={collection.id} to={`/collections/${encodeURIComponent(collection.slug)}`} onClick={closeDesktopCategoryMenu}>{collection.name}</Link>)}</>}</section>
              </div>
              {featuredCategoryImages.length > 0 && <div className="desktop-category-featured" aria-label="Danh mục nổi bật">
                {featuredCategoryImages.map((category) => <Link key={category.id} to={`/categories/${encodeURIComponent(category.slug)}`} onClick={closeDesktopCategoryMenu}>
                  <ResponsiveImage src={category.image} alt="" width={360} height={450} loading="lazy" sizes="160px" />
                  <span>{category.name}</span>
                </Link>)}
              </div>}
            </div>
          </details>
          {categoryLinks.filter((category) => !category.children?.length && category.slug !== 'hang-moi').slice(0, 4).map((category) => <Link key={category.id} to={`/categories/${encodeURIComponent(category.slug)}`}>{category.name}</Link>)}
          {collections.slice(0, 2).map((collection) => <Link key={collection.id} to={`/collections/${collection.slug}`}>{collection.name}</Link>)}
        </nav>
        <button className="mobile-nav-trigger" type="button" aria-label={locale === 'en' ? 'Open categories' : 'Mở danh mục'} aria-controls="storefront-mobile-menu" aria-expanded={mobileMenuOpen} onClick={onOpenMobileMenu}><Menu aria-hidden="true" size={16} /><span>{locale === 'en' ? 'Categories' : 'Danh mục'}</span></button>
        <div className="tools">
          <StorefrontSearchBox value={search} categories={categoryLinks} collections={collections} onChange={onSearchChange} onSubmit={onSearchSubmit} />
          <div className="storefront-locale-switch" role="group" aria-label="Language">
            <button type="button" aria-pressed={locale === 'en'} onClick={() => setStorefrontLocale('en')}>EN</button>
            <span aria-hidden="true">/</span>
            <button type="button" aria-pressed={locale === 'vi'} onClick={() => setStorefrontLocale('vi')}>VI</button>
          </div>
          <button className="appearance-trigger" type="button" onClick={onOpenAppearance} aria-haspopup="dialog">◐ {locale === 'en' ? 'Appearance' : 'Giao diện'}</button>
          <Link className="storefront-wishlist-trigger" to={wishlistPath} aria-label={locale === 'en' ? `Wishlist, ${wishlistCount} items` : `Yêu thích, ${wishlistCount} sản phẩm`}><Heart aria-hidden="true" size={17} /><span>{locale === 'en' ? 'Wishlist' : 'Yêu thích'}</span><b>{wishlistCount > 99 ? '99+' : wishlistCount}</b></Link>
          <details className="storefront-account-menu" onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.removeAttribute('open')
              event.currentTarget.querySelector('summary')?.focus()
            }
          }}>
            <summary aria-label={customerName ? `${locale === 'en' ? 'Account' : 'Tài khoản'} ${customerName}` : locale === 'en' ? 'Sign in or create an account' : 'Mở đăng nhập hoặc đăng ký'}><UserRound aria-hidden="true" size={16} /><span>{customerName ?? (locale === 'en' ? 'Account' : 'Tài khoản')}</span></summary>
            <div className="storefront-account-panel">
              {customerName ? <>
                <p>{locale === 'en' ? 'Hello, ' : 'Xin chào, '}<strong>{customerName}</strong></p>
                <Link to="/account/orders" onClick={closeAccountMenu}>{locale === 'en' ? 'Orders' : 'Đơn hàng'}</Link>
                <Link to={wishlistPath} onClick={closeAccountMenu}>{locale === 'en' ? 'Wishlist' : 'Yêu thích'}</Link>
                <Link to="/account/settings" onClick={closeAccountMenu}>{locale === 'en' ? 'Profile' : 'Hồ sơ'}</Link>
                <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onLogout() }}>{locale === 'en' ? 'Sign out' : 'Đăng xuất'}</button>
              </> : <>
                <p>{locale === 'en' ? 'Sign in to track orders; favourites stay on this device until you sign in.' : 'Bạn có thể lưu sản phẩm yêu thích trên thiết bị này; đăng nhập để đồng bộ với tài khoản.'}</p>
                <Link to={wishlistPath} onClick={closeAccountMenu}>{locale === 'en' ? 'View wishlist' : 'Xem sản phẩm yêu thích'}</Link>
                <Link to="/login" onClick={closeAccountMenu}>{locale === 'en' ? 'Sign in' : 'Đăng nhập'}</Link>
                <Link to="/register" onClick={closeAccountMenu}>{locale === 'en' ? 'Create account' : 'Tạo tài khoản'}</Link>
              </>}
            </div>
          </details>
          <button className="storefront-cart-trigger" type="button" aria-haspopup="dialog" aria-expanded={cartOpen} aria-label={locale === 'en' ? `Bag ${String(cartCount).padStart(2, '0')}, ${cartCount} items` : `Túi ${String(cartCount).padStart(2, '0')}, ${cartCount} sản phẩm`} onClick={() => setCartOpen(true)}>{locale === 'en' ? 'Bag' : 'Túi'} <b>{String(cartCount).padStart(2, '0')}</b></button>
        </div>
      </header>
    </div>
    <MobileNavigationSheet open={mobileMenuOpen} categories={categories} collections={collections} storeName={storeName} onClose={onCloseMobileMenu} />
    <CartDrawer open={cartOpen} cart={cart} syncStatus={cartSyncStatus} syncError={cartSyncError} cartExpired={cartExpired} busyItemIds={cartBusyItemIds} total={cartTotal} freeShippingThreshold={freeShippingThreshold} addBusy={cartAddBusy} addError={cartAddError} formatMoney={formatMoney} onClose={() => setCartOpen(false)} onRetry={onRetryCart} onChangeQuantity={onChangeCartQuantity} onRemoveLine={onRemoveCartLine} onAddRecommended={onAddRecommended} />
    <MobileBottomNavigation categoriesOpen={mobileMenuOpen} onOpenCategories={onOpenMobileMenu} wishlistPath={wishlistPath} />
  </>
}
