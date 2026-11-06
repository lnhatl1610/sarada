import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ActiveFilter = { id: string; label: string; onRemove: () => void }
type FilterBarProps = { children: ReactNode; onClear?: () => void; hasFilters?: boolean; label?: string; activeFilters?: ActiveFilter[] }

export function FilterBar({ children, onClear, hasFilters = false, label, activeFilters = [] }: FilterBarProps) {
  const { t } = useTranslation()
  return <div className="shared-filter-bar" role="group" aria-label={label ?? t('Bộ lọc')}>
    <div className="shared-filter-controls">{children}{activeFilters.length > 0 && <div className="shared-filter-chips" aria-label={t('Bộ lọc đang áp dụng')}>{activeFilters.map((filter) => <span className="shared-filter-chip" key={filter.id}>{filter.label}<button type="button" aria-label={t('Bỏ lọc {{filter}}', { filter: filter.label })} onClick={filter.onRemove}>×</button></span>)}</div>}</div>
    {hasFilters && onClear && <button type="button" className="shared-filter-clear" onClick={onClear}>{t('Xóa bộ lọc')}</button>}
  </div>
}
