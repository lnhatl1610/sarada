export const ADMIN_TOAST_EVENT = 'admin:toast'

export type AdminToastTone = 'success' | 'error'
export type AdminToastNotice = { message: string; tone: AdminToastTone }

export function publishAdminToast(notice: AdminToastNotice) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AdminToastNotice>(ADMIN_TOAST_EVENT, { detail: notice }))
  }
}
