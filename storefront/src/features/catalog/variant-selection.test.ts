import { describe, expect, it } from 'vitest'
import type { ProductVariantOption } from './variant-selection'
import { findProductVariant, getProductColorOptions, getVariantsForColor } from './variant-selection'

const variants = [
  { id: 1, sku: 'AO-NAU-S', price: 390_000, compare_at_price: null, color: 'Nâu', color_hex: '#795b49', color_value_id: 4, size: 'S', available_quantity: 4 },
  { id: 2, sku: 'AO-NAU-M', price: 390_000, compare_at_price: null, color: 'Nâu', color_hex: '#795b49', color_value_id: 4, size: 'M', available_quantity: 0 },
  { id: 3, sku: 'AO-DEN-S', price: 390_000, compare_at_price: null, color: 'Đen', color_hex: '#292a27', color_value_id: 6, size: 'S', available_quantity: 2 },
] as ProductVariantOption[]

describe('product variant selection', () => {
  it('offers unique colors in catalog order', () => {
    expect(getProductColorOptions(variants)).toEqual([
      { name: 'Nâu', hex: '#795b49' },
      { name: 'Đen', hex: '#292a27' },
    ])
  })

  it('shows only sizes for the selected color and keeps out-of-stock variants identifiable', () => {
    expect(getVariantsForColor(variants, '')).toEqual([])
    expect(getVariantsForColor(variants, 'Nâu').map(({ size, available_quantity }) => [size, available_quantity]))
      .toEqual([['S', 4], ['M', 0]])
    expect(getVariantsForColor(variants, 'Đen').map(({ size }) => size)).toEqual(['S'])
  })

  it('resolves the selected variant by ID', () => {
    expect(findProductVariant(variants, 2)).toBe(variants[1])
    expect(findProductVariant(variants, null)).toBeUndefined()
  })
})
