import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type StatCardProps = {
  label: string
  value: ReactNode
  description: ReactNode
  loading?: boolean
  sparklineTone?: 'warm' | 'darkline' | 'redline'
}

export function StatCard({ label, value, description, loading = false, sparklineTone }: StatCardProps) {
  const { t } = useTranslation()
  return <article className="shared-stat-card" aria-busy={loading}>
    <div><span>{label}</span><i aria-hidden="true">↗</i></div>
    <strong>{loading ? <span className="shared-stat-skeleton" role="status"><span className="sr-only">{t('Đang tải')}</span></span> : value}</strong>
    <small>{description}</small>
    <div className={`sparkline${sparklineTone ? ` ${sparklineTone}` : ''}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
    </div>
  </article>
}
