import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { fetchCatalogProduct } from '../catalog/catalog-api'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { createWishlistList, deleteWishlistList, getProductPriceAlertIds, getWishlist, getWishlistListProducts, getWishlistLists, renameWishlistList, setProductPriceAlert, setWishlistListSharing, subscribeAccountStockAlert, updateWishlist, updateWishlistListProduct, type WishlistProduct } from './account-api'

type GuestWishlistRef = { productId: number; slug: string }
const GUEST_WISHLIST_KEY = 'sarada.guest-wishlist.v1'
const MAX_GUEST_WISHLIST_ITEMS = 24

function readGuestWishlist(): GuestWishlistRef[] {
  try {
    const stored = JSON.parse(readBrowserStorage(GUEST_WISHLIST_KEY) ?? '[]') as unknown
    if (!Array.isArray(stored)) return []
    return stored.flatMap((entry): GuestWishlistRef[] => {
      if (!entry || typeof entry !== 'object') return []
      const item = entry as Record<string, unknown>
      return Number.isInteger(item.productId) && Number(item.productId) > 0 && typeof item.slug === 'string' && /^[a-z0-9-]{1,180}$/.test(item.slug)
        ? [{ productId: Number(item.productId), slug: item.slug }]
        : []
    }).slice(0, MAX_GUEST_WISHLIST_ITEMS)
  } catch {
    return []
  }
}

type Options = {
  accessToken: string
  customerId: number | null
  returnTo: string
  onToast: (message: string) => void
}

export function useStorefrontWishlist({ accessToken, customerId, returnTo, onToast }: Options) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [guestWishlist, setGuestWishlist] = useState(readGuestWishlist)
  const guestMergeAttempt = useRef('')
  const persistGuestWishlist = (next: GuestWishlistRef[]) => {
    setGuestWishlist(next)
    writeBrowserStorage(GUEST_WISHLIST_KEY, JSON.stringify(next))
  }
  const listsQueryKey = ['account', 'wishlist-lists', customerId ?? 'current'] as const
  const listsQuery = useQuery({
    queryKey: listsQueryKey,
    queryFn: () => getWishlistLists({ accessToken }),
    enabled: Boolean(accessToken),
  })
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const defaultList = listsQuery.data?.find((list) => list.is_default) ?? listsQuery.data?.[0]
  const activeListId = selectedListId ?? defaultList?.id ?? null
  const queryKey = ['account', 'wishlist', customerId ?? 'current', activeListId ?? 'default'] as const
  const query = useQuery({
    queryKey,
    queryFn: () => activeListId ? getWishlistListProducts({ accessToken, listId: activeListId }) : getWishlist({ accessToken }),
    enabled: Boolean(accessToken),
  })
  const guestProductsQuery = useQuery({
    queryKey: ['guest-wishlist-products', guestWishlist.map((item) => item.slug)],
    enabled: !accessToken && guestWishlist.length > 0,
    queryFn: async ({ signal }) => {
      const results = await Promise.allSettled(guestWishlist.map((item) => fetchCatalogProduct(item.slug, signal)))
      return {
        products: results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []),
        unavailableCount: results.filter((result) => result.status === 'rejected').length,
      }
    },
  })
  const priceAlertQueryKey = ['account', 'product-price-alerts', customerId ?? 'current'] as const
  const priceAlertQuery = useQuery({
    queryKey: priceAlertQueryKey,
    queryFn: () => getProductPriceAlertIds({ accessToken }),
    enabled: Boolean(accessToken),
  })
  const [priceAlertBusyProductId, setPriceAlertBusyProductId] = useState<number | null>(null)
  const [restockBusyVariantId, setRestockBusyVariantId] = useState<number | null>(null)

  useEffect(() => {
    if (!accessToken || !customerId || !defaultList?.id || !guestWishlist.length) return
    const attemptKey = `${customerId}:${guestWishlist.map((item) => item.productId).join(',')}`
    if (guestMergeAttempt.current === attemptKey) return
    guestMergeAttempt.current = attemptKey
    void (async () => {
      try {
        const current = await getWishlistListProducts({ accessToken, listId: defaultList.id })
        const savedIds = new Set(current.map((product) => product.id))
        const pending: GuestWishlistRef[] = []
        let added = 0
        for (const item of guestWishlist) {
          if (savedIds.has(item.productId)) continue
          try {
            await updateWishlistListProduct({ accessToken, listId: defaultList.id, productId: item.productId, saved: false })
            savedIds.add(item.productId)
            added += 1
          } catch {
            pending.push(item)
          }
        }
        persistGuestWishlist(pending)
        void queryClient.invalidateQueries({ queryKey: ['account', 'wishlist-lists', customerId] })
        void queryClient.invalidateQueries({ queryKey: ['account', 'wishlist', customerId] })
        guestMergeAttempt.current = pending.length
          ? `${customerId}:${pending.map((item) => item.productId).join(',')}`
          : attemptKey
        if (added || pending.length) {
          onToast(pending.length
            ? `Đã đồng bộ ${added} sản phẩm; ${pending.length} sản phẩm chưa đồng bộ và vẫn được giữ trên thiết bị.`
            : `Đã đồng bộ ${added} sản phẩm yêu thích vào tài khoản.`)
          window.setTimeout(() => onToast(''), 3500)
        }
      } catch {
        guestMergeAttempt.current = ''
        onToast('Chưa đồng bộ được danh sách yêu thích. Danh sách trên thiết bị vẫn được giữ lại.')
        window.setTimeout(() => onToast(''), 3500)
      }
    })()
  }, [accessToken, customerId, defaultList?.id, guestWishlist, onToast, queryClient])

  const toggle = async (item: WishlistProduct) => {
    if (!accessToken) {
      const saved = guestWishlist.some((product) => product.productId === item.id)
      if (!saved && guestWishlist.length >= MAX_GUEST_WISHLIST_ITEMS) {
        onToast(`Danh sách lưu trên thiết bị có thể chứa tối đa ${MAX_GUEST_WISHLIST_ITEMS} sản phẩm.`)
        window.setTimeout(() => onToast(''), 3000)
        return
      }
      const next = saved
        ? guestWishlist.filter((product) => product.productId !== item.id)
        : [{ productId: item.id, slug: item.slug }, ...guestWishlist].slice(0, MAX_GUEST_WISHLIST_ITEMS)
      persistGuestWishlist(next)
      onToast(saved ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã lưu trên thiết bị này')
      window.setTimeout(() => onToast(''), 2200)
      return
    }

    try {
      const current = queryClient.getQueryData<WishlistProduct[]>(queryKey)
        ?? await queryClient.fetchQuery<WishlistProduct[]>({ queryKey, queryFn: () => activeListId ? getWishlistListProducts({ accessToken, listId: activeListId }) : getWishlist({ accessToken }) })
      const saved = current.some((product) => product.id === item.id)
      if (activeListId) await updateWishlistListProduct({ accessToken, listId: activeListId, productId: item.id, saved })
      else await updateWishlist({ accessToken, productId: item.id, saved })
      queryClient.setQueryData<WishlistProduct[]>(queryKey, saved
        ? current.filter((product) => product.id !== item.id)
        : [...current, item])
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
      onToast(saved ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích')
      window.setTimeout(() => onToast(''), 2200)
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật danh sách yêu thích.')
      window.setTimeout(() => onToast(''), 3000)
    }
  }

  const save = async (productId: number): Promise<boolean> => {
    if (!accessToken) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return false
    }

    try {
      const current = queryClient.getQueryData<WishlistProduct[]>(queryKey)
        ?? await queryClient.fetchQuery<WishlistProduct[]>({ queryKey, queryFn: () => activeListId ? getWishlistListProducts({ accessToken, listId: activeListId }) : getWishlist({ accessToken }) })
      if (current.some((product) => product.id === productId)) return true
      if (activeListId) await updateWishlistListProduct({ accessToken, listId: activeListId, productId, saved: false })
      else await updateWishlist({ accessToken, productId, saved: false })
      await queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
      onToast('Đã thêm vào danh sách yêu thích')
      window.setTimeout(() => onToast(''), 2200)
      return true
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật danh sách yêu thích.')
      window.setTimeout(() => onToast(''), 3000)
      return false
    }
  }

  const togglePriceAlert = async (productId: number): Promise<void> => {
    if (!accessToken) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }

    const activeIds = queryClient.getQueryData<number[]>(priceAlertQueryKey) ?? []
    const enabled = !activeIds.includes(productId)
    setPriceAlertBusyProductId(productId)
    try {
      await setProductPriceAlert({ accessToken, productId, enabled })
      queryClient.setQueryData<number[]>(priceAlertQueryKey, enabled
        ? [...activeIds, productId]
        : activeIds.filter((id) => id !== productId))
      onToast(enabled ? 'Đã bật thông báo giảm giá qua email' : 'Đã tắt thông báo giảm giá')
      window.setTimeout(() => onToast(''), 2200)
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật thông báo giảm giá.')
      window.setTimeout(() => onToast(''), 3000)
    } finally {
      setPriceAlertBusyProductId(null)
    }
  }

  const notifyWhenRestocked = async (productId: number, variantId: number): Promise<void> => {
    if (!accessToken) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }

    setRestockBusyVariantId(variantId)
    try {
      await subscribeAccountStockAlert({ accessToken, productId, variantId })
      onToast('Đã đăng ký. Cửa hàng sẽ gửi email khi sản phẩm có hàng trở lại.')
      window.setTimeout(() => onToast(''), 3000)
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể đăng ký báo khi có hàng.')
      window.setTimeout(() => onToast(''), 3000)
    } finally {
      setRestockBusyVariantId(null)
    }
  }

  const createList = async (name: string): Promise<void> => {
    const list = await createWishlistList({ accessToken, name })
    await queryClient.invalidateQueries({ queryKey: listsQueryKey })
    setSelectedListId(list.id)
  }

  const renameList = async (name: string): Promise<void> => {
    if (!activeListId) return
    await renameWishlistList({ accessToken, listId: activeListId, name })
    await queryClient.invalidateQueries({ queryKey: listsQueryKey })
  }

  const deleteList = async (): Promise<void> => {
    if (!activeListId) return
    await deleteWishlistList({ accessToken, listId: activeListId })
    setSelectedListId(null)
    await queryClient.invalidateQueries({ queryKey: listsQueryKey })
    await queryClient.invalidateQueries({ queryKey: ['account', 'wishlist', customerId ?? 'current'] })
  }

  const shareList = async (shareable: boolean) => {
    if (!activeListId) return null
    const list = await setWishlistListSharing({ accessToken, listId: activeListId, shareable })
    await queryClient.invalidateQueries({ queryKey: listsQueryKey })
    return list.share_token ? `${window.location.origin}/shared-wishlist/${list.share_token}` : null
  }

  return {
    products: accessToken ? query.data ?? [] : guestProductsQuery.data?.products ?? [],
    count: accessToken ? query.data?.length ?? 0 : guestWishlist.length,
    loading: accessToken ? query.isPending : guestWishlist.length > 0 && guestProductsQuery.isPending,
    error: accessToken ? query.isError ? query.error.message : '' : guestProductsQuery.isError ? guestProductsQuery.error.message : '',
    guestMode: !accessToken,
    guestUnavailableCount: accessToken ? 0 : guestProductsQuery.data?.unavailableCount ?? 0,
    priceAlertProductIds: accessToken ? priceAlertQuery.data ?? [] : [],
    priceAlertsLoading: Boolean(accessToken) && priceAlertQuery.isPending,
    priceAlertsError: priceAlertQuery.isError ? priceAlertQuery.error.message : '',
    retryPriceAlerts: () => void priceAlertQuery.refetch(),
    priceAlertBusyProductId,
    restockBusyVariantId,
    toggle,
    save,
    lists: listsQuery.data ?? [],
    listsLoading: Boolean(accessToken) && listsQuery.isPending,
    listsError: listsQuery.isError ? listsQuery.error.message : '',
    activeListId,
    selectList: setSelectedListId,
    createList,
    renameList,
    deleteList,
    shareList,
    togglePriceAlert,
    notifyWhenRestocked,
    retry: () => void (accessToken ? query.refetch() : guestProductsQuery.refetch()),
  }
}
