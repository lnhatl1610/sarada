import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import { formatDate, formatNumber } from '../../lib/date-format'
import { Button } from '../../components/ui/button'
import './PersonalPerformancePage.css'

type MetricKey = 'orders_confirmed' | 'orders_packed' | 'orders_delivered' | 'average_confirmation_minutes' | 'orders_cancelled' | 'inventory_adjustments' | 'reviews_approved' | 'tasks_on_time'
type Metrics = Record<MetricKey, number | null>
type PerformanceData = {
  subject: { id: number; name: string }
  range: 'today' | '7d' | '30d'
  timezone: string
  period_start: string
  period_end: string
  previous_start: string
  previous_end: string
  current: Metrics
  previous: Metrics
  available: { orders: boolean; inventory: boolean; reviews: boolean }
  timeline: Array<{ date: string; label: string; current: number; previous: number; previous_date: string }>
}

const metricLabels: Record<MetricKey, string> = {
  orders_confirmed: 'Đơn đã xác nhận',
  orders_packed: 'Đơn chuyển sang đóng gói',
  orders_delivered: 'Đơn đã giao',
  average_confirmation_minutes: 'Thời gian xác nhận trung bình',
  orders_cancelled: 'Đơn đã hủy',
  inventory_adjustments: 'Lần điều chỉnh kho',
  reviews_approved: 'Đánh giá đã duyệt',
  tasks_on_time: 'Việc hoàn thành đúng hạn',
}

const formatPeriod = (value: string) => formatDate(value)

function MetricCard({ metric, current, previous }: { metric: MetricKey; current: number | null; previous: number | null }) {
  const { t } = useTranslation()
  const isAverage = metric === 'average_confirmation_minutes'
  const formatValue = (value: number | null) => value === null ? '—' : isAverage ? t('{{value}} phút', { value: formatNumber(value) }) : formatNumber(value)
  return <article className="panel personal-performance-card"><p>{t(metricLabels[metric])}</p><strong>{formatValue(current)}</strong><small>{t('Kỳ trước: {{value}}', { value: formatValue(previous) })}</small></article>
}

export function PersonalPerformancePage({ apiUrl, accessToken, userId, targetUserId }: { apiUrl: string; accessToken: string; userId?: number; targetUserId?: number }) {
  const { t } = useTranslation()
  const [range, setRange] = useStateRange()
  const query = useQuery({
    queryKey: ['admin-personal-performance', userId, targetUserId ?? 'self', range],
    enabled: Boolean(accessToken && userId),
    refetchInterval: 60_000,
    queryFn: async (): Promise<PerformanceData> => {
      const path = targetUserId ? `/admin/staff/${targetUserId}/performance` : '/me/performance'
      const response = await adminApiFetch(`${apiUrl}${path}?range=${range}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { data?: PerformanceData; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? t('Không tải được hiệu suất cá nhân.'))
      return body.data
    },
  })

  const metrics = query.data?.available
    ? ([
      ...(query.data.available.orders ? ['orders_confirmed', 'orders_packed', 'orders_delivered', 'average_confirmation_minutes', 'orders_cancelled'] as MetricKey[] : []),
      ...(query.data.available.inventory ? ['inventory_adjustments'] as MetricKey[] : []),
      ...(query.data.available.reviews ? ['reviews_approved'] as MetricKey[] : []),
      'tasks_on_time',
    ] as MetricKey[])
    : []
  const timeline = query.data?.timeline ?? []
  const maximum = Math.max(1, ...timeline.flatMap((item) => [item.current, item.previous]))
  const point = (value: number, index: number) => {
    const x = timeline.length <= 1 ? 350 : 34 + (index / (timeline.length - 1)) * 632
    const y = 178 - (value / maximum) * 152
    return `${x},${y}`
  }
  const currentLine = timeline.map((item, index) => point(item.current, index)).join(' ')
  const previousLine = timeline.map((item, index) => point(item.previous, index)).join(' ')

  return <section className="personal-performance-page">
    <header className="page-heading"><div><p className="eyebrow">{t(targetUserId ? 'HIỆU SUẤT NHÂN VIÊN' : 'KHÔNG GIAN CÁ NHÂN')}</p><h1>{targetUserId ? t('Hiệu suất của {{name}}', { name: query.data?.subject.name ?? t('nhân viên #{{id}}', { id: targetUserId }) }) : t('Hiệu suất của tôi')}</h1><p>{t(targetUserId ? 'Số thao tác nhân viên thực hiện theo quyền xem hiệu suất của bạn.' : 'Số thao tác do bạn thực hiện trên đơn hàng, kho, đánh giá và việc cá nhân.')}</p>{targetUserId && <a href="/staff">{t('Quay lại danh sách nhân viên')}</a>}</div><label className="personal-performance-range">{t('Khoảng thời gian')}<select aria-label={t('Khoảng thời gian hiệu suất')} value={range} onChange={(event) => setRange(event.target.value as typeof range)}><option value="today">{t('Hôm nay')}</option><option value="7d">{t('7 ngày')}</option><option value="30d">{t('30 ngày')}</option></select></label></header>
    {query.isPending && <div className="panel" role="status">{t('Đang tải số liệu hiệu suất…')}</div>}
    {query.isError && <div className="panel personal-performance-error" role="alert"><p>{t(query.error.message)}</p><Button variant="outline" onClick={() => void query.refetch()}>{t('Thử lại')}</Button></div>}
    {query.data && <>
      <p className="personal-performance-period">{t('Kỳ hiện tại: {{start}} – {{end}}', { start: formatPeriod(query.data.period_start), end: formatPeriod(query.data.period_end) })} · {t('Kỳ trước: {{start}} – {{end}}', { start: formatPeriod(query.data.previous_start), end: formatPeriod(query.data.previous_end) })} · {query.data.timezone}</p>
      <div className="personal-performance-grid">{metrics.map((metric) => <MetricCard key={metric} metric={metric} current={query.data!.current[metric]} previous={query.data!.previous[metric]} />)}</div>
      <section className="panel personal-performance-chart"><div className="panel-heading"><div><h2>{t('Hoạt động theo ngày')}</h2><p>{t('So sánh tổng thao tác với cùng số ngày của kỳ trước.')}</p></div><small>{t('{{total}} thao tác trong kỳ', { total: formatNumber(timeline.reduce((sum, item) => sum + item.current, 0)) })}</small></div>
        {timeline.every((item) => item.current === 0 && item.previous === 0) ? <div className="personal-performance-empty"><strong>{t('Chưa có hoạt động trong khoảng này')}</strong><p>{t('Khi bạn xử lý đơn, điều chỉnh kho, duyệt đánh giá hoặc hoàn thành việc, số liệu sẽ xuất hiện tại đây.')}</p></div> : <>
          <svg className="personal-performance-svg" viewBox="0 0 700 220" role="img" aria-label={t('Biểu đồ đường so sánh tổng thao tác từng ngày của kỳ hiện tại và kỳ trước')}>
            {[26, 76, 127, 178].map((y) => <line key={y} x1="34" x2="666" y1={y} y2={y} className="personal-performance-gridline" />)}
            <polyline points={previousLine} className="personal-performance-line previous" />
            <polyline points={currentLine} className="personal-performance-line current" />
            {timeline.map((item, index) => <g key={item.date}><circle cx={point(item.current, index).split(',')[0]} cy={point(item.current, index).split(',')[1]} r="3.5" className="personal-performance-dot current" /><circle cx={point(item.previous, index).split(',')[0]} cy={point(item.previous, index).split(',')[1]} r="3" className="personal-performance-dot previous" /></g>)}
            {timeline.filter((_, index) => index === 0 || index === timeline.length - 1 || index % Math.max(1, Math.ceil(timeline.length / 6)) === 0).map((item, index, visible) => <text key={item.date} x={timeline.length <= 1 ? 350 : 34 + (timeline.findIndex((entry) => entry.date === item.date) / (timeline.length - 1)) * 632} y="207" textAnchor={index === 0 ? 'start' : index === visible.length - 1 ? 'end' : 'middle'} className="personal-performance-axis-label">{item.label}</text>)}
          </svg>
          <div className="personal-performance-legend"><span><i className="current" /> {t('Kỳ hiện tại')}</span><span><i className="previous" /> {t('Kỳ trước')}</span></div>
          <details className="personal-performance-data"><summary>{t('Xem số liệu từng ngày')}</summary><div>{timeline.map((item) => <p key={item.date}><strong>{formatPeriod(item.date)}</strong><span>{t('Kỳ này: {{current}} · Kỳ trước: {{previous}}', { current: formatNumber(item.current), previous: formatNumber(item.previous) })}</span></p>)}</div></details>
        </>}
      </section>
    </>}
  </section>
}

function useStateRange(): [PerformanceData['range'], (range: PerformanceData['range']) => void] {
  const [range, setRange] = useState<PerformanceData['range']>('7d')
  return [range, setRange]
}
