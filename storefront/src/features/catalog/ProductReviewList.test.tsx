import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { components } from '../../types/api'
import type { ProductDetailProduct } from './ProductDetailPage'
import { ProductReviewList } from './ProductReviewList'

const product: ProductDetailProduct = {
  id: 12,
  name: 'Áo sơ mi linen dáng rộng',
  slug: 'ao-so-mi-linen',
  short_description: null,
  meta_title: null,
  meta_description: null,
  price: 529000,
  sale_starts_at: null,
  sale_ends_at: null,
  compare_at_price: null,
  rating: { average: 5, count: 1 },
  sold_count: 1,
  featured: false,
  is_new: false,
}

const review: components['schemas']['StorefrontReview'] = {
  id: 31,
  product_id: product.id,
  order_item_id: 44,
  rating: 5,
  title: 'Ảnh sản phẩm sau khi nhận hàng',
  content: 'Ảnh tải lên kèm đánh giá đã được cửa hàng duyệt.',
  fit: 'true_to_size',
  status: 'approved',
  moderation_reason: null,
  store_response: null,
  helpful_count: 0,
  verified_purchase: true,
  image_count: 1,
  created_at: '2026-10-20T08:00:00Z',
  customer: { name: 'Khách hàng' },
  images: [{
    id: 57,
    url: 'https://media.example.test/reviews/31/item-photo.webp',
    media_type: 'image',
    alt: 'Áo sơ mi màu Natural được khách hàng chụp trên mặt phẳng.',
  }],
}

describe('ProductReviewList', () => {
  it('renders review image URLs with API-provided alt text and a safe full-size link', () => {
    render(<ProductReviewList product={product} reviews={[review]} loading={false} error={false} onRetry={() => {}} />)

    const image = screen.getByRole('img', { name: 'Áo sơ mi màu Natural được khách hàng chụp trên mặt phẳng.' })
    expect(image).toHaveAttribute('src', review.images?.[0]?.url)
    expect(image).toHaveAttribute('loading', 'lazy')

    const link = image.closest('a')
    expect(link).toHaveAttribute('href', review.images?.[0]?.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('labels an AI image used only as a review demo fixture', () => {
    const demoReview: components['schemas']['StorefrontReview'] = {
      ...review,
      id: 32,
      images: [{
        id: 58,
        url: 'http://localhost/storage/reviews/demo-ai-review-photo.webp',
        media_type: 'image',
        alt: 'Ảnh AI demo: ảnh minh họa cho dữ liệu đánh giá thử nghiệm, không phải ảnh khách hàng gửi.',
      }],
    }

    render(<ProductReviewList product={product} reviews={[demoReview]} loading={false} error={false} onRetry={() => {}} />)

    expect(screen.getByText('Ảnh dựng', { exact: true })).toBeVisible()
  })
})
