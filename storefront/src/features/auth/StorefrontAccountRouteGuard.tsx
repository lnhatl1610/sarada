import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

type StorefrontAccountRouteGuardProps = {
  path: string
  search: string
  hash: string
  sessionRestored: boolean
  accessToken: string
  children: ReactNode
}

/** Keeps private account routes behind the restored refresh-cookie session. */
export function StorefrontAccountRouteGuard({
  path,
  search,
  hash,
  sessionRestored,
  accessToken,
  children,
}: StorefrontAccountRouteGuardProps) {
  if (path !== '/account' && !path.startsWith('/account/')) return children
  if (!sessionRestored) return <main className="container subpage auth-page" role="status">Đang khôi phục phiên đăng nhập…</main>
  if (!accessToken) return <Navigate to={`/login?returnTo=${encodeURIComponent(path + search + hash)}`} replace />
  return children
}
