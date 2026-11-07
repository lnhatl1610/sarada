import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type CareerOpening = components['schemas']['CareerOpening']
export type CareerOpeningList = components['schemas']['CareerOpeningPublicList']

export function useCareerOpenings(department: string, location: string, page: number) {
  return useQuery({
    queryKey: ['storefront', 'career-openings', department, location, page],
    queryFn: async ({ signal }) => (await api.get<CareerOpeningList>('/careers', {
      params: { ...(department ? { department } : {}), ...(location ? { location } : {}), page, per_page: 24 },
      signal,
    })).data,
    staleTime: 60 * 1000,
  })
}
