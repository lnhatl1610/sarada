import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { CatalogFilterValues } from './catalog-schemas'

const NON_FILTER_PARAMS = new Set(['page', 'per_page', 'collection'])
export function useCatalogUrlState(basePath: string, preserveCurrentQuery: boolean, categoryBaseSlug?: string) {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  if (categoryBaseSlug) query.set('category', categoryBaseSlug)
  const activeFilters = Array.from(query.entries()).filter(([key, value]) => !NON_FILTER_PARAMS.has(key) && !(key === 'category' && value === categoryBaseSlug))

  const searchProducts = useCallback((search: string) => {
    const nextQuery = new URLSearchParams(preserveCurrentQuery ? location.search : '')
    if (search.trim()) nextQuery.set('q', search.trim())
    else nextQuery.delete('q')
    nextQuery.delete('page')
    navigate(`${basePath}${nextQuery.size ? `?${nextQuery.toString()}` : ''}`)
  }, [basePath, location.search, navigate, preserveCurrentQuery])

  const applyFilters = useCallback((values: CatalogFilterValues) => {
    const nextQuery = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => {
      if (value.trim()) nextQuery.set(key, value.trim())
    })
    const currentQuery = new URLSearchParams(location.search)
    const targetGender = currentQuery.get('target_gender')
    if (targetGender && ['men', 'women', 'unisex', 'kids'].includes(targetGender)) nextQuery.set('target_gender', targetGender)
    let nextBasePath = basePath
    if (categoryBaseSlug) {
      const selectedCategory = nextQuery.get('category')
      nextBasePath = selectedCategory ? `/categories/${encodeURIComponent(selectedCategory)}` : '/products'
      nextQuery.delete('category')
    }
    navigate(`${nextBasePath}${nextQuery.size ? `?${nextQuery.toString()}` : ''}`)
    return true
  }, [basePath, categoryBaseSlug, location.search, navigate])

  const removeFilter = useCallback((key: string) => {
    const nextQuery = new URLSearchParams(location.search)
    nextQuery.delete(key)
    nextQuery.delete('page')
    navigate(`${basePath}${nextQuery.size ? `?${nextQuery.toString()}` : ''}`)
  }, [basePath, location.search, navigate])

  const clearFilters = useCallback(() => navigate(basePath), [basePath, navigate])

  const setPage = useCallback((page: number) => {
    const nextQuery = new URLSearchParams(location.search)
    if (page <= 1) nextQuery.delete('page')
    else nextQuery.set('page', String(page))
    navigate(`${basePath}${nextQuery.size ? `?${nextQuery.toString()}` : ''}`)
  }, [basePath, location.search, navigate])

  return { query, activeFilters, searchProducts, applyFilters, removeFilter, clearFilters, setPage }
}
