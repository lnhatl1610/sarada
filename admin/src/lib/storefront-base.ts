const configuredStorefrontUrl = import.meta.env.VITE_STOREFRONT_URL?.trim()
const isLoopbackHost = (hostname: string) => hostname === 'localhost'
  || hostname.endsWith('.localhost')
  || hostname === '::1'
  || hostname === '[::1]'
  || hostname.startsWith('127.')

const defaultStorefrontUrl = typeof window === 'undefined'
  ? 'http://localhost:5173'
  : `${window.location.protocol}//${isLoopbackHost(window.location.hostname) ? 'localhost' : window.location.hostname}:5173`

export const ADMIN_STOREFRONT_URL = (configuredStorefrontUrl || defaultStorefrontUrl).replace(/\/$/, '')
