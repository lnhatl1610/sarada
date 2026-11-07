import { lazy, Suspense, useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router'
import { LayoutGroup } from 'motion/react'
import { StorefrontRouteContent } from './StorefrontRouteContent'
import { useStorefrontCart } from '../features/cart/useStorefrontCart'
import { useCheckoutActions } from '../features/checkout/useCheckoutActions'
import { useStorefrontAccount } from '../features/account/useStorefrontAccount'
import { useMembership, useMembershipProgram } from '../features/account/membership-api'
import { useStorefrontAppearance } from '../features/appearance/useStorefrontAppearance'
import { useStorefrontCatalog } from '../features/catalog/useStorefrontCatalog'
import { useAddressLocations } from '../features/checkout/useAddressLocations'
import { useHomeContentQueries } from '../features/home/useHomeContentQueries'
import { useStorefrontContentPage } from '../features/content/content-api'
import { useBlogPost } from '../features/content/blog-api'
import { fetchStorefrontConfiguration } from '../features/storefront/storefront-api'
import { useStorefrontSessionEffects } from '../features/auth/useStorefrontSessionEffects'
import { useStorefrontLogin } from '../features/auth/useStorefrontLogin'
import { useStorefrontLogout } from '../features/auth/useStorefrontLogout'
import { StorefrontAnalytics } from '../features/privacy/StorefrontAnalytics'
import { trackStorefrontEvent } from '../features/privacy/cookie-consent'
import type { components } from '../types/api'

type Customer = components['schemas']['StorefrontUser']

const UiFirstHome = lazy(() => import('../features/home/BlazerHome').then((module) => ({ default: module.BlazerHome })))
const UiFirstCatalog = lazy(() => import('../features/catalog/StorefrontCatalogUiFirst').then((module) => ({ default: module.StorefrontCatalogUiFirst })))
const UiFirstProduct = lazy(() => import('../features/catalog/StorefrontProductUiFirst').then((module) => ({ default: module.StorefrontProductUiFirst })))
const UiFirstCart = lazy(() => import('../features/cart/StorefrontCartUiFirst').then((module) => ({ default: module.StorefrontCartUiFirst })))
const UiFirstCheckout = lazy(() => import('../features/checkout/StorefrontCheckoutUiFirst').then((module) => ({ default: module.StorefrontCheckoutUiFirst })))

function AppContent() {
  const { pathname, search } = useLocation()
  const mode = new URLSearchParams(search).get('mode')
  const homePreview = import.meta.env.DEV && pathname === '/' && mode !== 'api'
  const catalogPreview = import.meta.env.DEV && pathname === '/products' && mode === 'ui'
  const productPreview = import.meta.env.DEV && pathname.startsWith('/products/') && mode === 'ui'
  const cartPreview = import.meta.env.DEV && pathname === '/cart' && mode === 'ui'
  const checkoutPreview = import.meta.env.DEV && pathname === '/checkout' && mode === 'ui'

  if (homePreview || catalogPreview || productPreview || cartPreview || checkoutPreview) {
    return <div className="store ui-first-preview" data-theme-mode="light">
      <main className="storefront-main ui-first-main" id="primary-content" aria-label="Nội dung xem trước" tabIndex={-1}>
        <Suspense fallback={<p className="state" role="status">Đang tải giao diện xem trước…</p>}>
          {homePreview ? <UiFirstHome /> : catalogPreview ? <UiFirstCatalog /> : productPreview ? <UiFirstProduct /> : cartPreview ? <UiFirstCart /> : <UiFirstCheckout />}
        </Suspense>
      </main>
    </div>
  }

  return <ConnectedStorefrontContent />
}

function ConnectedStorefrontContent() {
  const routerLocation = useLocation()
  const path = routerLocation.pathname
  const appearance = useStorefrontAppearance()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState<{ routeSearch: string; value: string }>(() => ({
    routeSearch: routerLocation.search,
    value: new URLSearchParams(routerLocation.search).get('q') ?? '',
  }))
  const routeSearchValue = new URLSearchParams(routerLocation.search).get('q') ?? ''
  const search = searchDraft.routeSearch === routerLocation.search ? searchDraft.value : routeSearchValue
  const setSearch: Dispatch<SetStateAction<string>> = useCallback((value) => {
    setSearchDraft((current) => {
      const currentValue = current.routeSearch === routerLocation.search ? current.value : routeSearchValue
      return { routeSearch: routerLocation.search, value: typeof value === 'function' ? value(currentValue) : value }
    })
  }, [routeSearchValue, routerLocation.search])
  const [toast, setToast] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const cart = useStorefrontCart({ accessToken, customerId: customer?.id ?? null, onToast: setToast })
  const checkoutEventTracked = useRef(false)
  const login = useStorefrontLogin({ setAccessToken, setCustomer })
  const { sessionRestored } = useStorefrontSessionEffects({ accessToken, setAccessToken, setCustomer, resetCartMergeAttempt: cart.resetMergeAttempt })
  const [checkoutProvinceCode, setCheckoutProvinceCode] = useState('')
  const [cartProvinceCode, setCartProvinceCode] = useState('')
  const [membershipPage, setMembershipPage] = useState(1)
  const account = useStorefrontAccount({ accessToken, customerId: customer?.id ?? null, path, search: routerLocation.search, onToast: setToast })
  const membershipQuery = useMembership(Boolean(accessToken && customer && (path.startsWith('/account') || path === '/checkout')), membershipPage, customer?.id)
  const membershipProgramQuery = useMembershipProgram(path === '/membership' || path === '/')
  const logout = useStorefrontLogout({ accessToken, setAccessToken, setCustomer, resetCartMergeAttempt: cart.resetMergeAttempt, resetAddressDraft: account.addressActions.resetDraft })
  const checkout = useCheckoutActions({ accessToken, cartToken: cart.cartToken, customerId: customer?.id ?? null, cart: cart.cart, setCart: cart.setCart, onToast: setToast })
  const contentPageQuery = useStorefrontContentPage(path === '/contact' ? 'contact' : path.split('/').filter(Boolean).at(-1) ?? '', path.startsWith('/pages/') || path.startsWith('/policies/') || path === '/contact' || path === '/about' || path === '/careers' || path === '/size-guide')
  const blogPostQuery = useBlogPost(path.startsWith('/blog/') ? path.split('/').filter(Boolean).at(-1) ?? '' : '', path.startsWith('/blog/'))
  const { data: storefrontConfiguration, isLoading: storefrontConfigurationLoading, isError: storefrontConfigurationError, refetch: retryStorefrontConfiguration } = useQuery({
    queryKey: ['storefront', 'configuration'],
    queryFn: ({ signal }) => fetchStorefrontConfiguration(signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const addressProvinceCode = account.isCheckoutRoute
    ? checkoutProvinceCode
    : account.isAddressBookRoute
      ? account.addressActions.addressProvinceCode
      : path === '/cart' ? cartProvinceCode : ''
  const locations = useAddressLocations({
    enabled: account.isCheckoutRoute || account.isAddressBookRoute || path === '/cart',
    provinceCode: addressProvinceCode,
    shippingFeeEnabled: account.isCheckoutRoute || path === '/cart',
    wardsEnabled: account.isCheckoutRoute || account.isAddressBookRoute,
  })
  const home = useHomeContentQueries({ isHomeRoute: path === '/' })
  const catalog = useStorefrontCatalog({ path, searchParams: routerLocation.search, categories: home.categories })

  useEffect(() => {
    if (path !== '/checkout') {
      checkoutEventTracked.current = false
      return
    }
    if (checkoutEventTracked.current || cart.cartSyncStatus !== 'ready') return
    checkoutEventTracked.current = true
    if (!cart.cart.length) return
    const items = cart.cart.map((line) => ({
      item_id: String(line.variantId ?? line.productId ?? line.product.id),
      item_name: line.product.name,
      item_variant: line.variantLabel,
      price: line.product.price,
      quantity: line.quantity,
    }))
    const hasCurrentTotals = cart.cart.every((line) => line.pricedQuantity === line.quantity && line.lineTotal !== undefined)
    trackStorefrontEvent('begin_checkout', {
      currency: 'VND',
      ...(hasCurrentTotals ? { value: cart.cart.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0) } : {}),
      items,
    })
  }, [cart.cart, cart.cartSyncStatus, path])

  return <>
    <StorefrontAnalytics measurementId={storefrontConfiguration?.seo_analytics_id} path={path} routeKey={`${path}${routerLocation.search}`} />
    <LayoutGroup id="storefront-product-media">
    <StorefrontRouteContent
    accessToken={accessToken}
    customer={customer}
    setAccessToken={setAccessToken}
    setCustomer={setCustomer}
    sessionRestored={sessionRestored}
    login={login}
    logout={logout}
    cart={cart}
    checkout={checkout}
    account={account}
    membershipQuery={membershipQuery}
    membershipProgramQuery={membershipProgramQuery}
    membershipPage={membershipPage}
    setMembershipPage={setMembershipPage}
    locations={locations}
    catalog={catalog}
    home={home}
    appearance={appearance}
    contentPageQuery={contentPageQuery}
    blogPostQuery={blogPostQuery}
    storefrontConfiguration={storefrontConfiguration}
    storefrontConfigurationLoading={storefrontConfigurationLoading}
    storefrontConfigurationError={storefrontConfigurationError}
    retryStorefrontConfiguration={retryStorefrontConfiguration}
    search={search}
    setSearch={setSearch}
    mobileMenuOpen={mobileMenuOpen}
    setMobileMenuOpen={setMobileMenuOpen}
    toast={toast}
    checkoutProvinceCode={checkoutProvinceCode}
    setCheckoutProvinceCode={setCheckoutProvinceCode}
    cartProvinceCode={cartProvinceCode}
    setCartProvinceCode={setCartProvinceCode}
    />
    </LayoutGroup>
  </>
}

export default function App() {
  return (
    <Suspense fallback={<main className="container subpage" role="status">Đang tải trang…</main>}>
      <AppContent />
    </Suspense>
  )
}
