import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import type { components } from '../../types/api'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'

type WorkspaceKind = 'tasks'
type PersonalTask = components['schemas']['PersonalTask']
type Envelope<T> = { data: T[]; meta?: { total: number } }

const taskSchema = z.object({ title: z.string().trim().min(1, 'Nhập tiêu đề việc cần làm.').max(255), description: z.string().max(10000), priority: z.enum(['low', 'normal', 'high', 'urgent']), status: z.enum(['todo', 'doing', 'done']), due_at: z.string(), remind_at: z.string(), repeat_rule: z.enum(['', 'daily', 'weekly']), subject_type: z.enum(['', 'order', 'product', 'customer', 'inventory']), subject_id: z.string(), user_id: z.string() }).refine((value) => !value.subject_type || Boolean(value.subject_id), { path: ['subject_id'], message: 'Nhập mã liên kết.' })
type TaskValues = z.infer<typeof taskSchema>

const titles: Record<WorkspaceKind, string> = { tasks: 'Việc cần làm' }
const paths: Record<WorkspaceKind, string> = { tasks: '/me/tasks' }
const emptyTask: TaskValues = { title: '', description: '', priority: 'normal', status: 'todo', due_at: '', remind_at: '', repeat_rule: '', subject_type: '', subject_id: '', user_id: '' }
const toLocalDateTime = (value: string | null | undefined) => value ? new Date(value).toISOString().slice(0, 16) : ''
const toIsoDateTime = (value: string) => value ? new Date(value).toISOString() : null

export function PersonalWorkspacePage({ kind, apiUrl, accessToken, userId, permissions, onNavigate }: { kind: WorkspaceKind; apiUrl: string; accessToken: string; userId?: number; permissions: string[]; onNavigate: (href: string) => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const [taskTab, setTaskTab] = useState<'today' | 'upcoming' | 'overdue' | 'done' | 'assigned' | ''>('')
  const [taskPriority, setTaskPriority] = useState('')
  const [taskSubjectType, setTaskSubjectType] = useState('')
  const [error, setError] = useState('')
  const taskForm = useForm<TaskValues>({ resolver: zodResolver(taskSchema), defaultValues: emptyTask })
  const taskSubjectTypeField = useWatch({ control: taskForm.control, name: 'subject_type' })
  const queryKey = ['personal-workspace', userId, kind, taskTab, taskPriority, taskSubjectType]
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (taskTab) params.set('tab', taskTab)
      if (taskPriority) params.set('priority', taskPriority)
      if (taskSubjectType) params.set('subject_type', taskSubjectType)
      const queryString = params.toString()
      const url = `${paths[kind]}${queryString ? `?${queryString}` : ''}`
      const response = await adminApiFetch(`${apiUrl}${url}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không tải được dữ liệu. Hãy thử lại.'))
      return await response.json() as Envelope<PersonalTask>
    },
  })
  const assigneesQuery = useQuery({
    queryKey: ['task-assignees', userId],
    enabled: kind === 'tasks' && permissions.includes('tasks.assign'),
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/me/task-assignees`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không tải được danh sách nhân viên có thể giao việc.'))
      return await response.json() as { data: Array<{ id: number; name: string }> }
    },
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['personal-workspace', userId, kind] })
  const save = useMutation({
    mutationFn: async ({ method, url, body }: { method: 'POST' | 'PATCH' | 'DELETE' | 'PUT'; url: string; body?: unknown }) => {
      const response = await adminApiFetch(`${apiUrl}${url}`, { method, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
      const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw new Error(result.message ?? Object.values(result.errors ?? {})[0]?.[0] ?? t('Không thể lưu thay đổi.'))
      return result
    },
    onSuccess: () => { setError(''); void refresh(); void queryClient.invalidateQueries({ queryKey: ['admin-account-menu-summary', userId] }) },
    onError: (cause) => setError(cause instanceof Error ? t(cause.message) : t('Không thể lưu thay đổi.')),
  })
  const tasks = kind === 'tasks' ? query.data?.data as PersonalTask[] | undefined : undefined

  return <section className="personal-workspace-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Không gian cá nhân')}</p><h1>{t(titles[kind])}</h1><p>{t('Dữ liệu riêng của tài khoản quản trị này.')}</p></div></header>
    <nav className="personal-workspace-tabs" aria-label={t('Không gian cá nhân')}>
      {(Object.keys(paths) as WorkspaceKind[]).map((item) => <a key={item} href={paths[item]} aria-current={item === kind ? 'page' : undefined} className={item === kind ? 'active' : ''} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onNavigate(paths[item]) } }}>{t(titles[item])}</a>)}
    </nav>
    {error && <p className="account-form-error" role="alert">{error}</p>}
    {query.isPending && <p role="status">{t('Đang tải dữ liệu…')}</p>}
    {query.isError && <div className="panel" role="alert"><p>{t(query.error.message)}</p><Button type="button" variant="outline" onClick={() => void query.refetch()}>{t('Thử lại')}</Button></div>}

    {kind === 'tasks' && <div className="panel personal-workspace-panel">
      <h2>{editingTask ? t('Cập nhật việc cần làm') : t('Thêm việc cần làm')}</h2>
      <form className="personal-workspace-form" onSubmit={taskForm.handleSubmit((values) => {
        const body = { title: values.title, description: values.description || null, priority: values.priority, status: values.status, due_at: toIsoDateTime(values.due_at), remind_at: toIsoDateTime(values.remind_at), repeat_rule: values.repeat_rule || null, subject_type: values.subject_type || null, subject_id: values.subject_id ? Number(values.subject_id) : null, ...(values.user_id && !editingTask ? { user_id: Number(values.user_id) } : {}) }
        save.mutate({ method: editingTask ? 'PATCH' : 'POST', url: editingTask ? `/me/tasks/${editingTask}` : '/me/tasks', body }, { onSuccess: () => { taskForm.reset(emptyTask); setEditingTask(null) } })
      })}>
        <label>{t('Tiêu đề')}<input {...taskForm.register('title')} maxLength={255} /></label>{taskForm.formState.errors.title && <small role="alert">{t(taskForm.formState.errors.title.message ?? '')}</small>}
        <label>{t('Mô tả')}<textarea {...taskForm.register('description')} rows={3} maxLength={10000} /></label>
        <label>{t('Ưu tiên')}<select {...taskForm.register('priority')}><option value="low">{t('Thấp')}</option><option value="normal">{t('Vừa')}</option><option value="high">{t('Cao')}</option><option value="urgent">{t('Khẩn')}</option></select></label>
        <label>{t('Trạng thái')}<select {...taskForm.register('status')}><option value="todo">{t('Chưa làm')}</option><option value="doing">{t('Đang làm')}</option><option value="done">{t('Đã xong')}</option></select></label>
        <label>{t('Hạn hoàn thành')}<input type="datetime-local" {...taskForm.register('due_at')} /></label>
        <label>{t('Nhắc lúc')}<input type="datetime-local" {...taskForm.register('remind_at')} /></label>
        <label>{t('Lặp lại')}<select {...taskForm.register('repeat_rule')}><option value="">{t('Không lặp')}</option><option value="daily">{t('Hằng ngày')}</option><option value="weekly">{t('Hằng tuần')}</option></select></label>
        <label>{t('Liên kết với')}<select {...taskForm.register('subject_type')}><option value="">{t('Không liên kết')}</option><option value="order">{t('Đơn hàng')}</option><option value="product">{t('Sản phẩm')}</option><option value="customer">{t('Khách hàng')}</option><option value="inventory">{t('Phiếu kho')}</option></select></label>
        {taskSubjectTypeField && <label>{t('Mã đối tượng')}<input inputMode="numeric" {...taskForm.register('subject_id')} /></label>}
        {taskForm.formState.errors.subject_id && <small role="alert">{t(taskForm.formState.errors.subject_id.message ?? '')}</small>}
        {!editingTask && permissions.includes('tasks.assign') && <label>{t('Giao cho')}<select {...taskForm.register('user_id')}><option value="">{t('Tôi')}</option>{assigneesQuery.data?.data.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}{assignee.id === userId ? ` (${t('tôi')})` : ''}</option>)}</select></label>}
        {assigneesQuery.isError && <small role="alert">{t(assigneesQuery.error.message)}</small>}
        <div className="workspace-actions"><Button type="submit" disabled={save.isPending}>{save.isPending ? t('Đang lưu…') : editingTask ? t('Lưu việc') : t('Thêm việc')}</Button>{editingTask && <Button type="button" variant="outline" onClick={() => { setEditingTask(null); taskForm.reset(emptyTask) }}>{t('Hủy sửa')}</Button>}</div>
      </form>
      <div className="workspace-task-tabs" role="group" aria-label={t('Lọc việc cần làm')}>
        {([['', 'Tất cả'], ['today', 'Hôm nay'], ['upcoming', 'Sắp tới'], ['overdue', 'Quá hạn'], ['done', 'Đã xong'], ['assigned', 'Tôi đã giao']] as const).map(([tab, label]) => <Button key={tab || 'all'} type="button" size="sm" variant={taskTab === tab ? 'default' : 'outline'} aria-pressed={taskTab === tab} onClick={() => setTaskTab(tab)}>{t(label)}</Button>)}
      </div>
      <div className="personal-workspace-form">
        <label>{t('Lọc theo ưu tiên')}<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}><option value="">{t('Mọi mức ưu tiên')}</option><option value="low">{t('Thấp')}</option><option value="normal">{t('Vừa')}</option><option value="high">{t('Cao')}</option><option value="urgent">{t('Khẩn')}</option></select></label>
        <label>{t('Lọc theo liên kết')}<select value={taskSubjectType} onChange={(event) => setTaskSubjectType(event.target.value)}><option value="">{t('Mọi loại')}</option><option value="order">{t('Đơn hàng')}</option><option value="product">{t('Sản phẩm')}</option><option value="customer">{t('Khách hàng')}</option><option value="inventory">{t('Phiếu kho')}</option></select></label>
      </div>
      <div className="personal-workspace-list" aria-live="polite">
        {(tasks ?? []).map((task) => <article className="personal-workspace-item" key={task.id}>
          <div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<small>{t(task.status === 'done' ? 'Đã xong' : task.status === 'doing' ? 'Đang làm' : 'Chưa làm')} · {t('Ưu tiên {{priority}}', { priority: t(task.priority === 'low' ? 'Thấp' : task.priority === 'normal' ? 'Vừa' : task.priority === 'high' ? 'Cao' : 'Khẩn') })}{task.due_at ? ` · ${t('Hạn {{date}}', { date: formatDateTime(task.due_at) })}` : ''}{task.remind_at ? ` · ${t('Nhắc {{date}}', { date: formatDateTime(task.remind_at) })}` : ''}{task.assignee_name ? ` · ${t('Giao cho {{name}}', { name: task.assignee_name })}` : ''}</small>{task.subject_type && task.subject_id && <a href={task.subject_type === 'order' ? `/orders/${task.subject_id}` : task.subject_type === 'product' ? `/products/${task.subject_id}/edit` : task.subject_type === 'customer' ? `/customers/${task.subject_id}` : `/inventory/adjustments/${task.subject_id}`}>{t('Mở đối tượng liên kết')}</a>}</div>
          {task.user_id === userId && <Button type="button" variant="outline" size="sm" disabled={save.isPending} onClick={() => { setEditingTask(task.id); taskForm.reset({ title: task.title, description: task.description ?? '', priority: task.priority, status: task.status, due_at: toLocalDateTime(task.due_at), remind_at: toLocalDateTime(task.remind_at), repeat_rule: (task.repeat_rule as TaskValues['repeat_rule']) ?? '', subject_type: (task.subject_type as TaskValues['subject_type']) ?? '', subject_id: task.subject_id ? String(task.subject_id) : '', user_id: '' }) }}>{t('Sửa')}</Button>}
          {task.status !== 'done' && task.user_id === userId && <Button type="button" variant="outline" size="sm" disabled={save.isPending} onClick={() => save.mutate({ method: 'POST', url: `/me/tasks/${task.id}/complete` })}>{t('Hoàn tất')}</Button>}
          {task.user_id === userId && <Button type="button" variant="ghost" size="sm" disabled={save.isPending} onClick={() => save.mutate({ method: 'DELETE', url: `/me/tasks/${task.id}` })}>{t('Xóa')}</Button>}
        </article>)}
        {!query.isPending && !query.isError && tasks?.length === 0 && <p className="workspace-empty">{t('Chưa có việc cần làm.')}</p>}
      </div>
    </div>}

  </section>
}
