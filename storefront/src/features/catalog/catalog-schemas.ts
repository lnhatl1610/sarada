import { z } from 'zod'

const priceFilterSchema = z.string().trim().refine(
  (value) => value === '' || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value))),
  'Nhập số tiền nguyên không âm.',
)

const queryIntegerSchema = z.string().regex(/^\d+$/).refine(
  (value) => Number.isSafeInteger(Number(value)),
)
const queryBooleanSchema = z.enum(['0', '1', 'true', 'false'])

export const catalogFilterSchema = z.object({
  category: z.string().max(160),
  brand: z.string().max(160),
  price_min: priceFilterSchema,
  price_max: priceFilterSchema,
  size: z.string().max(100),
  color: z.string().max(100),
  material: z.string().max(255),
  fit: z.string().max(80),
  in_stock: z.enum(['', '1', '0']),
  rating_min: z.enum(['', '1', '2', '3', '4', '5']),
  discount_min: z.enum(['', '10', '20', '30', '50']),
  new: z.enum(['', '1']),
  best_seller: z.enum(['', '1']),
  sale: z.enum(['', '1']),
  sort: z.enum(['relevance', 'newest', 'price_asc', 'price_desc', 'bestseller', 'rating_desc', 'discount_desc']),
  q: z.string().max(120),
}).superRefine(({ price_min, price_max }, context) => {
  if (price_min && price_max && Number(price_max) < Number(price_min)) {
    context.addIssue({ code: 'custom', message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.', path: ['price_max'] })
  }
})

export type CatalogFilterValues = z.infer<typeof catalogFilterSchema>

/** Validates URL-derived query values before they reach ListStorefrontProductsRequest. */
export const catalogProductQuerySchema = z.object({
  category: z.string().max(160).optional(),
  target_gender: z.enum(['men', 'women', 'unisex', 'kids']).optional(),
  brand: z.string().max(160).optional(),
  collection: z.string().max(160).optional(),
  price_min: queryIntegerSchema.optional(),
  price_max: queryIntegerSchema.optional(),
  size: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  material: z.string().max(255).optional(),
  fit: z.string().max(80).optional(),
  in_stock: queryBooleanSchema.optional(),
  rating_min: z.enum(['1', '2', '3', '4', '5']).optional(),
  discount_min: z.enum(['10', '20', '30', '50']).optional(),
  q: z.string().max(120).optional(),
  sort: z.enum(['relevance', 'newest', 'price_asc', 'price_desc', 'bestseller', 'rating_desc', 'discount_desc']).optional(),
  new: queryBooleanSchema.optional(),
  best_seller: queryBooleanSchema.optional(),
  sale: queryBooleanSchema.optional(),
  page: queryIntegerSchema.refine((value) => Number(value) >= 1).optional(),
  per_page: queryIntegerSchema.refine((value) => Number(value) >= 1 && Number(value) <= 48).optional(),
}).passthrough().superRefine(({ price_min, price_max }, context) => {
  if (price_min && price_max && Number(price_max) < Number(price_min)) {
    context.addIssue({ code: 'custom', message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.', path: ['price_max'] })
  }
})
