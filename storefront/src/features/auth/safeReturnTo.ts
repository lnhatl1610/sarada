const AUTH_ENTRY_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/pending-approval']

export function resolveSafeStorefrontReturnTo(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback

  try {
    const destination = new URL(value, window.location.origin)
    if (destination.origin !== window.location.origin) return fallback
    if (AUTH_ENTRY_PATHS.some((path) => destination.pathname === path || destination.pathname.startsWith(`${path}/`))) return fallback
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return fallback
  }
}
