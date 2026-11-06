type DateValue = Date | string | number | null | undefined

function parseDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function rootSetting(key: string): string | undefined {
  return typeof document === 'undefined' ? undefined : document.documentElement.dataset[key]
}

function timezone(): string | undefined {
  const value = rootSetting('adminTimezone')
  if (!value) return undefined
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return value
  } catch {
    return undefined
  }
}

function dateParts(date: Date): Record<string, string> {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone(),
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: rootSetting('adminTimeFormat') === '12h' ? 'h12' : 'h23',
  }).formatToParts(date).map((part) => [part.type, part.value]))
}

function relativeDate(date: Date, includeTime: boolean): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absolute = Math.abs(seconds)
  const [unit, amount] = absolute < 60 ? ['second', Math.round(seconds)]
    : absolute < 3600 ? ['minute', Math.round(seconds / 60)]
      : absolute < 86400 ? ['hour', Math.round(seconds / 3600)]
        : ['day', Math.round(seconds / 86400)]
  const locale = rootSetting('adminLocale') || 'vi'
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(amount, unit as Intl.RelativeTimeFormatUnit)
  if (!includeTime || absolute < 86400) return relative
  return `${relative} · ${formatClock(date)}`
}

function formatClock(date: Date): string {
  const parts = dateParts(date)
  const time = `${parts.hour}:${parts.minute}`
  if (rootSetting('adminTimeFormat') !== '12h') return time
  const locale = rootSetting('adminLocale') === 'en' ? 'en-US' : 'vi-VN'
  const period = new Intl.DateTimeFormat(locale, { timeZone: timezone(), hour: 'numeric', hour12: true }).formatToParts(date).find((part) => part.type === 'dayPeriod')?.value
  return period ? `${time} ${period}` : time
}

function formatCalendarDate(date: Date): string {
  const parts = dateParts(date)
  return rootSetting('adminDateFormat') === 'ymd'
    ? `${parts.year}-${parts.month}-${parts.day}`
    : `${parts.day}/${parts.month}/${parts.year}`
}

export function formatDateTime(value: DateValue): string {
  const date = parseDate(value)
  if (!date) return '—'
  if (rootSetting('adminDateFormat') === 'relative') return relativeDate(date, true)
  return `${formatCalendarDate(date)} ${formatClock(date)}`
}

export function formatDate(value: DateValue): string {
  const date = parseDate(value)
  if (!date) return '—'
  if (rootSetting('adminDateFormat') === 'relative') return relativeDate(date, false)
  return formatCalendarDate(date)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(rootSetting('adminNumberLocale') || 'vi-VN').format(value)
}

export function formatVnd(value: number): string {
  const number = formatNumber(value)
  return rootSetting('adminCurrencyPosition') === 'prefix' ? `₫${number}` : `${number} ₫`
}
