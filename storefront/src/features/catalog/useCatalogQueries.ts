import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCatalogFilterOptions,
  fetchCatalogProduct,
  fetchCatalogProductPage,
  fetchCatalogReviews,
  fetchRelatedCatalogProducts,
  type CatalogReviewFilters,
  type CatalogReviewSort,
} from './catalog-api'

type CatalogQueryOptions = {
  search: string
  enabled: boolean
  productsEnabled?: boolean
  detailSlug?: string
  fallbackSlug?: string
}

/** Owns catalog/product server state while App coordinates route-level presentation. */
export function useCatalogQueries(options: CatalogQueryOptions) {
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewSort, setReviewSort] = useState<CatalogReviewSort>('latest')
  const [reviewFilters, setReviewFilters] = useState<CatalogReviewFilters>({ rating: null, withImages: false, size: null })
  const [reviewSlug, setReviewSlug] = useState(options.detailSlug)
  if (reviewSlug !== options.detailSlug) {
    setReviewSlug(options.detailSlug)
    setReviewPage(1)
    setReviewSort('latest')
    setReviewFilters({ rating: null, withImages: false, size: null })
  }
  const productPageQuery = useQuery({
    queryKey: ['products', 'list', options.search],
    queryFn: ({ signal }) => fetchCatalogProductPage(options.search ? `?${options.search}` : '', signal),
    placeholderData: options.productsEnabled === false ? undefined : (previous) => previous,
    enabled: options.productsEnabled ?? options.enabled,
  })
  const products = productPageQuery.data?.data ?? []

  const productDetailQuery = useQuery({
    queryKey: ['products', 'detail', options.detailSlug],
    queryFn: ({ signal }) => fetchCatalogProduct(options.detailSlug ?? '', signal),
    enabled: Boolean(options.detailSlug),
  })

  const filterOptionsQuery = useQuery({
    queryKey: ['catalog', 'filter-options'],
    queryFn: ({ signal }) => fetchCatalogFilterOptions(signal),
    enabled: options.enabled,
    staleTime: 5 * 60 * 1000,
  })

  const product = productDetailQuery.data ?? products.find((item) => item.slug === options.fallbackSlug)
  const relatedProductsQuery = useQuery({
    queryKey: ['products', 'related', product?.slug],
    queryFn: ({ signal }) => fetchRelatedCatalogProducts(product!.slug, signal),
    enabled: Boolean(product && options.detailSlug),
    retry: 1,
  })
  const productReviewsQuery = useQuery({
    queryKey: ['products', 'reviews', product?.slug, reviewPage, reviewSort, reviewFilters.rating, reviewFilters.withImages, reviewFilters.size],
    queryFn: ({ signal }) => fetchCatalogReviews(product!.slug, reviewPage, reviewSort, reviewFilters, signal),
    enabled: Boolean(product && options.detailSlug),
    retry: 1,
  })

  return {
    productPage: productPageQuery.data,
    products,
    loading: productPageQuery.isLoading,
    productsFetching: productPageQuery.isFetching,
    catalogIsStale: productPageQuery.isPlaceholderData,
    apiUnavailable: productPageQuery.isError,
    refetchProducts: productPageQuery.refetch,
    productDetailLoading: productDetailQuery.isLoading,
    productDetailError: productDetailQuery.isError,
    refetchProductDetail: productDetailQuery.refetch,
    catalogFilterOptions: filterOptionsQuery.data,
    catalogFilterOptionsError: filterOptionsQuery.isError,
    refetchCatalogFilterOptions: filterOptionsQuery.refetch,
    product,
    relatedProducts: relatedProductsQuery.data ?? [],
    relatedLoading: relatedProductsQuery.isLoading,
    relatedError: relatedProductsQuery.isError,
    refetchRelatedProducts: relatedProductsQuery.refetch,
    productReviews: productReviewsQuery.data?.data ?? [],
    productReviewsMeta: productReviewsQuery.data?.meta,
    productReviewFilterOptions: productReviewsQuery.data?.filters,
    setReviewPage,
    reviewSort,
    reviewFilters,
    changeReviewSort: (sort: CatalogReviewSort) => {
      setReviewSort(sort)
      setReviewPage(1)
    },
    changeReviewFilters: (filters: CatalogReviewFilters) => {
      setReviewFilters(filters)
      setReviewPage(1)
    },
    reviewsLoading: productReviewsQuery.isLoading,
    reviewsError: productReviewsQuery.isError,
    refetchProductReviews: productReviewsQuery.refetch,
  }
}
