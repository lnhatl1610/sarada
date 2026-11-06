import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime, formatVnd } from '../../lib/date-format'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { publishAdminPageSize, useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { FormField } from '../../components/shared/form-field'
import { ImageUploader } from '../../components/shared/image-uploader'
import { MoneyInput } from '../../components/shared/money'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { mediaUrl } from '../../lib/media-url'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import '../../ReferenceData.css'

export type CampaignKind = 'coupons' | 'banners'
type Item = { id: number; code?: string; title?: string; alt?: string; description?: string | null; type?: 'percent' | 'fixed' | 'free_ship' | string; value?: number; max_discount?: number | null; min_order_value?: number; usage_limit?: number | null; usage_per_user?: number | null; used_count?: number; image?: string; video_url?: string | null; link?: string | null; position?: string; sort_order?: number; starts_at?: string | null; ends_at?: string | null; show_countdown?: boolean; is_active: boolean }
type Response = { data: Item[]; meta: { current_page: number; last_page: number; total: number }; status_counts?: Record<string, number>; message?: string }
type Props = { kind: CampaignKind; apiUrl: string; accessToken: string; canManage?: boolean; initialItemId?: number; onNavigate?: (href: string) => void }
const schema = (kind: CampaignKind, t: (key: string) => string) => z.object({ code: z.string(), title: z.string(), alt: z.string(), description: z.string(), type: z.string(), value: z.string(), max_discount: z.string(), min_order_value: z.string(), usage_limit: z.string(), usage_per_user: z.string(), image: z.string(), video_url: z.string(), link: z.string(), position: z.string(), sort_order: z.string(), starts_at: z.string(), ends_at: z.string(), show_countdown: z.boolean(), is_active: z.boolean() }).superRefine((values, context) => {
  if (values.starts_at && values.ends_at && new Date(values.ends_at) <= new Date(values.starts_at)) {
    context.addIssue({ code: 'custom', path: ['ends_at'], message: t('Thời điểm kết thúc phải sau thời điểm bắt đầu.') })
  }
  if (kind === 'banners' && values.show_countdown) {
    if (values.position !== 'campaign') context.addIssue({ code: 'custom', path: ['position'], message: t('Chỉ banner chiến dịch mới có thể hiển thị đếm ngược.') })
    if (!values.ends_at) context.addIssue({ code: 'custom', path: ['ends_at'], message: t('Cần cài đặt thời điểm kết thúc để hiển thị đếm ngược.') })
  }
  if (kind === 'coupons') {
    const code = values.code.trim()
    if (code.length < 3 || code.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(code)) {
      context.addIssue({ code: 'custom', path: ['code'], message: t('Mã gồm 3–50 ký tự chữ, số, dấu gạch ngang hoặc gạch dưới.') })
    }
    const value = Number(values.value)
    if (values.type !== 'free_ship' && (!Number.isInteger(value) || value < 1)) {
      context.addIssue({ code: 'custom', path: ['value'], message: t('Vui lòng nhập giá trị giảm là số nguyên lớn hơn 0.') })
    }
    if (values.type === 'percent' && value > 100) {
      context.addIssue({ code: 'custom', path: ['value'], message: t('Mức giảm phần trăm không vượt quá 100.') })
    }
    for (const field of ['min_order_value', 'usage_limit', 'usage_per_user'] as const) {
      const parsed = Number(values[field])
      const optional = field !== 'min_order_value'
      if ((values[field].trim() || !optional) && (!Number.isInteger(parsed) || parsed < (field === 'min_order_value' ? 0 : 1))) {
        context.addIssue({ code: 'custom', path: [field], message: t(field === 'min_order_value' ? 'Đơn tối thiểu phải là số nguyên không âm.' : 'Giới hạn phải là số nguyên lớn hơn 0.') })
      }
    }
    if (values.max_discount && (!Number.isInteger(Number(values.max_discount)) || Number(values.max_discount) < 0)) {
      context.addIssue({ code: 'custom', path: ['max_discount'], message: t('Mức giảm tối đa phải là số nguyên không âm.') })
    }
  } else {
    if (!values.title.trim()) context.addIssue({ code: 'custom', path: ['title'], message: t('Vui lòng nhập tiêu đề banner.') })
    if (values.description.length > 500) context.addIssue({ code: 'custom', path: ['description'], message: t('Mô tả nội dung không quá 500 ký tự.') })
    if (!values.alt.trim()) context.addIssue({ code: 'custom', path: ['alt'], message: t('Hãy mô tả nội dung ảnh banner.') })
    if (!values.image.trim()) context.addIssue({ code: 'custom', path: ['image'], message: t('Vui lòng nhập đường dẫn ảnh banner.') })
    if (!isSafeHttpUrl(values.video_url)) context.addIssue({ code: 'custom', path: ['video_url'], message: t('URL video phải bắt đầu bằng http:// hoặc https://.') })
    if (!isSafeBannerLink(values.link)) context.addIssue({ code: 'custom', path: ['link'], message: t('Đường dẫn phải là đường dẫn nội bộ hoặc URL bắt đầu bằng http:// hay https://.') })
  }
})
type Form = z.infer<ReturnType<typeof schema>>
const empty: Form = { code: '', title: '', alt: '', description: '', type: 'percent', value: '', max_discount: '', min_order_value: '0', usage_limit: '', usage_per_user: '', image: '', video_url: '', link: '', position: 'home_hero', sort_order: '0', starts_at: '', ends_at: '', show_countdown: false, is_active: true }
const localDate = (value?: string | null) => value ? new Date(new Date(value).valueOf() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const money = (value?: number | null) => formatVnd(value ?? 0)
const bannerPositions = ['home_hero', 'home_mid', 'hero', 'hero-mobile', 'campaign', 'category', 'popup'] as const
const bannerPositionLabels = (t: (key: string) => string): Record<typeof bannerPositions[number], string> => ({ home_hero: t('Trang chủ · đầu trang'), home_mid: t('Trang chủ · giữa trang'), hero: t('Hero desktop'), 'hero-mobile': t('Hero mobile'), campaign: t('Chiến dịch / video'), category: t('Danh mục'), popup: t('Cửa sổ bật lên') })
function isSafeBannerLink(value: string): boolean {
  const href = value.trim()
  if (!href) return true
  if (href.startsWith('/') && !href.startsWith('//') && !href.includes('\\') && !Array.from(href).some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return true

  return isSafeHttpUrl(href)
}

function isSafeHttpUrl(value: string): boolean {
  const href = value.trim()
  if (!href) return true
  try {
    const url = new URL(href)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

const createCouponCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = crypto.getRandomValues(new Uint8Array(8))
  return `NET-${Array.from(random, (value) => alphabet[value % alphabet.length]).join('')}`
}
const couponStatus = (item: Item, now: number, t: (key: string) => string): { label: string; tone: string } => {
  if (!item.is_active) return { label: t('Đã tắt'), tone: 'neutral' }
  if (item.starts_at && new Date(item.starts_at).getTime() > now) return { label: t('Chưa bắt đầu'), tone: 'warning' }
  if (item.ends_at && new Date(item.ends_at).getTime() <= now) return { label: t('Hết hạn'), tone: 'muted' }
  if (item.usage_limit != null && (item.used_count ?? 0) >= item.usage_limit) return { label: t('Đã dùng hết'), tone: 'warning' }
  return { label: t('Đang chạy'), tone: 'success' }
}

const bannerStatus = (item: Item, now: number, t: (key: string) => string): { label: string; tone: string } => {
  if (!item.is_active) return { label: t('Đã tắt'), tone: 'neutral' }
  if (item.starts_at && new Date(item.starts_at).getTime() > now) return { label: t('Chưa bắt đầu'), tone: 'warning' }
  if (item.ends_at && new Date(item.ends_at).getTime() <= now) return { label: t('Hết hạn'), tone: 'muted' }
  return { label: t('Đang hiển thị'), tone: 'success' }
}

function SortableBanner({ item, apiUrl, busy, canManage, now, onEdit, onDelete }: { item: Item; apiUrl: string; busy: boolean; canManage: boolean; now: number; onEdit: (item: Item) => void; onDelete: (item: Item) => void }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: busy || !canManage })
  const period = `${item.starts_at ? formatDateTime(item.starts_at) : t("Bắt đầu ngay")} · ${item.ends_at ? formatDateTime(item.ends_at) : t("Không giới hạn")}`
  const status = bannerStatus(item, now, t)

  return <li ref={setNodeRef} className={`banner-sortable-row${isDragging ? ' is-dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    {canManage && <button className="catalog-sortable-handle" type="button" aria-label={t('Kéo để sắp xếp banner {{title}}', { title: item.title })} title={t("Kéo để sắp xếp")} disabled={busy} {...attributes} {...listeners}><GripVertical size={16} aria-hidden="true" /></button>}
    <img src={mediaUrl(apiUrl, item.image)} alt="" loading="lazy" onError={(event) => event.currentTarget.remove()} />
    <span className="banner-sortable-copy"><strong>{item.title}</strong><small>{period}</small><small><span className={`status-badge status-badge-${status.tone}`}><span className="status-badge-dot" aria-hidden="true" />{status.label}</span> {t("· Thứ tự")}{item.sort_order ?? 0}</small></span>
    {canManage && <RowActionsMenu label={t('Thao tác banner {{title}}', { title: item.title })} actions={[{ id: 'edit', label: t("Sửa"), onSelect: () => onEdit(item) }, { id: 'delete', label: t("Xóa"), onSelect: () => onDelete(item), destructive: true }]} />}
  </li>
}

async function request<T>(url: string, token: string, t: (key: string) => string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể xử lý yêu cầu.'))
  return body
}

export function CampaignPage({ kind, apiUrl, accessToken, canManage = true, initialItemId, onNavigate }: Props) {
  const { t } = useTranslation()
  const pageSize = useAdminPageSize()
  const client = useQueryClient()
  const { state: listState, queryState: queryListState, setValue: setListValue, applyValues: applyListValues, clearFilters } = useListUrlState(`campaign_${kind}`, { q: '', sort: kind === 'coupons' ? 'code' : '', page: '1', campaign_status: '', campaign_type: '', campaign_position: '', from: '', to: '' })
  const { state: usageState, setValue: setUsageValue } = useListUrlState('coupon_usages', { sort: '-created_at', page: '1' })
  const q = listState.q
  const queryQ = queryListState.q
  const listSort = kind === 'coupons' ? listState.sort || 'code' : ''
  const campaignStatus = listState.campaign_status || ''
  const campaignType = listState.campaign_type || ''
  const campaignPosition = listState.campaign_position || ''
  const campaignFrom = listState.from || ''
  const campaignTo = listState.to || ''
  const listSortBy = listSort.startsWith('-') ? listSort.slice(1) : listSort || 'code'
  const listSortDirection = listSort.startsWith('-') ? 'desc' : 'asc'
  const page = Math.max(1, Number.parseInt(listState.page, 10) || 1)
  const [editing, setEditing] = useState<Item | null>(null)
  const [open, setOpen] = useState(() => location.pathname === `/${kind}/create` || new URLSearchParams(location.search).get('create') === '1')
  const [deleting, setDeleting] = useState<Item | null>(null)
  const [usageCoupon, setUsageCoupon] = useState<Item | null>(null)
  const usagePage = Math.max(1, Number.parseInt(usageState.page, 10) || 1)
  const usageSort = usageState.sort || '-created_at'
  const usageSortBy = usageSort.startsWith('-') ? usageSort.slice(1) : usageSort
  const usageSortDirection = usageSort.startsWith('-') ? 'desc' : 'asc'
  const [notice, setNotice] = useState('')
  const [bannerImageUploading, setBannerImageUploading] = useState(false)
  const [bannerImageUploadError, setBannerImageUploadError] = useState('')
  const [bannerVideoUploading, setBannerVideoUploading] = useState(false)
  const [bannerVideoUploadError, setBannerVideoUploadError] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [statusNow, setStatusNow] = useState(() => Date.now())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const form = useForm<Form>({ resolver: zodResolver(schema(kind, t)), defaultValues: empty })
  const confirmDiscard = useUnsavedFormGuard(open && form.formState.isDirty)
  const imagePreview = useWatch({ control: form.control, name: 'image' })
  const previewValues = useWatch({ control: form.control, defaultValue: empty })
  const uploadBannerImage = async (files: File[]) => {
    const file = files[0]
    if (!file || kind !== 'banners') return
    setBannerImageUploading(true)
    setBannerImageUploadError('')
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, 'Không thể tải ảnh banner lên.')
      form.setValue('image', result.data.url, { shouldDirty: true, shouldValidate: true })
      form.clearErrors('image')
    } catch (cause) {
      setBannerImageUploadError(cause instanceof Error ? cause.message : 'Không thể tải ảnh banner lên.')
    } finally {
      setBannerImageUploading(false)
    }
  }
  const uploadBannerVideo = async (files: File[]) => {
    const file = files[0]
    if (!file || kind !== 'banners') return
    setBannerVideoUploadError('')
    if (file.size > 5 * 1024 * 1024) {
      setBannerVideoUploadError(t('Video không được vượt quá 5 MB.'))
      return
    }
    setBannerVideoUploading(true)
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, 'Không thể tải video banner lên.')
      form.setValue('video_url', result.data.url, { shouldDirty: true, shouldValidate: true })
      form.clearErrors('video_url')
    } catch (cause) {
      setBannerVideoUploadError(cause instanceof Error ? cause.message : 'Không thể tải video banner lên.')
    } finally {
      setBannerVideoUploading(false)
    }
  }
  useEffect(() => {
    const interval = window.setInterval(() => setStatusNow(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])
  const list = useQuery({ queryKey: ['admin', 'campaigns', kind, queryQ, campaignStatus, campaignType, campaignPosition, campaignFrom, campaignTo, listSort, page, pageSize], queryFn: () => {
    const params = new URLSearchParams({ page: String(page), per_page: String(pageSize) })
    if (queryQ.trim()) params.set('q', queryQ.trim())
    if (kind === 'coupons') {
      params.set('sort', listSort)
      if (campaignStatus) params.set('campaign_status', campaignStatus)
      if (campaignType) params.set('campaign_type', campaignType)
      if (campaignFrom) params.set('from', campaignFrom)
      if (campaignTo) params.set('to', campaignTo)
    } else {
      if (campaignStatus) params.set('campaign_status', campaignStatus)
      if (campaignPosition) params.set('campaign_position', campaignPosition)
    }
    return request<Response>(`${apiUrl}/admin/campaigns/${kind}?${params}`, accessToken, t)
  }, enabled: Boolean(accessToken) })
  const detail = useQuery({
    queryKey: ['admin', 'campaigns', kind, 'detail', initialItemId],
    queryFn: () => request<{ data: Item }>(`${apiUrl}/admin/campaigns/${kind}/${initialItemId}`, accessToken, t),
    enabled: Boolean(accessToken && initialItemId && canManage),
  })
  const usages = useQuery({ queryKey: ['admin', 'coupon-usages', usageCoupon?.id, usageSort, usagePage, pageSize], queryFn: () => request<{ data: { id: number; order_id: number; order_code: string; customer_name: string | null; discount: number; grand_total: number; created_at: string }[]; meta: { current_page: number; last_page: number; total: number }; summary: { total_discount: number } }>(`${apiUrl}/admin/campaigns/coupons/${usageCoupon?.id}/usages?${new URLSearchParams({ page: String(usagePage), per_page: String(pageSize), sort: usageSort })}`, accessToken, t), enabled: Boolean(accessToken && usageCoupon) })
  const save = useMutation({ mutationFn: (values: Form) => {
    const payload = kind === 'coupons' ? {
      code: values.code.trim().toUpperCase(), description: values.description || null, type: values.type,
      value: values.type === 'free_ship' ? 0 : Number(values.value), max_discount: values.max_discount ? Number(values.max_discount) : null,
      min_order_value: Number(values.min_order_value || 0), usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
      usage_per_user: values.usage_per_user ? Number(values.usage_per_user) : null,
      starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
      ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null, is_active: values.is_active,
    } : {
      title: values.title.trim(), description: values.description.trim() || null, alt: values.alt.trim(), image: values.image.trim(), video_url: values.video_url.trim() || null, link: values.link || null, position: values.position,
      sort_order: Number(values.sort_order || 0), starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
      ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null, show_countdown: values.show_countdown, is_active: values.is_active,
    }
    return request(`${apiUrl}/admin/campaigns/${kind}${editing ? `/${editing.id}` : ''}`, accessToken, t, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
  }, onError: (error) => { applyServerValidationErrors(form, error) }, onSuccess: () => { confirmDiscard.clear(); void client.invalidateQueries({ queryKey: ['admin', 'campaigns', kind] }); setOpen(false); setEditing(null); setNotice(t("Đã lưu thay đổi.")); if (initialItemId || location.pathname === `/${kind}/create`) onNavigate?.(`/${kind}`) } })
  const toggleCoupon = useMutation({ mutationFn: (item: Item) => request(`${apiUrl}/admin/campaigns/coupons/${item.id}`, accessToken, t, { method: 'PATCH', body: JSON.stringify({ is_active: !item.is_active }) }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'campaigns', 'coupons'] }); setNotice(t('Đã cập nhật trạng thái mã.')) }, onError: (error) => setNotice(error instanceof Error ? error.message : t('Không thể cập nhật trạng thái mã.')) })
  const remove = useMutation({ mutationFn: (item: Item) => request(`${apiUrl}/admin/campaigns/${kind}/${item.id}`, accessToken, t, { method: 'DELETE' }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'campaigns', kind] }); setDeleting(null); setNotice(t('Đã xóa.')) } })
  const openForm = (item?: Item) => {
    setEditing(item ?? null)
    form.reset(item ? { code: item.code ?? '', title: item.title ?? '', alt: item.alt ?? item.title ?? '', description: item.description ?? '', type: item.type ?? 'percent', value: String(item.value ?? ''), max_discount: String(item.max_discount ?? ''), min_order_value: String(item.min_order_value ?? 0), usage_limit: String(item.usage_limit ?? ''), usage_per_user: String(item.usage_per_user ?? ''), image: item.image ?? '', video_url: item.video_url ?? '', link: item.link ?? '', position: item.position ?? 'home_hero', sort_order: String(item.sort_order ?? 0), starts_at: localDate(item.starts_at), ends_at: localDate(item.ends_at), show_countdown: item.show_countdown ?? false, is_active: item.is_active } : empty)
    save.reset()
    setOpen(true)
  }
  const openedDetailId = useRef('')
  useEffect(() => {
    const item = detail.data?.data
    if (!item || openedDetailId.current === String(item.id)) return
    openedDetailId.current = String(item.id)
    window.setTimeout(() => openForm(item), 0)
  // The route identifies a stable record; the detail query only changes when that record loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data?.data?.id])
  const openedCreateRoute = useRef('')
  useEffect(() => {
    const isCreateRoute = location.pathname === `/${kind}/create` || new URLSearchParams(location.search).get('create') === '1'
    const routeKey = `${kind}:${location.pathname}:${location.search}`
    if (isCreateRoute && !open && openedCreateRoute.current !== routeKey) {
      openedCreateRoute.current = routeKey
      window.setTimeout(() => openForm(), 0)
    }
  // Route changes can enter the create URL without remounting this feature page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, location.pathname, location.search, open])
  const closeForm = () => {
    if (!confirmDiscard()) return
    setOpen(false)
    setEditing(null)
    if (initialItemId || location.pathname === `/${kind}/create` || new URLSearchParams(location.search).get('create') === '1') onNavigate?.(`/${kind}`)
  }
  const reorderBanners = async (position: string, items: Item[]) => {
    if (kind !== 'banners' || !canManage || ordering) return
    const queryKey = ['admin', 'campaigns', kind, q, campaignStatus, campaignType, campaignPosition, campaignFrom, campaignTo, listSort, page]
    const previous = list.data
    if (previous) {
      const ordered = items.map((item, index) => ({ ...item, sort_order: index }))
      client.setQueryData<Response>(queryKey, { ...previous, data: [...previous.data.filter((item) => item.position !== position), ...ordered] })
    }
    setOrdering(true)
    setNotice('')
    try {
      await request(`${apiUrl}/admin/banners/reorder`, accessToken, t, { method: 'PATCH', body: JSON.stringify({ position, ids: items.map((item) => item.id) }) })
      setNotice(t("Đã lưu thứ tự banner."))
      await client.invalidateQueries({ queryKey: ['admin', 'campaigns', 'banners'] })
    } catch (cause) {
      if (previous) client.setQueryData(queryKey, previous)
      setNotice(cause instanceof Error ? cause.message : t("Không thể lưu thứ tự banner."))
    } finally {
      setOrdering(false)
    }
  }
  const onBannerDragEnd = (position: string, items: Item[], event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id || ordering || !canManage) return
    const from = items.findIndex((item) => item.id === event.active.id)
    const to = items.findIndex((item) => item.id === event.over?.id)
    if (from >= 0 && to >= 0) void reorderBanners(position, arrayMove(items, from, to))
  }
  const columns: DataTableColumn<Item>[] = kind === 'coupons' ? [
    { id: 'code', header: t("MÃ"), sortable: true, cell: (item) => <button className="secondary" onClick={() => { setUsageCoupon(item); setUsageValue('page', '1') }}>{item.code}</button> },
    { id: 'type', header: t("LOẠI"), sortKey: 'type', sortable: true, cell: (item) => item.type === 'percent' ? t("Phần trăm") : item.type === 'free_ship' ? t("Miễn phí vận chuyển") : t("Số tiền cố định") },
    { id: 'discount', header: t("GIÁ TRỊ"), sortKey: 'value', sortable: true, cell: (item) => item.type === 'free_ship' ? t("Miễn phí vận chuyển") : item.type === 'percent' ? `${item.value}%` : money(item.value) },
    { id: 'minimum', header: t("ĐƠN TỐI THIỂU"), sortKey: 'min_order_value', sortable: true, cell: (item) => money(item.min_order_value) },
    { id: 'usage', header: t("ĐÃ DÙNG / GIỚI HẠN"), sortKey: 'used_count', sortable: true, cell: (item) => `${item.used_count ?? 0} / ${item.usage_limit ?? '∞'}` },
    { id: 'period', header: t("HIỆU LỰC"), sortKey: 'starts_at', sortable: true, cell: (item) => `${item.starts_at ? formatDateTime(item.starts_at) : t("Bắt đầu ngay")} – ${item.ends_at ? formatDateTime(item.ends_at) : t("Không giới hạn")}` },
    { id: 'status', header: t('TRẠNG THÁI'), cell: (item) => { const status = couponStatus(item, statusNow, t); return <span className="reference-actions"><span className={`status-badge status-badge-${status.tone}`}><span className="status-badge-dot" aria-hidden="true" />{status.label}</span>{canManage && <button className="secondary" type="button" role="switch" aria-checked={item.is_active} aria-label={t('{{action}} mã {{code}}', { action: t(item.is_active ? 'Tắt' : 'Bật'), code: item.code })} disabled={toggleCoupon.isPending} onClick={() => toggleCoupon.mutate(item)}>{t(item.is_active ? 'Tắt' : 'Bật')}</button>}</span> } },
    { id: 'actions', header: t("THAO TÁC"), cell: (item) => canManage ? <RowActionsMenu label={t('Thao tác mã {{code}}', { code: item.code })} actions={[{ id: 'edit', label: t("Sửa"), onSelect: () => openForm(item) }, { id: 'duplicate', label: t("Nhân bản"), onSelect: () => { openForm(item); setEditing(null); form.setValue('code', createCouponCode(), { shouldDirty: true }) } }, ...(!item.used_count ? [{ id: 'delete', label: t("Xóa"), onSelect: () => setDeleting(item), destructive: true }] : [])]} /> : null },
  ] : [
    { id: 'title', header: t("TIÊU ĐỀ"), cell: (item) => <strong>{item.title}</strong> },
    { id: 'position', header: t("VỊ TRÍ"), cell: (item) => bannerPositionLabels(t)[item.position as keyof ReturnType<typeof bannerPositionLabels>] ?? item.position },
    { id: 'image', header: t("ẢNH"), cell: (item) => item.image ? <a href={item.image} target="_blank" rel="noreferrer">{t("Xem ảnh")}</a> : '—' },
    { id: 'order', header: t("THỨ TỰ"), cell: (item) => item.sort_order ?? 0 },
    { id: 'status', header: t("TRẠNG THÁI"), cell: (item) => item.is_active ? t("Đang bật") : t("Đã tắt") },
    { id: 'actions', header: t("THAO TÁC"), cell: (item) => canManage ? <RowActionsMenu label={t('Thao tác banner {{title}}', { title: item.title })} actions={[{ id: 'edit', label: t("Sửa"), onSelect: () => openForm(item) }, { id: 'delete', label: t("Xóa"), onSelect: () => setDeleting(item), destructive: true }]} /> : null },
  ]
  const label = kind === 'coupons' ? t("Mã giảm giá") : t('Banner')
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => setListValue(key, '') })
  const campaignStatusLabel = ({ running: t('Đang chạy'), upcoming: t('Sắp tới'), expiring: t('Sắp hết hạn'), expired: t('Hết hạn'), disabled: t('Tắt'), active: t('Đang bật'), inactive: t('Đã tắt') } as Record<string, string>)[campaignStatus] ?? campaignStatus
  const campaignTypeLabel = ({ percent: t('Phần trăm'), fixed: t('Số tiền cố định'), free_ship: t('Miễn phí vận chuyển') } as Record<string, string>)[campaignType] ?? campaignType
  if (q) addFilterChip('q', t('Tìm: {{query}}', { query: q }), 'q')
  if (campaignStatus) addFilterChip('campaign_status', t('Trạng thái: {{status}}', { status: campaignStatusLabel }), 'campaign_status')
  if (kind === 'coupons' && campaignType) addFilterChip('campaign_type', t('Loại mã: {{type}}', { type: campaignTypeLabel }), 'campaign_type')
  if (kind === 'coupons' && campaignFrom) addFilterChip('from', t('Từ {{date}}', { date: campaignFrom }), 'from')
  if (kind === 'coupons' && campaignTo) addFilterChip('to', t('Đến {{date}}', { date: campaignTo }), 'to')
  if (kind === 'banners' && campaignPosition) addFilterChip('campaign_position', t('Vị trí: {{position}}', { position: bannerPositionLabels(t)[campaignPosition as keyof ReturnType<typeof bannerPositionLabels>] ?? campaignPosition }), 'campaign_position')
  return <section className="panel reference-page"><div className="panel-heading"><div><h2>{label}</h2><p>{kind === 'coupons' ? t("Quản lý mã khuyến mãi đang dùng trong checkout.") : t("Quản lý banner theo vị trí và thời gian hiển thị.")}</p></div>{canManage && <button className="primary" onClick={() => openForm()}>{t('Thêm {{item}}', { item: label.toLocaleLowerCase() })}</button>}</div>
    {notice && <p role="status" className="reference-notice">{notice}</p>}
    {initialItemId && detail.isLoading && <p className="shared-loading" role="status">{t("Đang tải")}{label.toLowerCase()}…</p>}
    {initialItemId && detail.isError && <p className="reference-error" role="alert">{detail.error instanceof Error ? detail.error.message : t('Không tải được {{item}}.', { item: label.toLocaleLowerCase() })} <button type="button" className="secondary" onClick={() => void detail.refetch()}>{t("Thử lại")}</button></p>}
     {kind === 'coupons' && <div className="order-status-tabs" role="group" aria-label={t("Lọc trạng thái mã giảm giá")}>{[['', t("Tất cả")], ['running', t("Đang chạy")], ['expiring', t("Sắp hết hạn")], ['upcoming', t("Sắp tới")], ['expired', t("Hết hạn")], ['disabled', t("Tắt")]].map(([value, title]) => <button key={value} className="order-status-tab" type="button" aria-pressed={campaignStatus === value} onClick={() => setListValue('campaign_status', value)}>{title} <span>{list.data?.status_counts?.[value || "all"] ?? "—"}</span></button>)}</div>}
      <FilterBar hasFilters={Boolean(q || campaignStatus || (kind === 'coupons' && (campaignType || campaignFrom || campaignTo)) || (kind === 'banners' && campaignPosition))} onClear={() => clearFilters(kind === 'coupons' ? ['q', 'campaign_status', 'campaign_type', 'from', 'to'] : ['q', 'campaign_status', 'campaign_position'])} activeFilters={activeFilterChips}><input aria-label={t('Tìm {{item}}', { item: label.toLocaleLowerCase() })} placeholder={kind === 'coupons' ? t("Tìm theo mã") : t("Tìm theo tiêu đề")} value={q} onChange={(event) => setListValue('q', event.target.value)} />{kind === 'banners' && <select aria-label={t("Lọc trạng thái banner")} value={campaignStatus} onChange={(event) => setListValue('campaign_status', event.target.value)}><option value="">{t("Tất cả trạng thái")}</option><option value="active">{t("Đang bật")}</option><option value="inactive">{t("Đã tắt")}</option></select>}</FilterBar>
      <AdvancedFilterSheet filters={kind === 'coupons' ? { campaign_type: campaignType, from: campaignFrom, to: campaignTo } : { campaign_position: campaignPosition }} defaults={kind === 'coupons' ? { campaign_type: '', from: '', to: '' } : { campaign_position: '' }} activeCount={kind === 'coupons' ? [campaignType, campaignFrom, campaignTo].filter(Boolean).length : Number(Boolean(campaignPosition))} onApply={(values) => applyListValues(kind === 'coupons' ? values : { campaign_position: values.campaign_position })}>
        {(draft, setDraft) => kind === 'coupons' ? <><label>{t("Loại mã")}<select value={draft.campaign_type} onChange={(event) => setDraft('campaign_type', event.target.value)}><option value="">{t("Tất cả loại mã")}</option><option value="percent">{t("Phần trăm")}</option><option value="fixed">{t("Số tiền cố định")}</option><option value="free_ship">{t("Miễn phí vận chuyển")}</option></select></label><label>{t("Từ ngày")}<input type="date" value={draft.from} onChange={(event) => setDraft('from', event.target.value)} /></label><label>{t("Đến ngày")}<input type="date" min={draft.from} value={draft.to} onChange={(event) => setDraft('to', event.target.value)} /></label></> : <label>{t("Vị trí banner")}<select value={draft.campaign_position} onChange={(event) => setDraft('campaign_position', event.target.value)}><option value="">{t("Tất cả vị trí")}</option>{bannerPositions.map((position) => <option key={position} value={position}>{bannerPositionLabels(t)[position]}</option>)}</select></label>}
      </AdvancedFilterSheet>
      {kind === 'coupons' ? <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} onRetry={() => void list.refetch()} noResults={Boolean(q || campaignStatus || campaignType || campaignFrom || campaignTo)} emptyTitle={t('Chưa có {{item}}', { item: label.toLocaleLowerCase() })} emptyDescription={t("Thêm mục mới để bắt đầu.")} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setListValue('page', String(nextPage))} sortBy={listSortBy} sortDirection={listSortDirection} onSortChange={(key, direction) => setListValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} /> : list.isLoading ? <p role="status">{t("Đang tải banner…")}</p> : list.error ? <p className="reference-error" role="alert">{list.error instanceof Error ? list.error.message : t("Không tải được banner.")} <button type="button" className="secondary" onClick={() => void list.refetch()}>{t("Thử lại")}</button></p> : list.data && list.data.meta.total === 0 && Boolean(q || campaignStatus || campaignPosition) ? <div className="shared-table-state"><h2>{t("Không tìm thấy banner phù hợp")}</h2><p>{t("Hãy điều chỉnh hoặc xóa bộ lọc để xem thêm banner.")}</p><button type="button" className="secondary" onClick={() => clearFilters(['q', 'campaign_status', 'campaign_position'])}>{t("Xóa bộ lọc")}</button></div> : <div className="banner-position-groups">{bannerPositions.map((position) => {
      const items = (list.data?.data ?? []).filter((item) => item.position === position).sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      const dragDisabled = ordering || Boolean(q || campaignStatus) || Boolean(list.data && list.data.meta.last_page > 1)
      return <section className="banner-position-group" key={position}><div className="panel-heading"><div><h3>{bannerPositionLabels(t)[position]}</h3><p>{items.length ? `${items.length} banner` : t("Chưa có banner ở vị trí này")}</p></div></div>{dragDisabled && canManage && <p className="reference-notice">{t("Xóa bộ lọc và để toàn bộ banner trên một trang để sắp xếp.")}</p>}{items.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => onBannerDragEnd(position, items, event)}><SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}><ol className="banner-sortable-list">{items.map((item) => <SortableBanner key={item.id} item={item} apiUrl={apiUrl} busy={dragDisabled} canManage={canManage} now={statusNow} onEdit={openForm} onDelete={setDeleting} />)}</ol></SortableContext></DndContext> : <div className="empty-state">{t("Banner sẽ xuất hiện ở nhóm này sau khi được thêm.")}</div>}</section>
     })}{list.data && <div className="catalog-sortable-pagination"><label>{t("Số dòng")}<select aria-label={t("Số banner mỗi trang")} value={pageSize} onChange={(event) => { publishAdminPageSize(Number(event.target.value) as 10 | 20 | 50 | 100, 'table'); setListValue('page', '1') }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label><button className="secondary" type="button" disabled={page <= 1 || ordering} onClick={() => setListValue('page', String(Math.max(1, page - 1)))}>{t("Trang trước")}</button><span>{t('Trang {{page}}/{{pages}} · {{total}} banner', { page: list.data.meta.current_page, pages: list.data.meta.last_page, total: list.data.meta.total })}</span><button className="secondary" type="button" disabled={page >= list.data.meta.last_page || ordering} onClick={() => setListValue('page', String(Math.min(list.data!.meta.last_page, page + 1)))}>{t('Trang sau')}</button></div>}</div>}
    {kind === 'coupons' && usageCoupon && <section className="reference-form"><div className="panel-heading"><div><h3>{t("Lịch sử dùng mã")}{usageCoupon.code}</h3><p>{usages.data?.meta.total ?? 0} {t("lượt dùng · Tổng giảm")}{money(usages.data?.summary.total_discount)}</p></div><button className="secondary" onClick={() => setUsageCoupon(null)}>{t("Đóng")}</button></div><DataTable columns={[
      { id: 'order', header: t("ĐƠN HÀNG"), sortKey: 'order_code', sortable: true, cell: (row: { id: number; order_id: number; order_code: string; customer_name: string | null; discount: number; grand_total: number; created_at: string }) => <a href={`/?page=orders&order=${row.order_id}`}>{row.order_code}</a> },
      { id: 'customer', header: t("KHÁCH HÀNG"), sortKey: 'customer_name', sortable: true, cell: (row: { customer_name: string | null }) => row.customer_name ?? t("Khách vãng lai") },
      { id: 'discount', header: t("ĐÃ GIẢM"), sortable: true, cell: (row: { discount: number }) => money(row.discount) },
      { id: 'total', header: t("GIÁ TRỊ ĐƠN"), sortKey: 'grand_total', sortable: true, cell: (row: { grand_total: number }) => money(row.grand_total) },
      { id: 'date', header: t("THỜI GIAN"), sortKey: 'created_at', sortable: true, cell: (row: { created_at: string }) => formatDateTime(row.created_at) },
      ]} rows={usages.data?.data ?? []} rowKey={(row) => row.id} loading={usages.isLoading} error={usages.error instanceof Error ? usages.error.message : null} onRetry={() => void usages.refetch()} emptyTitle={t("Mã chưa được sử dụng")} page={usages.data?.meta.current_page ?? usagePage} pageCount={usages.data?.meta.last_page ?? 1} totalRows={usages.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUsageValue('page', String(nextPage))} sortBy={usageSortBy} sortDirection={usageSortDirection} onSortChange={(key, direction) => setUsageValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} /></section>}
    {open && <form className="reference-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
       <div className="panel-heading"><h3>{editing ? t("Sửa") : t("Thêm")} {label.toLowerCase()}</h3><button type="button" className="secondary" onClick={closeForm}>{t("Đóng")}</button></div>
      <div className="reference-form-grid">
        {kind === 'coupons' ? <>
          <div className="shared-form-field"><label htmlFor="coupon-code">{t("Mã")}<span aria-hidden="true"> *</span></label><div className="coupon-code-field"><input id="coupon-code" autoCapitalize="characters" autoComplete="off" required aria-invalid={Boolean(form.formState.errors.code)} aria-describedby={form.formState.errors.code ? 'coupon-code-error' : undefined} {...form.register('code')} /><button className="secondary" type="button" onClick={() => form.setValue('code', createCouponCode(), { shouldDirty: true, shouldValidate: true })}>{t("Tạo ngẫu nhiên")}</button></div>{form.formState.errors.code?.message && <small id="coupon-code-error" className="shared-field-error" role="alert">{form.formState.errors.code.message}</small>}</div>
          <FormField id="coupon-type" label={t("Loại")} required error={form.formState.errors.type?.message}><select {...form.register('type')}><option value="percent">{t("Phần trăm")}</option><option value="fixed">{t("Số tiền")}</option><option value="free_ship">{t("Miễn phí vận chuyển")}</option></select></FormField>
          <FormField id="coupon-value" label={previewValues.type === 'percent' ? t("Tỷ lệ giảm (%)") : t("Giá trị giảm (VND)")} error={form.formState.errors.value?.message} hint={previewValues.type === 'free_ship' ? t("Mã sẽ miễn toàn bộ phí vận chuyển; không cần nhập giá trị giảm.") : undefined} required={previewValues.type !== 'free_ship'}><input type="number" min="1" max={previewValues.type === 'percent' ? 100 : undefined} step="1" disabled={previewValues.type === 'free_ship'} {...form.register('value')} /></FormField>
          <MoneyInput label={t("Giảm tối đa (VND)")} error={form.formState.errors.max_discount?.message} {...form.register('max_discount')} />
          <MoneyInput label={t("Đơn tối thiểu (VND)")} error={form.formState.errors.min_order_value?.message} {...form.register('min_order_value')} />
          <FormField id="coupon-limit" label={t("Giới hạn sử dụng")} error={form.formState.errors.usage_limit?.message}><input type="number" min="1" step="1" {...form.register('usage_limit')} /></FormField>
          <FormField id="coupon-per-user" label={t("Lượt mỗi khách")} error={form.formState.errors.usage_per_user?.message}><input type="number" min="1" step="1" {...form.register('usage_per_user')} /></FormField>
          <FormField id="coupon-description" label={t("Mô tả")} error={form.formState.errors.description?.message} className="reference-wide"><input {...form.register('description')} /></FormField>
        </> : <>
          <FormField id="banner-title" label={t("Tiêu đề")} error={form.formState.errors.title?.message} required><input {...form.register('title')} /></FormField>
          <FormField id="banner-description" label={t('Mô tả nội dung')} error={form.formState.errors.description?.message} hint={t('Không bắt buộc · tối đa 500 ký tự. Nội dung này xuất hiện bên cạnh tiêu đề trên Storefront.')} className="reference-wide"><textarea maxLength={500} rows={3} {...form.register('description')} /></FormField>
          <FormField id="banner-alt" label={t('Alt text ảnh')} error={form.formState.errors.alt?.message} hint={t('Mô tả ngắn những gì xuất hiện trong ảnh để hỗ trợ người dùng dùng trình đọc màn hình.')} required><input maxLength={255} {...form.register('alt')} /></FormField>
          <FormField id="banner-position" label={t("Vị trí")} required error={form.formState.errors.position?.message}><select {...form.register('position')}>{bannerPositions.map((position) => <option key={position} value={position}>{bannerPositionLabels(t)[position]}</option>)}</select></FormField>
          <FormField id="banner-image" label={t("Đường dẫn ảnh")} error={form.formState.errors.image?.message} required><input {...form.register('image')} /></FormField>
          <ImageUploader label={t('Tải ảnh banner')} helperText={t('JPG, PNG hoặc WebP, tối đa 2 MB. Ảnh tải lên sẽ được lưu trong thư viện media của API.')} onFiles={(files) => void uploadBannerImage(files)} multiple={false} disabled={!canManage || bannerImageUploading} error={bannerImageUploadError} />
          {bannerImageUploading && <p className="reference-notice" role="status">{t('Đang tải ảnh banner lên…')}</p>}
          <FormField id="banner-video" label={t("Đường dẫn video (không bắt buộc)")} error={form.formState.errors.video_url?.message} hint={t('Video được phát cùng ảnh poster trên Storefront.')}><input type="url" placeholder="https://…/video.mp4" {...form.register('video_url')} /></FormField>
           <FormField id="banner-video-upload" label={t('Tải video banner')} hint={t('MP4, tối đa 5 MB. Video tải lên sẽ được lưu trong thư viện media của API.')} error={bannerVideoUploadError}>
             <input type="file" accept="video/mp4,.mp4" disabled={!canManage || bannerVideoUploading} onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ''; void uploadBannerVideo(files) }} />
           </FormField>
           {bannerVideoUploading && <p className="reference-notice" role="status">{t('Đang tải video banner lên…')}</p>}
          {isSafeHttpUrl(previewValues.video_url ?? '') && previewValues.video_url && <video className="reference-wide banner-video-preview" src={previewValues.video_url} poster={previewValues.image} controls playsInline preload="metadata" aria-label={t('Xem trước video banner')} />}
          {imagePreview && <div className="banner-preview-grid reference-wide"><div className="banner-preview-device banner-preview-desktop"><span>{t("Desktop · 1440px")}</span><img key={`desktop-${imagePreview}`} src={mediaUrl(apiUrl, imagePreview)} alt={t("Xem trước banner trên desktop")} onError={(event) => { event.currentTarget.hidden = true }} /></div><div className="banner-preview-device banner-preview-mobile"><span>{t("Mobile · 390px")}</span><img key={`mobile-${imagePreview}`} src={mediaUrl(apiUrl, imagePreview)} alt={t("Xem trước banner trên mobile")} onError={(event) => { event.currentTarget.hidden = true }} /></div></div>}
          <FormField id="banner-link" label={t("Đường dẫn liên kết")} error={form.formState.errors.link?.message}><input placeholder="/products hoặc https://example.com" {...form.register('link')} /></FormField>
          <FormField id="banner-order" label={t("Thứ tự")} error={form.formState.errors.sort_order?.message}><input type="number" min="0" step="1" {...form.register('sort_order')} /></FormField>
        </>}
        <FormField id={`${kind}-starts-at`} label={t("Bắt đầu")} error={form.formState.errors.starts_at?.message}><input type="datetime-local" {...form.register('starts_at')} /></FormField>
        <FormField id={`${kind}-ends-at`} label={t("Kết thúc")} error={form.formState.errors.ends_at?.message}><input type="datetime-local" {...form.register('ends_at')} /></FormField>
        {kind === 'banners' && <label className="reference-checkbox"><input type="checkbox" {...form.register('show_countdown')} /> {t('Hiển thị đếm ngược trên banner chiến dịch')}<small>{t('Chỉ áp dụng cho vị trí Chiến dịch và cần có thời điểm kết thúc.')}</small></label>}
        <label className="reference-checkbox"><input type="checkbox" {...form.register('is_active')} /> {t("Đang bật")}{form.formState.errors.is_active && <small role="alert">{form.formState.errors.is_active.message}</small>}</label>
      </div>
      {kind === 'coupons' && <aside className="coupon-rule-preview" aria-live="polite"><strong>{t("Xem trước quy tắc áp dụng")}</strong><p>{previewValues.type === 'free_ship' ? t("Miễn toàn bộ phí vận chuyển") : previewValues.type === 'percent' ? t('Giảm {{amount}}% trên giá trị hàng', { amount: previewValues.value || '0' }) : t('Giảm {{amount}} trên giá trị hàng', { amount: previewValues.value ? money(Number(previewValues.value)) : formatVnd(0) })}{previewValues.type === 'percent' && previewValues.max_discount ? t(', tối đa {{amount}}', { amount: money(Number(previewValues.max_discount)) }) : ''}.</p><p>{t("Đơn tối thiểu:")}{money(Number(previewValues.min_order_value || 0))} {t("· Giới hạn:")}{previewValues.usage_limit || t("Không giới hạn")} {t("lượt · Mỗi khách:")}{previewValues.usage_per_user || t("Không giới hạn")} {t("lượt.")}</p><p>{previewValues.starts_at ? formatDateTime(new Date(previewValues.starts_at)) : t("Có hiệu lực ngay")} {t("đến")}{previewValues.ends_at ? formatDateTime(new Date(previewValues.ends_at)) : t("Không thời hạn")} · {previewValues.is_active ? t("Đang bật") : t("Đang tắt")}.</p></aside>}
      {save.error && <p role="alert" className="reference-error">{save.error.message}</p>}
       <div className="reference-form-actions"><button type="button" className="secondary" onClick={closeForm}>{t("Hủy")}</button><button type="submit" className="primary" disabled={save.isPending || bannerImageUploading || bannerVideoUploading || !form.formState.isDirty}>{save.isPending ? t("Đang lưu...") : t("Lưu")}</button></div>
    </form>}
    <ConfirmDialog open={deleting !== null} title={t('Xóa {{item}}?', { item: label.toLocaleLowerCase() })} description={remove.error instanceof Error ? remove.error.message : t("Thao tác này không thể hoàn tác.")} confirmLabel={t("Xóa")} busy={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting) }} onOpenChange={(next) => { if (!next) { setDeleting(null); remove.reset() } }} />
  </section>
}
