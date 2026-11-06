import { useQuery } from '@tanstack/react-query'
import {
  fetchStorefrontBanners,
  fetchStorefrontCategories,
  fetchStorefrontCollections,
  fetchStorefrontPageLinks,
} from './home-api'

export function useHomeContentQueries({ isHomeRoute }: { isHomeRoute: boolean }) {
  const bannersQuery = useQuery({
    queryKey: ['banners', 'storefront'],
    queryFn: ({ signal }) => fetchStorefrontBanners(signal),
    enabled: isHomeRoute,
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'storefront'],
    queryFn: ({ signal }) => fetchStorefrontCategories(signal),
    staleTime: 5 * 60 * 1000,
  })
  const collectionsQuery = useQuery({
    queryKey: ['collections', 'storefront'],
    queryFn: ({ signal }) => fetchStorefrontCollections(signal),
  })
  const pageLinksQuery = useQuery({
    queryKey: ['pages', 'storefront-links'],
    queryFn: ({ signal }) => fetchStorefrontPageLinks(signal),
    staleTime: 5 * 60 * 1000,
  })

  return {
    banners: bannersQuery.data ?? [],
    bannersLoading: bannersQuery.isLoading,
    bannersError: bannersQuery.isError,
    refetchBanners: bannersQuery.refetch,
    categories: categoriesQuery.data ?? [],
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.isError,
    refetchCategories: categoriesQuery.refetch,
    collections: collectionsQuery.data ?? [],
    collectionsLoading: collectionsQuery.isLoading,
    collectionsError: collectionsQuery.isError,
    refetchCollections: collectionsQuery.refetch,
    pageLinks: pageLinksQuery.data ?? [],
  }
}
