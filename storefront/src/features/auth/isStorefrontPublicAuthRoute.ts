export function isStorefrontPublicAuthRoute(path: string): boolean {
  return path === '/login'
    || path === '/forgot-password'
    || path === '/forgot-password/sent'
    || path === '/reset-password/done'
    || path.startsWith('/reset-password/')
    || path === '/register'
    || path === '/pending-approval'
    || path === '/verify-email'
}
