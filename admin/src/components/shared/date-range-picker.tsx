import { FormField } from './form-field'
import { useTranslation } from 'react-i18next'

type Preset = 'today' | '7days' | '30days' | 'month' | 'custom'
type Props = {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

function dateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangeFor(preset: Exclude<Preset, 'custom'>, today: Date): [string, string] {
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let from: Date
  if (preset === 'today') from = to
  else if (preset === '7days' || preset === '30days') {
    from = new Date(to)
    from.setDate(from.getDate() - (preset === '7days' ? 6 : 29))
  } else from = new Date(to.getFullYear(), to.getMonth(), 1)
  return [dateInput(from), dateInput(to)]
}

const presets: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày' },
  { id: '30days', label: '30 ngày' },
  { id: 'month', label: 'Tháng này' },
  { id: 'custom', label: 'Tùy chỉnh' },
]

export function DateRangePicker({ from, to, onChange }: Props) {
  const { t } = useTranslation()
  const today = new Date()
  const activePreset = (['today', '7days', '30days', 'month'] as const)
    .find((preset) => {
      const [presetFrom, presetTo] = rangeFor(preset, today)
      return from === presetFrom && to === presetTo
    }) ?? 'custom'

  return <section className="admin-date-range" aria-label={t('Khoảng thời gian báo cáo')}>
    <div className="admin-date-range-presets" role="group" aria-label={t('Chọn khoảng thời gian nhanh')}>
      {presets.map((preset) => <button
        key={preset.id}
        type="button"
        className={activePreset === preset.id ? 'primary' : 'secondary'}
        aria-pressed={activePreset === preset.id}
        onClick={() => {
          if (preset.id === 'custom') return
          onChange(...rangeFor(preset.id, new Date()))
        }}
      >{t(preset.label)}</button>)}
    </div>
    <div className="admin-date-range-fields">
      <FormField id="report-date-from" label={t('Từ ngày')}>
        <input type="date" value={from} max={to || undefined} onChange={(event) => onChange(event.target.value, to)} />
      </FormField>
      <FormField id="report-date-to" label={t('Đến ngày')}>
        <input type="date" value={to} min={from || undefined} onChange={(event) => onChange(from, event.target.value)} />
      </FormField>
    </div>
  </section>
}
