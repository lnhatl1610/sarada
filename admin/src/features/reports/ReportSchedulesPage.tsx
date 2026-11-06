import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { formatDateTime } from '../../lib/date-format'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import './ReportSchedulesPage.css'

type ReportSchedule = {
  id: number
  name: string
  report: 'revenue' | 'orders' | 'products' | 'customers' | 'inventory' | 'coupons'
  params: Record<string, string | number>
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'csv' | 'pdf'
  recipients: string[]
  timezone: string
  send_time: string
  weekday: number | null
  month_day: number | null
  next_run_at: string | null
  last_run_at: string | null
  last_error: string | null
  is_active: boolean
}

type ScheduleValues = Omit<ReportSchedule, 'id' | 'next_run_at' | 'last_run_at' | 'last_error'>
type ScheduleFormValues = Omit<Pick<ScheduleValues, 'name' | 'report' | 'frequency' | 'format' | 'timezone' | 'send_time' | 'weekday' | 'month_day' | 'is_active'>, 'weekday' | 'month_day'> & { weekday: number; month_day: number; recipientText: string }
const initialValues = (): ScheduleValues => ({
  name: '', report: 'revenue', params: {}, frequency: 'daily', format: 'csv', recipients: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh', send_time: '08:00',
  weekday: 1, month_day: 1, is_active: true,
})
const initialFormValues = (): ScheduleFormValues => ({ ...initialValues(), weekday: 1, month_day: 1, recipientText: '' })

const reportLabels: Record<ReportSchedule['report'], string> = {
  revenue: 'Doanh thu', orders: 'Đơn hàng', products: 'Sản phẩm', customers: 'Khách hàng', inventory: 'Tồn kho', coupons: 'Khuyến mãi',
}

function formatDate(value: string | null, t: TFunction): string {
  return value ? formatDateTime(value) : t('Chưa có')
}

export function ReportSchedulesPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const scheduleSchema = useMemo(() => z.object({
    name: z.string().trim().min(1, t('Nhập tên lịch.')).max(120, t('Tên lịch tối đa 120 ký tự.')),
    report: z.enum(['revenue', 'orders', 'products', 'customers', 'inventory', 'coupons']),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    format: z.enum(['csv', 'pdf']),
    timezone: z.string().trim().min(1, t('Nhập múi giờ IANA.')),
    send_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, t('Chọn giờ gửi hợp lệ.')),
    weekday: z.number().int().min(1).max(7),
    month_day: z.number().int().min(1).max(28),
    is_active: z.boolean(),
    recipientText: z.string().trim().min(3, t('Nhập email người nhận.')).refine((value) => value.split(/[;,\n]/).map((email) => email.trim()).filter(Boolean).every((email) => z.email().safeParse(email).success), t('Kiểm tra lại email người nhận.')),
  }), [t])
  const form = useForm<ScheduleFormValues, unknown, z.infer<typeof scheduleSchema>>({ resolver: zodResolver(scheduleSchema), defaultValues: initialFormValues() })
  const [values, setValues] = useState<ScheduleValues>(initialValues)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [recipientText, setRecipientText] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ReportSchedule | null>(null)
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }

  const schedulesQuery = useQuery({
    queryKey: ['admin', 'report-schedules'],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/reports/schedules?per_page=100`, { headers })
      const body = await response.json() as { data?: ReportSchedule[]; message?: string }
      if (!response.ok) throw new Error(t('Không tải được lịch báo cáo.'))
      return body.data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const recipients = recipientText.split(/[;,\n]/).map((email) => email.trim()).filter(Boolean)
      const response = await adminApiFetch(`${apiUrl}/admin/reports/schedules${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST', headers, body: JSON.stringify({ ...values, recipients }),
      })
      const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().join(' ') : t('Không lưu được lịch báo cáo.'))
      return t(editingId ? 'Đã cập nhật lịch báo cáo.' : 'Đã tạo lịch báo cáo.')
    },
    onSuccess: async (message) => {
      setNotice(message); setError(''); setEditingId(null); setValues(initialValues()); setRecipientText(''); form.reset(initialFormValues())
      await queryClient.invalidateQueries({ queryKey: ['admin', 'report-schedules'] })
    },
    onError: (reason) => { setError(reason instanceof Error ? reason.message : t('Không lưu được lịch báo cáo.')); setNotice('') },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApiFetch(`${apiUrl}/admin/reports/schedules/${id}`, { method: 'DELETE', headers })
      if (!response.ok) throw new Error(t('Không xóa được lịch báo cáo.'))
      return t('Đã xóa lịch báo cáo.')
    },
    onSuccess: async (message) => { setNotice(message); setError(''); setDeleteTarget(null); await queryClient.invalidateQueries({ queryKey: ['admin', 'report-schedules'] }) },
    onError: (reason) => { setError(reason instanceof Error ? reason.message : t('Không xóa được lịch báo cáo.')); setNotice('') },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(''); setError('')
    form.setValue('recipientText', recipientText)
    void form.handleSubmit(() => saveMutation.mutate())(event)
  }

  const beginEdit = useCallback((schedule: ReportSchedule) => {
    setEditingId(schedule.id)
    setValues({ ...schedule })
    setRecipientText(schedule.recipients.join(', '))
    form.reset({ ...schedule, weekday: schedule.weekday ?? 1, month_day: schedule.month_day ?? 1, recipientText: schedule.recipients.join(', ') })
    setNotice(''); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [form])

  const editFromUrl = useRef('')
  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId || editFromUrl.current === editId) return
    const schedule = schedulesQuery.data?.find((item) => String(item.id) === editId)
    if (!schedule) return
    editFromUrl.current = editId
    window.setTimeout(() => beginEdit(schedule), 0)
  }, [beginEdit, schedulesQuery.data])

  const update = <K extends keyof ScheduleValues>(key: K, value: ScheduleValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (key !== 'params' && key !== 'recipients') form.setValue(key as keyof ScheduleFormValues, value as never)
  }
  const setRecipientValue = (value: string) => { setRecipientText(value); form.setValue('recipientText', value) }

  return <div className="reports-page report-schedules-page">
    <header className="page-header"><div><h1>{t('Lịch gửi báo cáo')}</h1><p>{t('Gửi CSV hoặc PDF theo lịch đến email nhân viên có quyền xem báo cáo.')}</p></div></header>
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    <section className="panel">
      <h2>{editingId ? t('Sửa lịch báo cáo') : t('Tạo lịch báo cáo')}</h2>
      <form className="reference-form-grid" onSubmit={onSubmit}>
        <label>{t('Tên lịch')}<input required maxLength={120} value={values.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label>{t('Báo cáo')}<select value={values.report} onChange={(event) => update('report', event.target.value as ScheduleValues['report'])}>{Object.entries(reportLabels).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label>
        <label>{t('Tần suất')}<select value={values.frequency} onChange={(event) => update('frequency', event.target.value as ScheduleValues['frequency'])}><option value="daily">{t('Hằng ngày')}</option><option value="weekly">{t('Hằng tuần')}</option><option value="monthly">{t('Hằng tháng')}</option></select></label>
        {values.frequency === 'weekly' && <label>{t('Thứ trong tuần')}<select value={values.weekday ?? 1} onChange={(event) => update('weekday', Number(event.target.value))}>{[['1', 'Thứ Hai'], ['2', 'Thứ Ba'], ['3', 'Thứ Tư'], ['4', 'Thứ Năm'], ['5', 'Thứ Sáu'], ['6', 'Thứ Bảy'], ['7', 'Chủ nhật']].map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>}
        {values.frequency === 'monthly' && <label>{t('Ngày trong tháng')}<input type="number" min={1} max={28} value={values.month_day ?? 1} onChange={(event) => update('month_day', Number(event.target.value))} /></label>}
        <label>{t('Giờ gửi')}<input type="time" required value={values.send_time} onChange={(event) => update('send_time', event.target.value)} /></label>
        <label>{t('Múi giờ')}<input required value={values.timezone} onChange={(event) => update('timezone', event.target.value)} placeholder="Asia/Ho_Chi_Minh" /></label>
        <label>{t('Định dạng')}<select value={values.format} onChange={(event) => update('format', event.target.value as ScheduleValues['format'])}><option value="csv">CSV</option><option value="pdf">PDF</option></select></label>
        <label className="report-schedule-recipients">{t('Email người nhận')}<input required aria-label={t('Email người nhận')} value={recipientText} onChange={(event) => setRecipientValue(event.target.value)} placeholder="admin@example.com, staff@example.com" /><small>{t('Phân tách bằng dấu phẩy. Mỗi địa chỉ phải thuộc nhân viên đang hoạt động có quyền xem báo cáo.')}</small>{form.formState.errors.recipientText && <small role="alert">{form.formState.errors.recipientText.message}</small>}</label>
        <label className="report-schedule-active"><input type="checkbox" checked={values.is_active} onChange={(event) => update('is_active', event.target.checked)} /> {t('Kích hoạt lịch')}</label>
        <div className="report-schedule-form-actions"><button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t('Đang lưu…') : editingId ? t('Lưu thay đổi') : t('Tạo lịch báo cáo')}</button>{editingId && <button className="secondary" type="button" onClick={() => { setEditingId(null); setValues(initialValues()); setRecipientText('') }}>{t('Hủy sửa')}</button>}</div>
      </form>
    </section>
    <section className="panel">
      <h2>{t('Lịch đã tạo')}</h2>
      {schedulesQuery.isPending ? <p role="status">{t('Đang tải lịch báo cáo…')}</p> : schedulesQuery.isError ? <p role="alert" className="reference-error">{schedulesQuery.error.message}</p> : schedulesQuery.data.length === 0 ? <p>{t('Chưa có lịch báo cáo.')}</p> : <div className="report-schedules-list">
        {schedulesQuery.data.map((schedule) => <article className="report-schedule-card" key={schedule.id}>
          <div className="report-schedule-card-main"><h3>{schedule.name}</h3><p>{t(reportLabels[schedule.report])} · {t(schedule.frequency === 'daily' ? 'Hằng ngày' : schedule.frequency === 'weekly' ? 'Hằng tuần' : 'Hằng tháng')} · {schedule.format.toUpperCase()} · {schedule.send_time} ({schedule.timezone})</p><p>{t('Người nhận: {{recipients}}', { recipients: schedule.recipients.join(', ') })}</p><p>{t('Lần tới: {{next}} · Lần gần nhất: {{last}}', { next: formatDate(schedule.next_run_at, t), last: formatDate(schedule.last_run_at, t) })}</p>{schedule.last_error && <p className="reference-error" role="alert">{schedule.last_error}</p>}</div>
          <div className="report-schedule-card-actions"><span className={schedule.is_active ? 'status-badge status-badge--success' : 'status-badge'}>{schedule.is_active ? t('Đang bật') : t('Đã tắt')}</span><button className="secondary" type="button" onClick={() => beginEdit(schedule)}>{t('Sửa')}</button><button className="secondary" type="button" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(schedule)}>{t('Xóa')}</button></div>
        </article>)}
      </div>}
      <ConfirmDialog open={Boolean(deleteTarget)} title={t('Xóa lịch báo cáo?')} description={deleteTarget ? t('Lịch “{{name}}” sẽ bị xóa.', { name: deleteTarget.name }) : ''} confirmLabel={t('Xóa lịch')} busy={deleteMutation.isPending} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }} />
    </section>
  </div>
}
