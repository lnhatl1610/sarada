import { z } from 'zod'

/** Matches ListStorefrontProductsRequest.q. */
export const productSearchQuerySchema = z.string().trim().max(120, 'Từ khóa tìm kiếm không được quá 120 ký tự.')
