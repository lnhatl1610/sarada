import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import './Minimal.css'
import { publishAdminToast } from './lib/admin-toast.ts'
import { installAdminConsoleHistory } from './lib/admin-console-history.ts'
import './lib/i18n'

installAdminConsoleHistory()

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.toast === false) return
      // Feature callbacks often render a page-local success message. Avoid showing a duplicate shell toast.
      if (mutation.options.onSuccess) return
      const message = typeof mutation.meta?.toastSuccessMessage === 'string' ? mutation.meta.toastSuccessMessage : 'Thao tác đã hoàn tất.'
      publishAdminToast({ message, tone: 'success' })
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.toast === false) return
      // Forms with onError callbacks keep server validation next to the affected fields.
      if (mutation.options.onError) return
      const status = error && typeof error === 'object' ? (error as { status?: unknown }).status : undefined
      if (status === 422) return
      const message = typeof mutation.meta?.toastErrorMessage === 'string'
        ? mutation.meta.toastErrorMessage
        : error instanceof Error ? error.message : 'Thao tác thất bại.'
      publishAdminToast({ message, tone: 'error' })
    },
  }),
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </StrictMode>,
)
