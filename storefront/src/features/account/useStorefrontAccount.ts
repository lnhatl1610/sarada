import { useAddressBookActions } from './useAddressBookActions'
import { useAccountQueries } from './useAccountQueries'
import { useStorefrontWishlist } from './useStorefrontWishlist'
import { useCustomerOrderActions } from '../orders/useCustomerOrderActions'
import type { CustomerOrderStatusFilter } from '../orders/order-api'

type Options = {
  accessToken: string
  customerId: number | null
  path: string
  search: string
  onToast: (message: string) => void
}

/** Composes account queries and actions around the active customer route. */
export function useStorefrontAccount({ accessToken, customerId, path, search, onToast }: Options) {
  const isCheckoutRoute = path === '/checkout'
  const isAddressBookRoute = path === '/account/addresses'
  const orderCode = path.split('/').filter(Boolean).at(-1)
  const searchParams = new URLSearchParams(search)
  const requestedStatus = searchParams.get('status')
  const orderFilters = {
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    status: (['pending', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'].includes(requestedStatus ?? '') ? requestedStatus : 'all') as CustomerOrderStatusFilter,
    q: searchParams.get('q')?.trim() ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  }
  const addressActions = useAddressBookActions({ accessToken, customerId })
  const accountQueries = useAccountQueries({
    accessToken,
    customerId,
    orderCode,
    addressBookRoute: isAddressBookRoute,
    checkoutRoute: isCheckoutRoute,
    ordersRoute: path === '/account/orders',
    orderDetailRoute: path.startsWith('/account/orders/'),
    accountDashboardRoute: path === '/account',
    orderFilters,
  })
  const wishlist = useStorefrontWishlist({
    accessToken,
    customerId,
    returnTo: path + search,
    onToast,
  })
  const orderActions = useCustomerOrderActions({
    accessToken,
    customerId,
    orderSlug: orderCode ?? '',
    returnTo: path,
    onToast,
  })

  return { isCheckoutRoute, isAddressBookRoute, addressActions, accountQueries, wishlist, orderActions }
}
