export type CartProduct = { id: number; name: string; slug: string; price: number }
export type CartVariantOption = {
  id: number
  sku: string | null
  size: string | null
  color: string | null
  unitPrice: number
  availableQuantity: number
}

export type CartLine<TProduct extends CartProduct = CartProduct> = {
  product: TProduct
  variantId: number | null
  quantity: number
  serverItemId?: number
  productId?: number | null
  availableQuantity?: number
  lineTotal?: number
  pricedQuantity?: number
  variantLabel?: string
  variantOptions?: CartVariantOption[]
  image?: string | null
  imageAlt?: string | null
}
