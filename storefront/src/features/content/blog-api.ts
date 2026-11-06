import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'

export type BlogPostCard = { id: number; title: string; slug: string; category_name: string; category_slug: string; excerpt: string; cover_image: string | null; cover_alt: string | null; published_at: string | null }
export type BlogProduct = { id: number; name: string; slug: string; short_description?: string | null; images?: { url: string; alt?: string | null }[]; variants?: { price: number; compare_at_price?: number | null }[] }
export type BlogPost = BlogPostCard & { content: string; meta_title: string | null; meta_description: string | null; products: BlogProduct[]; related_posts: BlogPostCard[] }
type BlogListResponse = { data: BlogPostCard[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; categories: { category_name: string; category_slug: string }[] }

export class BlogRequestError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
    this.name = 'BlogRequestError'
  }
}

async function fetchBlogList(category: string, page: number, signal: AbortSignal): Promise<BlogListResponse> {
  try {
    const response = await api.get<BlogListResponse>('/blog/posts', { params: { ...(category ? { category } : {}), page, per_page: 12 }, signal })
    return response.data
  } catch (error) {
    if (isAxiosError(error)) throw new BlogRequestError(error.message || 'request-failed', error.response?.status)
    throw error
  }
}

async function fetchBlogPost(slug: string, signal: AbortSignal): Promise<BlogPost> {
  try {
    const response = await api.get<{ data?: BlogPost }>(`/blog/posts/${encodeURIComponent(slug)}`, { signal })
    if (!response.data.data) throw new BlogRequestError('not-found', 404)
    return response.data.data
  } catch (error) {
    if (error instanceof BlogRequestError) throw error
    if (isAxiosError(error)) throw new BlogRequestError(error.message || 'request-failed', error.response?.status)
    throw error
  }
}

export function useBlogList(category: string, page: number) {
  return useQuery({ queryKey: ['blog', 'list', category, page], queryFn: ({ signal }) => fetchBlogList(category, page, signal), retry: (count, error) => !(error instanceof BlogRequestError && error.status === 404) && count < 2 })
}

export function useBlogPost(slug: string, enabled: boolean) {
  return useQuery({ queryKey: ['blog', 'detail', slug], queryFn: ({ signal }) => fetchBlogPost(slug, signal), enabled: enabled && Boolean(slug), retry: (count, error) => !(error instanceof BlogRequestError && error.status === 404) && count < 2 })
}
