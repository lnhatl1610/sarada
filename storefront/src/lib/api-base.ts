const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
const defaultApiBase = typeof window === 'undefined'
  ? 'http://localhost:8000/api/v1'
  : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`

export const STOREFRONT_API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/$/, '')
