import type { components } from '../../types/api'

export type ProductVariantOption = NonNullable<components['schemas']['Product']['variants']>[number]
export type ProductColorOption = { name: string; hex: string | null }

export function getProductColorOptions(variants: readonly ProductVariantOption[]): ProductColorOption[] {
  const colors = new Map<string, ProductColorOption>()
  for (const variant of variants) {
    if (variant.color && !colors.has(variant.color)) {
      colors.set(variant.color, { name: variant.color, hex: variant.color_hex })
    }
  }

  return [...colors.values()]
}

export function getVariantsForColor(variants: readonly ProductVariantOption[], selectedColor: string): ProductVariantOption[] {
  const hasColorOptions = variants.some((variant) => Boolean(variant.color))
  if (!hasColorOptions) return [...variants]
  if (!selectedColor) return []

  return variants.filter((variant) => variant.color === selectedColor)
}

export function findProductVariant(variants: readonly ProductVariantOption[], selectedVariantId: number | null): ProductVariantOption | undefined {
  return variants.find((variant) => variant.id === selectedVariantId)
}
