import { useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation } from '@tanstack/react-query'
import { writeBrowserStorage } from '../../lib/browser-storage'
import { api, getApiErrorMessage } from '../../lib/http'
import { trackStorefrontEvent } from '../privacy/cookie-consent'
import type { CartEnvelope, CartItemResponse } from './cart-api'
import type { CartLine, CartProduct } from './cart-types'

type AddableProduct = CartProduct & {
  variants?: { id: number; available_quantity: number }[]
}

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

export function useAddToCart<TProduct extends CartProduct>({
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
  const [error, setError] = useState('')
  const addMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: number; quantity: number }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
      if (cartToken) headers['X-Cart-Token'] = cartToken
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const { data: body } = await api.post<CartEnvelope>(
        '/cart/items',
        { variant_id: variantId, quantity },
        { headers },
      )
      if (!body.data) throw new Error('Không thể thêm sản phẩm vào giỏ.')
      return body.data
    },
    onMutate: () => setError(''),
    onSuccess: (data) => {
      if (data.session_token) {
        setCartToken(data.session_token)
        writeBrowserStorage('fashion-store-cart-token', data.session_token)
      }
      if (data.was_expired) setCartExpired(true)
      setCart(data.items.map(mapCartItem))
      setRecoveryEmail(data.recovery_email ?? null)
      setSyncStatus('ready')
      setSyncError('')
      onToast('Đã thêm sản phẩm vào túi')
      window.setTimeout(() => onToast(''), 2200)
    },
    onError: (requestError) => setError(getApiErrorMessage(requestError, 'Không thể đồng bộ giỏ hàng.')),
  })

  const add = async (item: AddableProduct, variantId: number | null = null, quantity = 1): Promise<boolean> => {
    if (syncStatus === 'loading') return false
    const selectedVariant = variantId ?? item.variants?.find((variant) => variant.available_quantity > 0)?.id ?? null
    if (!selectedVariant) {
      setError('Sản phẩm hiện chưa có biến thể còn hàng để thêm vào giỏ.')
      return false
    }
    try {
      const result = await addMutation.mutateAsync({ variantId: selectedVariant, quantity })
      const addedLine = result.items.find((line) => line.variant_id === selectedVariant)
      if (addedLine) {
        trackStorefrontEvent('add_to_cart', {
          currency: 'VND',
          value: addedLine.unit_price * quantity,
          items: [{
            item_id: String(addedLine.variant_id),
            item_name: addedLine.product.name ?? item.name,
            item_variant: [addedLine.product.color, addedLine.product.size].filter(Boolean).join(' / '),
            price: addedLine.unit_price,
            quantity,
          }],
        })
      }
      return true
    } catch {
      return false
    }
  }

  return { add, busy: addMutation.isPending, error }
}
