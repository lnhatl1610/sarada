import { STOREFRONT_API_BASE_URL } from './api-base'

export function mediaUrl(value?: string | null): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value

  const apiOrigin = new URL(STOREFRONT_API_BASE_URL).origin
  return new URL(value.replace(/^\/+/, ''), `${apiOrigin}/`).toString()
}
