import { createBrowserRouter } from 'react-router'
import { RouteError } from './RouteError'
import { storefrontPaths } from './route-paths'
import { StorefrontRouteLoading } from './StorefrontRouteLoading'

const loadStorefrontApp = async () => ({ Component: (await import('../App')).default })

export const router = createBrowserRouter([
  ...storefrontPaths.map((path) => ({
    path,
    lazy: loadStorefrontApp,
    HydrateFallback: StorefrontRouteLoading,
    ErrorBoundary: RouteError,
  })),
  {
    path: '*',
    lazy: loadStorefrontApp,
    HydrateFallback: StorefrontRouteLoading,
    ErrorBoundary: RouteError,
  },
])
