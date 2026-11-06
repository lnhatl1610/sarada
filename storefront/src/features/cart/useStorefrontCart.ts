import type { CartItemResponse } from './cart-api'
import type { CartLine } from './cart-types'
import { useAddToCart } from './useAddToCart'
import { useCartLineActions } from './useCartLineActions'
import { useCartSession } from './useCartSession'

const mapCartItem = (item: CartItemResponse): CartLine => ({
  product: { id: item.variant_id, name: item.product.name ?? 'Sản phẩm', slug: item.product.slug ?? '', price: item.unit_price },
  productId: item.product.id,
  variantId: item.variant_id,
  quantity: item.quantity,
  serverItemId: item.id,
  availableQuantity: item.available_quantity,
  lineTotal: item.line_total,
  pricedQuantity: item.quantity,
  variantLabel: [item.product.color, item.product.size].filter(Boolean).join(' · '),
  variantOptions: item.product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    unitPrice: variant.unit_price,
    availableQuantity: variant.available_quantity,
  })),
  image: item.product.image,
  imageAlt: item.product.image_alt,
})

/** Owns the canonical cart state and composes session, line, and add actions. */
export function useStorefrontCart({ accessToken, customerId, onToast }: { accessToken: string; customerId: number | null; onToast: (message: string) => void }) {
  const session = useCartSession({ accessToken, customerId, mapCartItem })
  const lineActions = useCartLineActions({
    cartToken: session.cartToken,
    accessToken,
    syncStatus: session.cartSyncStatus,
    mapCartItem,
    setCart: session.setCart,
    setRecoveryEmail: session.setRecoveryEmail,
    setCartToken: session.setCartToken,
    setSyncStatus: session.setCartSyncStatus,
    setSyncError: session.setCartSyncError,
    setCartExpired: session.setCartExpired,
    onToast,
  })
  const addAction = useAddToCart({
    cartToken: session.cartToken,
    accessToken,
    syncStatus: session.cartSyncStatus,
    mapCartItem,
    setCart: session.setCart,
    setRecoveryEmail: session.setRecoveryEmail,
    setCartToken: session.setCartToken,
    setSyncStatus: session.setCartSyncStatus,
    setSyncError: session.setCartSyncError,
    setCartExpired: session.setCartExpired,
    onToast,
  })

  return {
    cart: session.cart,
    setCart: session.setCart,
    cartToken: session.cartToken,
    recoveryEmail: session.recoveryEmail,
    setRecoveryEmail: session.setRecoveryEmail,
    setCartToken: session.setCartToken,
    cartSyncStatus: session.cartSyncStatus,
    setCartSyncStatus: session.setCartSyncStatus,
    cartSyncError: session.cartSyncError,
    cartExpired: session.cartExpired,
    setCartSyncError: session.setCartSyncError,
    resetMergeAttempt: session.resetMergeAttempt,
    retry: session.retry,
    busyItemIds: lineActions.busyItemIds,
    changeQuantity: lineActions.changeQuantity,
    changeVariant: lineActions.changeVariant,
    removeLine: lineActions.removeLine,
    add: addAction.add,
    addBusy: addAction.busy,
    addError: addAction.error,
  }
}
