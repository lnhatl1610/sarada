import { useQuery } from '@tanstack/react-query'
import { getAddresses } from './account-api'
import { getAccountOrder, getAccountOrders, type CustomerOrderFilters } from '../orders/order-api'

type AccountQueryOptions = {
  accessToken: string
  customerId: number | null
  orderCode?: string
  addressBookRoute: boolean
  checkoutRoute: boolean
  ordersRoute: boolean
  orderDetailRoute: boolean
  accountDashboardRoute: boolean
  orderFilters: CustomerOrderFilters
}

export function useAccountQueries(options: AccountQueryOptions) {
  const addressesQuery = useQuery({
    queryKey: ['account', 'addresses', options.customerId ?? 'current'],
    queryFn: ({ signal }) => getAddresses({ accessToken: options.accessToken, signal }),
    enabled: Boolean(options.accessToken && (options.addressBookRoute || options.checkoutRoute || options.accountDashboardRoute)),
  })
  const customerOrdersQuery = useQuery({
    queryKey: ['account', 'orders', options.customerId ?? 'current', options.orderFilters],
    queryFn: ({ signal }) => getAccountOrders({ accessToken: options.accessToken, signal, filters: options.orderFilters }),
    enabled: Boolean(options.accessToken && (options.ordersRoute || options.accountDashboardRoute)),
  })
  const accountOrderQuery = useQuery({
    queryKey: ['account', 'orders', options.customerId ?? 'current', 'detail', options.orderCode],
    queryFn: ({ signal }) => getAccountOrder({ accessToken: options.accessToken, code: options.orderCode ?? '', signal }),
    enabled: Boolean(options.accessToken && options.orderDetailRoute),
  })

  return {
    addressesQuery,
    addresses: options.accessToken ? addressesQuery.data ?? [] : [],
    addressLoadError: addressesQuery.isError ? addressesQuery.error.message : '',
    customerOrdersQuery,
    customerOrders: options.accessToken ? customerOrdersQuery.data?.orders ?? [] : [],
    customerOrdersMeta: options.accessToken ? customerOrdersQuery.data ?? null : null,
    accountOrderQuery,
    accountOrder: options.accessToken ? accountOrderQuery.data ?? null : null,
  }
}
