export function mediaUrl(apiUrl: string, value?: string | null): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value

  const origin = apiUrl.replace(/\/api\/v1\/?$/, '')
  return `${origin}/${value.replace(/^\/+/, '')}`
}
