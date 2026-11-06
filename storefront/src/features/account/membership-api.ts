import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type MembershipEnvelope = components['schemas']['StorefrontMembershipEnvelope']
export type MembershipData = NonNullable<MembershipEnvelope['data']>
export type MembershipSummaryData = MembershipData['summary']
export type MembershipProgramEnvelope = components['schemas']['StorefrontMembershipProgramEnvelope']
export type MembershipProgramData = NonNullable<MembershipProgramEnvelope['data']>

async function fetchMembership(page: number, signal: AbortSignal): Promise<MembershipEnvelope> {
  const response = await api.get<MembershipEnvelope>('/account/membership', { params: { page, per_page: 20 }, signal })
  return response.data
}

export function useMembership(enabled: boolean, page = 1, customerId?: number) {
  return useQuery({
    queryKey: ['account', 'membership', customerId ?? 'guest', page],
    queryFn: ({ signal }) => fetchMembership(page, signal),
    enabled,
    staleTime: 60_000,
  })
}

export function useMembershipProgram(enabled: boolean) {
  return useQuery({
    queryKey: ['membership', 'tiers'],
    queryFn: async ({ signal }) => {
      const response = await api.get<MembershipProgramEnvelope>('/membership/tiers', { signal })
      return response.data
    },
    enabled,
    staleTime: 5 * 60_000,
  })
}
