import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type EmptyStateProps = { title: string; description?: string; action?: ReactNode }
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section className="shared-ui-state"><span className="shared-ui-state-icon" aria-hidden="true">◇</span><h2>{title}</h2>{description && <p>{description}</p>}{action}</section>
}

type ErrorStateProps = { title?: string; message: string; onRetry?: () => void }
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return <section className="shared-ui-state shared-ui-error" role="alert"><h2>{title ?? t('Không thể tải dữ liệu')}</h2><p>{message}</p>{onRetry && <button type="button" className="secondary" onClick={onRetry}>{t('Thử lại')}</button>}</section>
}

export function Skeleton({ rows = 4, label }: { rows?: number; label?: string }) {
  const { t } = useTranslation()
  return <div className="shared-skeleton" aria-label={label ?? t('Đang tải nội dung')} aria-busy="true">{Array.from({ length: rows }, (_, index) => <span key={index} />)}</div>
}
