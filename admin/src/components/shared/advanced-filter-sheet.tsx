import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'

type FilterValues = Record<string, string>
type Props = {
  filters: FilterValues
  defaults: FilterValues
  activeCount: number
  onApply: (values: FilterValues) => void
  children: (draft: FilterValues, setValue: (key: string, value: string) => void) => ReactNode
}

export function AdvancedFilterSheet({ filters, defaults, activeCount, onApply, children }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterValues>(filters)
  const openSheet = () => { setDraft({ ...filters }); setOpen(true) }
  const setValue = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button type="button" className="secondary shared-advanced-filter-trigger" onClick={openSheet}>{t('Bộ lọc nâng cao')}{activeCount > 0 ? ` (${activeCount})` : ''}</button></SheetTrigger>
    <SheetContent side="right" className="shared-advanced-filter-sheet">
      <SheetHeader><SheetTitle>{t('Bộ lọc nâng cao')}</SheetTitle><SheetDescription>{t('Chỉnh bộ lọc rồi áp dụng để tải lại danh sách.')}</SheetDescription></SheetHeader>
      <div className="shared-advanced-filter-fields">{children(draft, setValue)}</div>
      <SheetFooter className="shared-advanced-filter-footer">
        <button type="button" className="secondary" onClick={() => setDraft({ ...defaults })}>{t('Đặt lại')}</button>
        <button type="button" className="primary" onClick={() => { onApply({ ...draft }); setOpen(false) }}>{t('Áp dụng')}</button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
}
