import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { CatalogFilterValues } from './catalog-schemas'
import { useCatalogUrlState } from './useCatalogUrlState'

const filters: CatalogFilterValues = {
  category: '',
  brand: '',
  price_min: '',
  price_max: '',
  size: '',
  color: '',
  material: '',
  fit: '',
  in_stock: '',
  rating_min: '',
  discount_min: '',
  new: '',
  best_seller: '',
  sale: '',
  sort: 'relevance',
  q: '',
}

function UrlStateHarness({ categoryBaseSlug }: { categoryBaseSlug?: string }) {
  const location = useLocation()
  const urlState = useCatalogUrlState('/products', false, categoryBaseSlug)

  return (
    <>
      <output aria-label="current URL">{`${location.pathname}${location.search}`}</output>
      <button type="button" onClick={() => urlState.searchProducts('  linen  ')}>Search</button>
      <button type="button" onClick={() => urlState.applyFilters({ ...filters, category: 'ao', color: 'nau' })}>Apply category</button>
      <button type="button" onClick={() => urlState.removeFilter('brand')}>Remove brand</button>
    </>
  )
}

function renderUrlState(initialEntry: string, categoryBaseSlug?: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes><Route path="*" element={<UrlStateHarness categoryBaseSlug={categoryBaseSlug} />} /></Routes>
    </MemoryRouter>,
  )
}

describe('useCatalogUrlState', () => {
  it('trims searches and resets the current page', () => {
    renderUrlState('/products?q=old&page=3&brand=net')
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(screen.getByLabelText('current URL')).toHaveTextContent('/products?q=linen')
  })

  it('moves category filters into the category route and resets stale URL filters', () => {
    renderUrlState('/categories/hang-moi?page=4&brand=net', 'hang-moi')
    fireEvent.click(screen.getByRole('button', { name: 'Apply category' }))

    expect(screen.getByLabelText('current URL')).toHaveTextContent('/categories/ao?color=nau')
  })

  it('removes a filter and its page parameter while preserving the other query values', () => {
    renderUrlState('/products?q=linen&page=3&brand=net')
    fireEvent.click(screen.getByRole('button', { name: 'Remove brand' }))

    expect(screen.getByLabelText('current URL')).toHaveTextContent('/products?q=linen')
  })
})
