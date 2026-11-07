import { toast } from 'sonner'

export type AdminToastTone = 'success' | 'error'
export type AdminToastNotice = { message: string; tone: AdminToastTone }

export function publishAdminToast(notice: AdminToastNotice) {
  if (typeof window === 'undefined') return
  if (notice.tone === 'error') toast.error(notice.message)
  else toast.success(notice.message)
}
