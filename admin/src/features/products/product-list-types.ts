export type ProductRow = {
  id: number
  name: string
  slug: string
  sku?: string | null
  price: number
  base_price?: number
  sale_price?: number | null
  compare_at_price?: number | null
  status?: string
  category_id?: number | null
  brand_id?: number | null
  category?: { name: string } | null
  brand?: { name: string } | null
  variants_count?: number
  active_variants_count?: number
  stock_quantity?: number
  available_stock?: number
  sold_count?: number
  rating_avg?: number | string
  rating_count?: number
  is_featured?: boolean
  is_new?: boolean
  created_at?: string
  updated_at?: string
  short_description?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: { url: string; is_primary?: boolean; sort_order?: number }[]
}

export type ProductListMeta = { current_page: number; last_page: number; per_page: number; total: number }
