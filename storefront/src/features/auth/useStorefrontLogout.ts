import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { Dispatch, SetStateAction } from 'react'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

type Options = {
  accessToken: string
  setAccessToken: Dispatch<SetStateAction<string>>
  setCustomer: Dispatch<SetStateAction<components['schemas']['StorefrontUser'] | null>>
  resetCartMergeAttempt: () => void
  resetAddressDraft: () => void
}

export function useStorefrontLogout({ accessToken, setAccessToken, setCustomer, resetCartMergeAttempt, resetAddressDraft }: Options) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) return
      await api.post<components['schemas']['MessageEnvelope']>('/auth/logout', undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined)
    },
    onSuccess: () => {
    resetCartMergeAttempt()
    queryClient.removeQueries({ queryKey: ['cart'] })
    queryClient.removeQueries({ queryKey: ['account', 'addresses'] })
    queryClient.removeQueries({ queryKey: ['account', 'wishlist'] })
    queryClient.removeQueries({ queryKey: ['account', 'orders'] })
    queryClient.removeQueries({ queryKey: ['account', 'settings'] })
    setAccessToken('')
    setCustomer(null)
    resetAddressDraft()
    navigate('/')
    },
  })

  return () => {
    if (!logoutMutation.isPending) logoutMutation.mutate()
  }
}
