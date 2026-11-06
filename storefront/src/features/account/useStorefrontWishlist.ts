import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import { createWishlistList, deleteWishlistList, getProductPriceAlertIds, getWishlist, getWishlistListProducts, getWishlistLists, renameWishlistList, setProductPriceAlert, setWishlistListSharing, subscribeAccountStockAlert, updateWishlist, updateWishlistListProduct, type WishlistProduct } from './account-api'

type Options = {
  accessToken: string
  customerId: number | null
  returnTo: string
  onToast: (message: string) => void
}

export function useStorefrontWishlist({ accessToken, customerId, returnTo, onToast }: Options) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const priceAlertQueryKey = ['account', 'product-price-alerts', customerId ?? 'current'] as const
  const priceAlertQuery = useQuery({
    queryKey: priceAlertQueryKey,
    queryFn: () => getProductPriceAlertIds({ accessToken }),
    enabled: Boolean(accessToken),
  })
  const [priceAlertBusyProductId, setPriceAlertBusyProductId] = useState<number | null>(null)
  const [restockBusyVariantId, setRestockBusyVariantId] = useState<number | null>(null)

  const toggle = async (item: WishlistProduct) => {
    if (!accessToken) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
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
    products: accessToken ? query.data ?? [] : [],
    loading: Boolean(accessToken) && query.isPending,
    error: query.isError ? query.error.message : '',
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
    retry: () => void query.refetch(),
  }
}
