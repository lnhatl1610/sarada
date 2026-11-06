import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readBrowserStorage, removeBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { getCart, mergeGuestCart, type CartItemResponse } from './cart-api'
import type { CartLine, CartProduct } from './cart-types'

type CartSessionSnapshot<TProduct extends CartProduct> = {
  lines: CartLine<TProduct>[]
  sessionToken: string | null
  recoveryEmail: string | null
  wasExpired: boolean
}

type Options<TProduct extends CartProduct> = {
  accessToken: string
  customerId: number | null
  mapCartItem: (item: CartItemResponse) => CartLine<TProduct>
}

export function useCartSession<TProduct extends CartProduct>({ accessToken, customerId, mapCartItem }: Options<TProduct>) {
  const queryClient = useQueryClient()
  const [cartSyncStatusState, setCartSyncStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [cartSyncErrorState, setCartSyncError] = useState('')
  const [cartExpiredState, setCartExpired] = useState(false)
  const [storedCartToken, setStoredCartToken] = useState(() => {
    const saved = readBrowserStorage('fashion-store-cart-token')
    if (saved) return saved
    const generated = crypto.randomUUID()
    writeBrowserStorage('fashion-store-cart-token', generated)
    return generated
  })
  const mergeAttempted = useRef(false)
  const [mergeSucceeded, setMergeSucceeded] = useState(false)
  const cartQueryKey = useMemo(
    () => ['cart', accessToken ? 'customer' : 'guest', accessToken ? customerId ?? 'current' : 'session'] as const,
    [accessToken, customerId],
  )

  useEffect(() => { removeBrowserStorage('fashion-store-cart') }, [])

  const cartQuery = useQuery({
    queryKey: cartQueryKey,
    queryFn: async ({ signal }): Promise<CartSessionSnapshot<TProduct>> => {
      const data = await getCart({ cartToken: storedCartToken, accessToken: accessToken || undefined, signal })
      return {
        lines: data.items.map(mapCartItem),
        sessionToken: data.session_token ?? null,
        recoveryEmail: data.recovery_email ?? null,
        wasExpired: data.was_expired ?? false,
      }
    },
    enabled: !accessToken || mergeSucceeded,
  })

  const cart = cartQuery.data?.lines ?? []
  const cartToken = cartQuery.data?.sessionToken || storedCartToken
  const setCart = useCallback<Dispatch<SetStateAction<CartLine<TProduct>[]>>>((next) => {
    queryClient.setQueryData<CartSessionSnapshot<TProduct>>(cartQueryKey, (current) => {
      const currentLines = current?.lines ?? []
      const lines = typeof next === 'function' ? next(currentLines) : next
      return {
        lines,
        sessionToken: current?.sessionToken ?? cartToken,
        recoveryEmail: current?.recoveryEmail ?? null,
        wasExpired: current?.wasExpired ?? false,
      }
    })
  }, [cartQueryKey, cartToken, queryClient])

  const setRecoveryEmail = useCallback<Dispatch<SetStateAction<string | null>>>((next) => {
    queryClient.setQueryData<CartSessionSnapshot<TProduct>>(cartQueryKey, (current) => current
      ? { ...current, recoveryEmail: typeof next === 'function' ? next(current.recoveryEmail) : next }
      : current)
  }, [cartQueryKey, queryClient])

  const setResolvedCartToken = useCallback<Dispatch<SetStateAction<string>>>((next) => {
    const resolved = typeof next === 'function' ? next(cartToken) : next
    setStoredCartToken(resolved)
    writeBrowserStorage('fashion-store-cart-token', resolved)
    queryClient.setQueryData<CartSessionSnapshot<TProduct>>(cartQueryKey, (current) => current
      ? { ...current, sessionToken: resolved }
      : current)
  }, [cartQueryKey, cartToken, queryClient])

  useEffect(() => {
    const responseToken = cartQuery.data?.sessionToken
    if (responseToken) writeBrowserStorage('fashion-store-cart-token', responseToken)
  }, [cartQuery.data?.sessionToken])

  const mergeMutation = useMutation({
    mutationKey: ['cart', 'merge'],
    mutationFn: ({ token, sessionToken }: { token: string; sessionToken: string }) => mergeGuestCart({ accessToken: token, sessionToken }),
    onSuccess: (data) => {
      queryClient.setQueryData<CartSessionSnapshot<TProduct>>(cartQueryKey, {
        lines: data.items.map(mapCartItem),
        sessionToken: data.session_token ?? null,
        recoveryEmail: data.recovery_email ?? null,
        wasExpired: data.was_expired ?? false,
      })
      if (data.was_expired) setCartExpired(true)
      setCartSyncError('')
      setCartSyncStatus('ready')
      setMergeSucceeded(true)
    },
    onError: (error) => {
      mergeAttempted.current = false
      setCartSyncError(error instanceof Error ? error.message : 'Không thể gộp giỏ hàng sau khi đăng nhập.')
      setCartSyncStatus('error')
    },
  })
  const { mutate: mergeCart, reset: resetMergeMutation, isPending: mergePending, isError: mergeFailed, error: mergeError } = mergeMutation
  const { data: cartData, isFetching: cartFetching, isError: cartFailed, error: cartError, refetch: refetchCart } = cartQuery
  const cartSyncStatus: 'loading' | 'ready' | 'error' = mergePending || (cartFetching && cartSyncStatusState === 'loading')
    ? 'loading'
    : mergeFailed || cartFailed || cartSyncStatusState === 'error'
      ? 'error'
      : cartData
        ? 'ready'
        : cartSyncStatusState
  const cartSyncError = cartFailed
    ? cartError instanceof Error ? cartError.message : 'Không thể đồng bộ giỏ hàng.'
    : mergeFailed
      ? mergeError instanceof Error ? mergeError.message : 'Không thể gộp giỏ hàng sau khi đăng nhập.'
      : cartSyncErrorState
  const cartExpired = cartExpiredState || Boolean(cartQuery.data?.wasExpired)

  useEffect(() => {
    if (!accessToken || !cartToken || mergeAttempted.current) return
    mergeAttempted.current = true
    setCartSyncStatus('loading')
    setCartSyncError('')
    setMergeSucceeded(false)
    mergeCart({ token: accessToken, sessionToken: cartToken })
  }, [accessToken, cartToken, mergeCart])

  const retry = useCallback(() => {
    setCartSyncStatus('loading')
    setCartSyncError('')
    if (accessToken) {
      mergeAttempted.current = true
      setMergeSucceeded(false)
      resetMergeMutation()
      mergeCart({ token: accessToken, sessionToken: cartToken })
      return
    }
    void refetchCart()
  }, [accessToken, cartToken, mergeCart, refetchCart, resetMergeMutation])

  const resetMergeAttempt = useCallback(() => {
    mergeAttempted.current = false
    setMergeSucceeded(false)
    resetMergeMutation()
  }, [resetMergeMutation])

  return {
    cart,
    setCart,
    cartToken,
    recoveryEmail: cartQuery.data?.recoveryEmail ?? null,
    setRecoveryEmail,
    setCartToken: setResolvedCartToken,
    cartSyncStatus,
    setCartSyncStatus,
    cartSyncError,
    cartExpired,
    setCartExpired,
    setCartSyncError,
    resetMergeAttempt,
    retry,
  }
}
