import { useMutation, useMutationState } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { writeBrowserStorage } from '../../lib/browser-storage'
import { getCart, removeCartItem, updateCartItem, type CartItemResponse, type CartResponse } from './cart-api'
import type { CartLine, CartProduct } from './cart-types'

type CartLineMutationVariables =
  | { action: 'update'; itemId: number; quantity: number; variantId?: number }
  | { action: 'remove'; itemId: number }

type Options<TProduct extends CartProduct> = {
  cartToken: string
  accessToken: string
  syncStatus: 'loading' | 'ready' | 'error'
  mapCartItem: (item: CartItemResponse) => CartLine<TProduct>
  setCart: Dispatch<SetStateAction<CartLine<TProduct>[]>>
  setRecoveryEmail: Dispatch<SetStateAction<string | null>>
  setCartToken: Dispatch<SetStateAction<string>>
  setSyncStatus: Dispatch<SetStateAction<'loading' | 'ready' | 'error'>>
  setSyncError: Dispatch<SetStateAction<string>>
  setCartExpired: Dispatch<SetStateAction<boolean>>
  onToast: (message: string) => void
}

export function useCartLineActions<TProduct extends CartProduct>({
  cartToken,
  accessToken,
  syncStatus,
  mapCartItem,
  setCart,
  setRecoveryEmail,
  setCartToken,
  setSyncStatus,
  setSyncError,
  setCartExpired,
  onToast,
}: Options<TProduct>) {
  const applyServerCart = (data: CartResponse) => {
    if (data.was_expired) setCartExpired(true)
    setCart(data.items.map(mapCartItem))
    setRecoveryEmail(data.recovery_email ?? null)
    setSyncStatus('ready')
    setSyncError('')
  }

  const refreshCartFromServer = async () => {
    try {
      const data = await getCart({ cartToken, accessToken: accessToken || undefined })
      if (data.session_token && data.session_token !== cartToken) {
        setCartToken(data.session_token)
        writeBrowserStorage('fashion-store-cart-token', data.session_token)
      }
      applyServerCart(data)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Không thể đồng bộ giỏ hàng.')
      setSyncStatus('error')
    }
  }

  const lineMutation = useMutation<CartResponse, Error, CartLineMutationVariables>({
    mutationKey: ['cart', 'line-action'],
    mutationFn: (variables) => variables.action === 'update'
      ? updateCartItem({ cartToken, accessToken: accessToken || undefined, itemId: variables.itemId, quantity: variables.quantity, variantId: variables.variantId })
      : removeCartItem({ cartToken, accessToken: accessToken || undefined, itemId: variables.itemId }),
    onSuccess: applyServerCart,
    onError: (error, variables) => {
      onToast(error instanceof Error ? error.message : variables.action === 'update' ? 'Không thể cập nhật số lượng.' : 'Không thể xóa sản phẩm khỏi giỏ.')
      window.setTimeout(() => onToast(''), 3000)
      void refreshCartFromServer()
    },
  })

  const pendingActions = useMutationState({
    filters: { mutationKey: ['cart', 'line-action'], status: 'pending' },
    select: (mutation) => mutation.state.variables as CartLineMutationVariables,
  })
  const busyItemIds = [...new Set(pendingActions.map((action) => action.itemId))]

  const changeQuantity = async (line: CartLine<TProduct>, quantity: number): Promise<boolean> => {
    if (syncStatus !== 'ready' || !line.serverItemId || quantity < 1 || quantity > 20 || busyItemIds.includes(line.serverItemId)) return false
    try {
      await lineMutation.mutateAsync({ action: 'update', itemId: line.serverItemId, quantity })
      return true
    } catch {
      return false
    }
  }

  const changeVariant = async (line: CartLine<TProduct>, variantId: number): Promise<boolean> => {
    if (variantId === line.variantId) return true
    if (syncStatus !== 'ready' || !line.serverItemId || busyItemIds.includes(line.serverItemId)) return false
    const option = line.variantOptions?.find((variant) => variant.id === variantId)
    if (!option || option.availableQuantity < 1) return false
    try {
      await lineMutation.mutateAsync({ action: 'update', itemId: line.serverItemId, quantity: line.quantity, variantId })
      return true
    } catch {
      return false
    }
  }

  const removeLine = async (line: CartLine<TProduct>): Promise<boolean> => {
    if (syncStatus !== 'ready') return false
    if (!line.serverItemId) {
      setCart((items) => items.filter((item) => item !== line))
      return true
    }
    if (busyItemIds.includes(line.serverItemId)) return false
    try {
      await lineMutation.mutateAsync({ action: 'remove', itemId: line.serverItemId })
      return true
    } catch {
      // Error feedback and canonical-cart recovery are handled by the mutation.
      return false
    }
  }

  return { busyItemIds, changeQuantity, changeVariant, removeLine }
}
