type Props = {
  current: number
  previous: number
  unit?: 'percent' | 'percentage-points'
  lowerIsBetter?: boolean
}

export function PeriodComparison({ current, previous, unit = 'percent', lowerIsBetter = false }: Props) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', { maximumFractionDigits: 1 })
  if (current === previous) {
    return <span className="dashboard-period-comparison" data-tone="neutral">{t('Không đổi so với kỳ trước')}</span>
  }

  if (unit === 'percentage-points') {
    const difference = current - previous
    const improved = lowerIsBetter ? difference < 0 : difference > 0
    const direction = difference > 0 ? t('Tăng') : t('Giảm')

    return <span className="dashboard-period-comparison" data-tone={improved ? 'positive' : 'negative'}>
      {t('{{direction}} {{value}} điểm % so với kỳ trước', { direction, value: number.format(Math.abs(difference)) })}
    </span>
  }

  if (previous === 0) {
    return <span className="dashboard-period-comparison" data-tone={lowerIsBetter ? 'negative' : 'positive'}>{t('Phát sinh so với kỳ trước')}</span>
  }

  const difference = ((current - previous) / Math.abs(previous)) * 100
  const improved = lowerIsBetter ? difference < 0 : difference > 0
  const direction = difference > 0 ? t('Tăng') : t('Giảm')

  return <span className="dashboard-period-comparison" data-tone={improved ? 'positive' : 'negative'}>
    {t('{{direction}} {{value}}% so với kỳ trước', { direction, value: number.format(Math.abs(difference)) })}
  </span>
}
import { useTranslation } from 'react-i18next'

