import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { mediaUrl } from '../../lib/media-url'
import { adminRoleLabels, adminRoleOptions, type AssignableAdminRole } from './roles'
import { SudoModeDialog } from '../account/SudoModeDialog'
import '../../ReferenceData.css'

type Staff = { id: number; name: string; email: string; phone: string | null; avatar: string | null; role: string; status: string; presence: 'available' | 'busy' | 'away' | 'hidden'; last_login_at: string | null; two_factor_enabled_at: string | null; created_at: string }
type Result = { data: Staff[]; meta: { current_page: number; last_page: number; total: number; status_counts?: Record<string, number> } }
type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
type Invitation = { id: number; email: string; role: string; invited_by: string | null; expires_at: string; expired: boolean; created_at: string }
type Approval = { id: number; name: string; email: string; phone: string | null; email_verified_at: string; created_at: string }
type Props = { apiUrl: string; accessToken: string; currentUserId?: number; canManageAdminRole?: boolean; canManageSecurity?: boolean; canViewActivityLogs?: boolean; canViewPerformance?: boolean }
type ApprovalRole = 'customer' | AssignableAdminRole
const createStaffSchema = (t: (key: string) => string) => z.object({ name: z.string().trim().min(2, t('Tên tối thiểu 2 ký tự.')), email: z.email(t('Email chưa hợp lệ.')), phone: z.string().regex(/^(0|\+84)\d{9}$/, t('Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.')).or(z.literal('')), password: z.string().refine((value) => !value || (value.length >= 10 && /[A-Za-z]/.test(value) && /[0-9]/.test(value)), t('Mật khẩu cần tối thiểu 10 ký tự, gồm chữ cái và chữ số.')), role: z.enum(['admin', 'staff', 'sales_manager', 'warehouse_staff', 'customer_service', 'content_editor', 'accountant']), status: z.enum(['active', 'blocked']) })
type Form = z.infer<ReturnType<typeof createStaffSchema>>
const empty: Form = { name: '', email: '', phone: '', password: '', role: 'staff', status: 'active' }
const asAssignableRole = (name: string): AssignableAdminRole => adminRoleOptions.some((role) => role.value === name) ? name as AssignableAdminRole : 'staff'
const createTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const random = crypto.getRandomValues(new Uint8Array(16))
  return `Net-${Array.from(random, (value) => alphabet[value % alphabet.length]).join('')}`
}

export function StaffPage({ apiUrl, accessToken, currentUserId, canManageAdminRole = false, canManageSecurity = false, canViewActivityLogs = false, canViewPerformance = false }: Props) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state: urlState, queryState, setValue: setUrlValue, clearFilters } = useListUrlState('staff', { q: '', status: '', role: '', last_login_from: '', last_login_to: '', view: 'all', sort: '-created_at', page: '1', invitation_page: '1', invitation_sort: '-created_at', approval_page: '1', approval_sort: '-created_at' })
  const q = urlState.q
  const queryQ = queryState.q
  const status = urlState.status
  const role = urlState.role
  const view = urlState.view || 'all'
  const lastLoginFrom = urlState.last_login_from
  const lastLoginTo = urlState.last_login_to
  const sort = urlState.sort || '-created_at'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const invitationPage = Math.max(1, Number.parseInt(urlState.invitation_page, 10) || 1)
  const approvalPage = Math.max(1, Number.parseInt(urlState.approval_page, 10) || 1)
  const invitationSort = urlState.invitation_sort || '-created_at'
  const approvalSort = urlState.approval_sort || '-created_at'
  const [editing, setEditing] = useState<Staff | null>(null)
  const [deleting, setDeleting] = useState<Staff | null>(null)
  const [open, setOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AssignableAdminRole>('staff')
  const [inviteHours, setInviteHours] = useState('24')
  const [inviteMessage, setInviteMessage] = useState('')
  const [approvalRoles, setApprovalRoles] = useState<Record<number, ApprovalRole>>({})
  const [invitationActionPending, setInvitationActionPending] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [confirmingAction, setConfirmingAction] = useState<{ staff: Staff; action: 'block' | 'unblock' | 'sessions' | 'reset-2fa'; reason?: string } | null>(null)
  const [sudoOpen, setSudoOpen] = useState(false)
  const [sudoExpiresAt, setSudoExpiresAt] = useState<string | null>(null)
  const staffSchema = useMemo(() => createStaffSchema(t), [t])
  const form = useForm<Form>({ resolver: zodResolver(staffSchema), defaultValues: empty })
  const fieldError = (message?: string) => message ? t(message) : undefined
  const confirmStaffDiscard = useUnsavedFormGuard(open && form.formState.isDirty)
  const confirmInviteDiscard = useUnsavedFormGuard(inviteOpen && Boolean(inviteEmail.trim() || inviteRole !== 'staff' || inviteHours !== '24' || inviteMessage.trim()))
  const list = useQuery({ queryKey: ['admin', 'operations', 'staff', queryQ, status, role, lastLoginFrom, lastLoginTo, sort, page, pageSize], queryFn: async () => {
    const params = new URLSearchParams({ page: String(page), per_page: String(pageSize), sort })
    if (queryQ.trim()) params.set('q', queryQ.trim())
    if (status) params.set('status', status)
    if (role) params.set('role', role)
    if (lastLoginFrom) params.set('last_login_from', lastLoginFrom)
    if (lastLoginTo) params.set('last_login_to', lastLoginTo)
    const response = await adminApiFetch(`${apiUrl}/admin/staff?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as Result & { message?: string }
    if (!response.ok) throw new Error(body.message ?? t('Không thể tải nhân viên.'))
    return body
  }, enabled: Boolean(accessToken) })
  const invitations = useQuery({ queryKey: ['admin', 'staff', 'invitations', queryQ, invitationSort, invitationPage, pageSize], queryFn: async () => { const params = new URLSearchParams({ page: String(invitationPage), per_page: String(pageSize), sort: invitationSort }); if (queryQ.trim()) params.set('q', queryQ.trim()); const response = await adminApiFetch(`${apiUrl}/admin/staff/invitations?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as Paginated<Invitation> & { message?: string }; if (!response.ok) throw new Error(body.message ?? t('Không tải được lời mời.')); return body }, enabled: Boolean(accessToken) && ['all', 'invited'].includes(view) })
  const approvals = useQuery({ queryKey: ['admin', 'staff', 'pending-approvals', queryQ, approvalSort, approvalPage, pageSize], queryFn: async () => { const params = new URLSearchParams({ page: String(approvalPage), per_page: String(pageSize), sort: approvalSort }); if (queryQ.trim()) params.set('q', queryQ.trim()); const response = await adminApiFetch(`${apiUrl}/admin/staff/pending-approvals?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as Paginated<Approval> & { message?: string }; if (!response.ok) throw new Error(body.message ?? t('Không tải được yêu cầu phê duyệt.')); return body }, enabled: Boolean(accessToken) && ['all', 'pending'].includes(view) })
  const sudoStatus = useQuery({ queryKey: ['account-sudo-mode'], queryFn: async () => { const response = await adminApiFetch(`${apiUrl}/account/sudo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as { data?: { active: boolean; expires_at: string | null; requires_two_factor: boolean } }; return body.data }, enabled: Boolean(accessToken) })
  const save = useMutation({ mutationFn: async (values: Form) => {
    const payload: Record<string, string | null> = { name: values.name, email: values.email, phone: values.phone || null, role: values.role, status: values.status }
    if (values.password) payload.password = values.password
    const response = await adminApiFetch(`${apiUrl}/admin/staff${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể lưu nhân viên.'))
  }, onError: (error) => { applyServerValidationErrors(form, error) }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'operations', 'staff'] }); setOpen(false); setNotice(t('Đã lưu tài khoản nhân viên.')) } })
  const remove = useMutation({ mutationFn: async (item: Staff) => { const response = await adminApiFetch(`${apiUrl}/admin/staff/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as { message?: string }; if (!response.ok) throw new Error(body.message ?? t('Không thể xóa tài khoản.')) }, onError: (error) => { setNotice(error instanceof Error ? t(error.message) : t('Không thể xóa tài khoản.')) }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'operations', 'staff'] }); setDeleting(null); setNotice(t('Đã xóa tài khoản nhân viên.')) } })
  const staffAction = useMutation({ mutationFn: async (input: { staff: Staff; action: 'block' | 'unblock' | 'sessions' | 'reset-2fa'; reason?: string }) => {
    const endpoint = input.action === 'sessions' ? `${apiUrl}/admin/staff/${input.staff.id}/sessions` : input.action === 'reset-2fa' ? `${apiUrl}/admin/staff/${input.staff.id}/reset-2fa` : `${apiUrl}/admin/staff/${input.staff.id}`
    const method = input.action === 'sessions' ? 'DELETE' : input.action === 'reset-2fa' ? 'POST' : 'PATCH'
    const response = await adminApiFetch(endpoint, { method, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(['PATCH', 'POST'].includes(method) ? { 'Content-Type': 'application/json' } : {}) }, ...(method === 'PATCH' ? { body: JSON.stringify({ status: input.action === 'block' ? 'blocked' : 'active' }) } : method === 'POST' ? { body: JSON.stringify({ reason: input.reason }) } : {}) })
    const body = await response.json() as { message?: string }
    if (!response.ok) throw new Error(body.message ?? t('Không thể cập nhật tài khoản nhân viên.'))
    return body.message
  }, onSuccess: (message) => { void client.invalidateQueries({ queryKey: ['admin', 'operations', 'staff'] }); setConfirmingAction(null); setNotice(message ? t(message) : t('Đã cập nhật tài khoản nhân viên.')) }, onError: (error) => setNotice(error instanceof Error ? t(error.message) : t('Không thể cập nhật tài khoản nhân viên.')) })
  const sendPasswordReset = async (item: Staff) => {
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/staff/${item.id}/password-reset`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể gửi email đặt lại mật khẩu.'))
      setNotice(body.message ? t(body.message) : t('Đã yêu cầu gửi hướng dẫn đặt lại mật khẩu tới {{email}}.', { email: item.email }))
    } catch (error) { setNotice(error instanceof Error ? t(error.message) : t('Không thể gửi email đặt lại mật khẩu.')) }
  }
  const performConfirmingAction = async () => {
    if (!confirmingAction) return
    if (confirmingAction.action === 'reset-2fa') {
      const result = await sudoStatus.refetch()
      const expiresAt = sudoExpiresAt ?? result.data?.expires_at
      if (!result.data?.active || !expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
        setSudoOpen(true)
        return
      }
    }
    staffAction.mutate(confirmingAction)
  }
  const invite = useMutation({ mutationFn: async () => { const response = await adminApiFetch(`${apiUrl}/admin/staff/invitations`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: inviteRole, expires_in_hours: Number(inviteHours), message: inviteMessage || null }) }); const body = await response.json() as { message?: string; errors?: Record<string, string[]> }; if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().map((message) => t(message)).join(' ') : body.message ? t(body.message) : t('Không gửi được lời mời.')) }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'staff', 'invitations'] }); setUrlValue('invitation_page', '1'); setInviteOpen(false); setInviteEmail(''); setInviteMessage(''); setNotice(t('Đã gửi lời mời qua email.')) }, onError: (error) => setNotice(error instanceof Error ? t(error.message) : t('Không gửi được lời mời.')) })
  const invitationAction = async (id: number, action: 'resend' | 'revoke') => {
    setInvitationActionPending(id)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/staff/invitations/${id}${action === 'resend' ? '/resend' : ''}`, { method: action === 'resend' ? 'POST' : 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể cập nhật lời mời.'))
      await client.invalidateQueries({ queryKey: ['admin', 'staff', 'invitations'] })
      setUrlValue('invitation_page', '1')
      setNotice(t(action === 'resend' ? 'Đã gửi lại lời mời.' : 'Đã thu hồi lời mời.'))
    } catch (error) { setNotice(error instanceof Error ? t(error.message) : t('Không thể cập nhật lời mời.')) }
    finally { setInvitationActionPending(null) }
  }
  const decide = async (userId: number, action: 'approve' | 'reject') => { const response = await adminApiFetch(`${apiUrl}/admin/staff/pending-approvals/${userId}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: action === 'approve' ? JSON.stringify({ role: approvalRoles[userId] ?? 'customer' }) : undefined }); const body = await response.json() as { message?: string; errors?: Record<string, string[]> }; if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat().map((message) => t(message)).join(' ') : body.message ? t(body.message) : t('Không thể xử lý yêu cầu.')); await client.invalidateQueries({ queryKey: ['admin', 'staff', 'pending-approvals'] }); await client.invalidateQueries({ queryKey: ['admin', 'operations', 'staff'] }); setUrlValue('approval_page', '1'); setNotice(body.message ? t(body.message) : t(action === 'approve' ? 'Đã duyệt tài khoản.' : 'Đã từ chối tài khoản.')) }
  const openForm = (item?: Staff) => { if (!confirmStaffDiscard()) return; setEditing(item ?? null); form.reset(item ? { name: item.name, email: item.email, phone: item.phone ?? '', password: '', role: asAssignableRole(item.role), status: item.status === 'blocked' ? 'blocked' : 'active' } : empty); save.reset(); setOpen(true) }
  const closeForm = () => { if (!confirmStaffDiscard()) return; setOpen(false) }
  const closeInvite = () => { if (!confirmInviteDiscard()) return; setInviteOpen(false); setInviteEmail(''); setInviteRole('staff'); setInviteHours('24'); setInviteMessage('') }
  const columns: DataTableColumn<Staff>[] = [
    { id: 'name', header: t('HỌ TÊN'), sortable: true, cell: (item) => <span className="staff-list-identity">{item.avatar ? <img className="staff-list-avatar" src={mediaUrl(apiUrl, item.avatar)} alt="" onError={(event) => { event.currentTarget.hidden = true }} /> : <span className="staff-list-avatar" aria-hidden="true">{item.name.trim().charAt(0).toLocaleUpperCase('vi-VN')}</span>}<strong>{item.name}</strong></span> },
    { id: 'email', header: t('EMAIL'), sortable: true, cell: (item) => item.email },
    { id: 'phone', header: t('SĐT'), cell: (item) => item.phone || '—' },
    { id: 'role', header: t('VAI TRÒ'), cell: (item) => t(adminRoleLabels[item.role] ?? item.role) },
    { id: 'status', header: t('TRẠNG THÁI'), sortable: true, cell: (item) => item.status === 'active' ? t('Hoạt động') : t('Đã khóa') },
    { id: 'presence', header: t('HIỆN DIỆN'), cell: (item) => <span className={`staff-presence staff-presence-${item.presence}`}><i aria-hidden="true" />{item.presence === 'available' ? t("Sẵn sàng") : item.presence === 'busy' ? t("Bận") : item.presence === 'away' ? t("Vắng mặt") : t("Ẩn")}</span> },
    { id: 'last', header: t('ĐĂNG NHẬP GẦN NHẤT'), sortKey: 'last_login_at', sortable: true, cell: (item) => item.last_login_at ? formatDateTime(item.last_login_at) : '—' },
    { id: 'created', header: t('NGÀY TẠO'), sortKey: 'created_at', sortable: true, cell: (item) => formatDateTime(item.created_at) },
    { id: 'action', header: t('THAO TÁC'), cell: (item) => <div className="staff-row-actions">{canViewPerformance && item.role !== 'super_admin' && <a className="secondary" href={`/staff/${item.id}/performance`}>{t("Hiệu suất")}</a>}{item.role === 'super_admin' || (item.role === 'admin' && !canManageAdminRole) ? <span>{t("Chỉ chủ cửa hàng có thể quản lý tài khoản này")}</span> : <RowActionsMenu label={t('Thao tác nhân viên {{name}}', { name: item.name })} actions={[{ id: 'edit', label: t("Sửa"), onSelect: () => openForm(item) }, { id: 'toggle-lock', label: item.status === 'blocked' ? t("Mở khóa") : t("Khóa"), disabled: item.id === currentUserId || staffAction.isPending, destructive: item.status !== 'blocked', onSelect: () => setConfirmingAction({ staff: item, action: item.status === 'blocked' ? 'unblock' : 'block' }) }, ...(canManageSecurity ? [{ id: 'password-reset', label: t("Gửi đặt lại mật khẩu"), onSelect: () => void sendPasswordReset(item) }] : []), ...(canManageSecurity && item.two_factor_enabled_at ? [{ id: 'reset-2fa', label: t("Đặt lại 2FA"), disabled: item.id === currentUserId || staffAction.isPending, destructive: true, onSelect: () => setConfirmingAction({ staff: item, action: 'reset-2fa', reason: '' }) }] : []), ...(canManageSecurity ? [{ id: 'revoke-sessions', label: t("Đăng xuất mọi thiết bị"), disabled: item.id === currentUserId || staffAction.isPending, onSelect: () => setConfirmingAction({ staff: item, action: 'sessions' }) }] : []), ...(canViewActivityLogs ? [{ id: 'activity', label: t("Nhật ký"), href: `/activity-logs?activity_logs_user_id=${item.id}` }] : []), { id: 'delete', label: t("Xóa"), disabled: remove.isPending, destructive: true, onSelect: () => setDeleting(item) }]} />}</div> },
  ]
  const invitationColumns: DataTableColumn<Invitation>[] = [
    { id: 'email', header: t('EMAIL'), sortable: true, cell: (item) => item.email },
    { id: 'role', header: t('VAI TRÒ'), cell: (item) => t(adminRoleLabels[item.role] ?? item.role) },
    { id: 'invited_by', header: t('NGƯỜI MỜI'), cell: (item) => item.invited_by ?? t('Tài khoản đã xóa') },
    { id: 'expires_at', header: t('HẾT HẠN'), sortable: true, cell: (item) => formatDateTime(item.expires_at) },
    { id: 'status', header: t('TRẠNG THÁI'), cell: (item) => item.expired ? t('Đã hết hạn') : t('Đang chờ') },
    { id: 'actions', header: t('THAO TÁC'), cell: (item) => <RowActionsMenu label={t('Thao tác lời mời {{email}}', { email: item.email })} actions={[{ id: 'resend', label: t("Gửi lại"), disabled: invitationActionPending !== null, onSelect: () => void invitationAction(item.id, 'resend') }, { id: 'revoke', label: t("Thu hồi"), disabled: invitationActionPending !== null, destructive: true, onSelect: () => void invitationAction(item.id, 'revoke') }]} /> },
  ]
  const approvalColumns: DataTableColumn<Approval>[] = [
    { id: 'name', header: t('KHÁCH HÀNG'), sortable: true, cell: (item) => <span><strong>{item.name}</strong><small>{item.phone ?? t("Chưa có số điện thoại")}</small></span> },
    { id: 'email', header: t('EMAIL ĐÃ XÁC MINH'), sortable: true, cell: (item) => item.email },
    { id: 'email_verified_at', header: t('XÁC MINH LÚC'), cell: (item) => formatDateTime(item.email_verified_at) },
    { id: 'created_at', header: t('NGÀY ĐĂNG KÝ'), sortable: true, cell: (item) => formatDateTime(item.created_at) },
    { id: 'role', header: t('VAI TRÒ CẤP'), cell: (item) => <select aria-label={t('Vai trò cấp cho {{email}}', { email: item.email })} value={approvalRoles[item.id] ?? 'customer'} onChange={(event) => setApprovalRoles((state) => ({ ...state, [item.id]: event.target.value as ApprovalRole }))}><option value="customer">{t("Khách hàng")}</option>{adminRoleOptions.filter((role) => canManageAdminRole || role.value !== 'admin').map((role) => <option key={role.value} value={role.value}>{t(role.label)}</option>)}</select> },
    { id: 'actions', header: t('THAO TÁC'), cell: (item) => <RowActionsMenu label={t('Xét duyệt nhân viên {{email}}', { email: item.email })} actions={[{ id: 'approve', label: t("Duyệt"), onSelect: () => void decide(item.id, 'approve').catch((error: unknown) => setNotice(error instanceof Error ? t(error.message) : t("Không duyệt được."))) }, { id: 'reject', label: t("Từ chối"), destructive: true, onSelect: () => void decide(item.id, 'reject').catch((error: unknown) => setNotice(error instanceof Error ? t(error.message) : t("Không từ chối được."))) }]} /> },
  ]
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const statusCounts = list.data?.meta.status_counts
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => { setUrlValue(key, ''); if (key === 'q') { setUrlValue('invitation_page', '1'); setUrlValue('approval_page', '1') } } })
  if (q) addFilterChip('q', t('Tìm: {{query}}', { query: q }), 'q')
  if (status) addFilterChip('status', t(status === 'active' ? 'Hoạt động' : 'Bị khóa'), 'status')
  if (role) addFilterChip('role', t('Vai trò {{role}}', { role: t(adminRoleLabels[role] ?? role) }), 'role')
  if (lastLoginFrom) addFilterChip('last_login_from', t('Đăng nhập từ {{date}}', { date: lastLoginFrom }), 'last_login_from')
  if (lastLoginTo) addFilterChip('last_login_to', t('Đăng nhập đến {{date}}', { date: lastLoginTo }), 'last_login_to')
  const setStaffSearch = (value: string) => { setUrlValue('q', value); setUrlValue('invitation_page', '1'); setUrlValue('approval_page', '1') }
  return <section id="staff-security" className="panel reference-page"><div className="panel-heading"><div><h2>{t("Nhân viên và phân quyền")}</h2><p>{t("Cấp vai trò quản trị hoặc nhân viên. Tài khoản bị khóa không thể đăng nhập.")}</p></div><div className="reference-actions"><button className="primary" onClick={() => setInviteOpen(true)}>{t("Mời nhân viên")}</button><button className="secondary" onClick={() => openForm()}>{t("Thêm tài khoản trực tiếp")}</button></div></div>{notice && <p role="status" className="reference-notice">{t(notice)}</p>}
     <nav className="staff-status-tabs" aria-label={t("Lọc trạng thái nhân viên")}>{[['all', t("Tất cả")], ['active', t("Hoạt động")], ['pending', t("Chờ duyệt")], ['blocked', t("Bị khóa")], ['invited', t("Đã mời")]].map(([value, label]) => <button key={value} type="button" className={view === value ? 'primary' : 'secondary'} aria-pressed={view === value} onClick={() => { setUrlValue('view', value); if (value === 'active' || value === 'blocked') setUrlValue('status', value); else setUrlValue('status', ''); if (value === 'pending' || value === 'invited') { setUrlValue('role', ''); setUrlValue('last_login_from', ''); setUrlValue('last_login_to', '') } }}>{label} <b>{statusCounts?.[value] ?? "—"}</b></button>)}</nav>
     {view === 'pending' && <><FilterBar hasFilters={Boolean(q)} onClear={() => clearFilters(['q', 'approval_page'])} activeFilters={q ? [{ id: 'q', label: `Tìm: ${q}`, onRemove: () => setStaffSearch('') }] : []}><input aria-label={t("Tìm tài khoản chờ duyệt")} placeholder={t("Tên, email hoặc số điện thoại")} value={q} onChange={(event) => setStaffSearch(event.target.value)} /></FilterBar></>}
     {view === 'invited' && <><FilterBar hasFilters={Boolean(q)} onClear={() => clearFilters(['q', 'invitation_page'])} activeFilters={q ? [{ id: 'q', label: t('Tìm email: {{query}}', { query: q }), onRemove: () => setStaffSearch('') }] : []}><input aria-label={t("Tìm lời mời")} placeholder={t("Email được mời")} value={q} onChange={(event) => setStaffSearch(event.target.value)} /></FilterBar></>}
     {!['pending', 'invited'].includes(view) && <>
      <FilterBar hasFilters={Boolean(q || status || role || lastLoginFrom || lastLoginTo)} onClear={() => clearFilters(['q', 'status', 'role', 'last_login_from', 'last_login_to', 'invitation_page', 'approval_page'])} activeFilters={activeFilterChips}><input aria-label={t("Tìm nhân viên")} placeholder={t("Tên, email hoặc SĐT")} value={q} onChange={(event) => setStaffSearch(event.target.value)} /></FilterBar>
      <AdvancedFilterSheet filters={{ role, last_login_from: lastLoginFrom, last_login_to: lastLoginTo }} defaults={{ role: '', last_login_from: '', last_login_to: '' }} activeCount={[role, lastLoginFrom, lastLoginTo].filter(Boolean).length} onApply={(values) => { setUrlValue('role', values.role); setUrlValue('last_login_from', values.last_login_from); setUrlValue('last_login_to', values.last_login_to); setUrlValue('page', '1') }}>
        {(draft, setValue) => <>
          <label>{t("Vai trò")}<select value={draft.role} onChange={(event) => setValue('role', event.target.value)}><option value="">{t("Tất cả vai trò")}</option>{adminRoleOptions.map((item) => <option key={item.value} value={item.value}>{t(item.label)}</option>)}</select></label>
          <label>{t("Đăng nhập từ")}<input aria-label={t("Lần đăng nhập từ ngày")} type="date" value={draft.last_login_from} max={draft.last_login_to || undefined} onChange={(event) => setValue('last_login_from', event.target.value)} /></label>
          <label>{t("Đăng nhập đến")}<input aria-label={t("Lần đăng nhập đến ngày")} type="date" value={draft.last_login_to} min={draft.last_login_from || undefined} onChange={(event) => setValue('last_login_to', event.target.value)} /></label>
        </>}
      </AdvancedFilterSheet>
      
      <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? t(list.error.message) : null} onRetry={() => void list.refetch()} noResults={Boolean(q || status || role || lastLoginFrom || lastLoginTo)} emptyTitle={t("Chưa có nhân viên")} emptyDescription={t("Thêm tài khoản để cấp quyền vận hành.")} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} />
     </>}
    {inviteOpen && <form className="reference-form" onSubmit={(event) => { event.preventDefault(); invite.mutate() }}><div className="panel-heading"><h3>{t("Mời nhân viên qua email")}</h3><button type="button" className="secondary" onClick={closeInvite}>{t("Đóng")}</button></div><div className="reference-form-grid"><FormField id="staff-invite-email" label={t("Email")} required><input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /></FormField><FormField id="staff-invite-role" label={t("Vai trò")} required><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as AssignableAdminRole)}>{adminRoleOptions.filter((role) => canManageAdminRole || role.value !== 'admin').map((role) => <option key={role.value} value={role.value}>{t(role.label)}</option>)}</select></FormField><FormField id="staff-invite-expiry" label={t("Thời hạn liên kết")}><select value={inviteHours} onChange={(event) => setInviteHours(event.target.value)}><option value="24">{t("24 giờ")}</option><option value="48">{t("48 giờ")}</option><option value="168">{t("7 ngày")}</option></select></FormField><FormField id="staff-invite-message" label={t("Lời nhắn")}><input maxLength={1000} value={inviteMessage} onChange={(event) => setInviteMessage(event.target.value)} /></FormField></div>{invite.error && <p role="alert" className="reference-error">{t(invite.error.message)}</p>}<div className="reference-form-actions"><button type="button" className="secondary" onClick={closeInvite}>{t("Hủy")}</button><button className="primary" disabled={invite.isPending || !inviteEmail.trim()}>{invite.isPending ? t("Đang gửi…") : t("Gửi lời mời")}</button></div></form>}
    {(view === 'all' || view === 'invited') && <section className="panel"><div className="panel-heading"><div><h3>{t("Lời mời đang chờ")}</h3><p>{t("Liên kết hết hạn được gửi lại sẽ nhận mã mới.")}</p></div></div><DataTable columns={invitationColumns} rows={invitations.data?.data ?? []} rowKey={(item) => item.id} loading={invitations.isLoading} error={invitations.error instanceof Error ? t(invitations.error.message) : null} onRetry={() => void invitations.refetch()} noResults={Boolean(queryQ.trim())} emptyTitle={t("Chưa có lời mời đang chờ")} emptyDescription={t("Lời mời qua email sẽ xuất hiện tại đây.")} page={invitations.data?.meta.current_page ?? invitationPage} pageCount={invitations.data?.meta.last_page ?? 1} totalRows={invitations.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('invitation_page', String(nextPage))} sortBy={invitationSort.startsWith('-') ? invitationSort.slice(1) : invitationSort} sortDirection={invitationSort.startsWith('-') ? 'desc' : 'asc'} onSortChange={(key, direction) => { setUrlValue('invitation_sort', direction === 'none' ? '-created_at' : direction === 'desc' ? `-${key}` : key); setUrlValue('invitation_page', '1') }} /></section>}
    {(view === 'all' || view === 'pending') && <section className="panel"><div className="panel-heading"><div><h3>{t("Tài khoản chờ phê duyệt")}</h3><p>{t("Chỉ hiển thị người đã xác minh email.")}</p></div></div><DataTable columns={approvalColumns} rows={approvals.data?.data ?? []} rowKey={(item) => item.id} loading={approvals.isLoading} error={approvals.error instanceof Error ? t(approvals.error.message) : null} onRetry={() => void approvals.refetch()} noResults={Boolean(queryQ.trim())} emptyTitle={t("Không có tài khoản chờ duyệt")} emptyDescription={t("Đăng ký đã xác minh email sẽ xuất hiện tại đây.")} page={approvals.data?.meta.current_page ?? approvalPage} pageCount={approvals.data?.meta.last_page ?? 1} totalRows={approvals.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('approval_page', String(nextPage))} sortBy={approvalSort.startsWith('-') ? approvalSort.slice(1) : approvalSort} sortDirection={approvalSort.startsWith('-') ? 'desc' : 'asc'} onSortChange={(key, direction) => { setUrlValue('approval_sort', direction === 'none' ? '-created_at' : direction === 'desc' ? `-${key}` : key); setUrlValue('approval_page', '1') }} /></section>}
    {open && <form className="reference-form" onSubmit={form.handleSubmit((values) => { if (!editing && !values.password) { form.setError('password', { type: 'required', message: t("Vui lòng nhập hoặc tạo mật khẩu tạm thời.") }); return } save.mutate(values) })}><div className="panel-heading"><h3>{editing ? t("Sửa tài khoản") : t("Thêm nhân viên")}</h3><button type="button" className="secondary" onClick={closeForm}>{t("Đóng")}</button></div><div className="reference-form-grid"><FormField id="staff-name" label={t("Họ tên")} required error={fieldError(form.formState.errors.name?.message)}><input {...form.register('name')} /></FormField><FormField id="staff-email" label={t("Email")} required error={fieldError(form.formState.errors.email?.message)}><input type="email" {...form.register('email')} /></FormField><FormField id="staff-phone" label={t("SĐT")} error={fieldError(form.formState.errors.phone?.message)}><input {...form.register('phone')} /></FormField><div className="staff-password-field"><FormField id="staff-password" label={editing ? t("Mật khẩu mới (để trống nếu giữ nguyên)") : t("Mật khẩu tạm thời")} required={!editing} error={fieldError(form.formState.errors.password?.message)}><input type="password" autoComplete="new-password" {...form.register('password')} /></FormField><button type="button" className="secondary" onClick={() => form.setValue('password', createTemporaryPassword(), { shouldDirty: true, shouldValidate: true })}>{t("Tạo ngẫu nhiên")}</button></div><FormField id="staff-role" label={t("Vai trò")} required error={fieldError(form.formState.errors.role?.message)}><select {...form.register('role')}>{adminRoleOptions.filter((role) => canManageAdminRole || role.value !== 'admin').map((role) => <option key={role.value} value={role.value}>{t(role.label)}</option>)}</select></FormField><FormField id="staff-status" label={t("Trạng thái")} required error={fieldError(form.formState.errors.status?.message)}><select {...form.register('status')} disabled={editing?.id === currentUserId}><option value="active">{t("Hoạt động")}</option><option value="blocked">{t("Khóa tài khoản")}</option></select></FormField></div>{save.error && <p role="alert" className="reference-error">{t(save.error.message)}</p>}<div className="reference-form-actions"><button type="button" className="secondary" onClick={closeForm}>{t("Hủy")}</button><button className="primary" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t("Đang lưu...") : t("Lưu")}</button></div></form>}
    <ConfirmDialog open={Boolean(deleting)} title={t("Xóa tài khoản nhân viên?")} description={deleting ? <>{t("Tài khoản")}{' '}<strong>{deleting.name}</strong> {' '}{t("sẽ bị xóa và các phiên đăng nhập sẽ bị thu hồi.")}</> : ''} confirmLabel={t("Xóa tài khoản")} onConfirm={() => { if (deleting) remove.mutate(deleting) }} onOpenChange={(next) => { if (!next && !remove.isPending) setDeleting(null) }} busy={remove.isPending} />
    <ConfirmDialog open={Boolean(confirmingAction)} title={confirmingAction?.action === 'reset-2fa' ? t("Đặt lại xác thực hai bước cho nhân viên?") : confirmingAction?.action === 'sessions' ? t("Đăng xuất nhân viên khỏi mọi thiết bị?") : confirmingAction?.action === 'block' ? t("Khóa tài khoản nhân viên?") : t("Mở khóa tài khoản nhân viên?")} description={confirmingAction ? <><strong>{confirmingAction.staff.name}</strong>{confirmingAction.action === 'reset-2fa' ? <><p>{t(" sẽ phải đăng nhập lại và thiết lập 2FA mới.")}</p><label htmlFor="staff-reset-2fa-reason">{t("Lý do (ít nhất 5 ký tự)")}</label><textarea id="staff-reset-2fa-reason" minLength={5} maxLength={1000} required value={confirmingAction.reason ?? ''} onChange={(event) => setConfirmingAction((current) => current ? { ...current, reason: event.target.value } : current)} /></> : confirmingAction.action === 'sessions' ? t(" sẽ cần đăng nhập lại trên mọi thiết bị.") : confirmingAction.action === 'block' ? t(" sẽ không thể đăng nhập cho đến khi được mở khóa.") : t(" sẽ có thể đăng nhập lại.")}</> : ''} confirmLabel={confirmingAction?.action === 'reset-2fa' ? t("Đặt lại 2FA") : confirmingAction?.action === 'sessions' ? t("Đăng xuất mọi thiết bị") : confirmingAction?.action === 'block' ? t("Khóa tài khoản") : t("Mở khóa")} onConfirm={() => { if (confirmingAction) void performConfirmingAction() }} onOpenChange={(next) => { if (!next && !staffAction.isPending) setConfirmingAction(null) }} busy={staffAction.isPending} confirmDisabled={confirmingAction?.action === 'reset-2fa' && (confirmingAction.reason?.trim().length ?? 0) < 5} />
    <SudoModeDialog apiUrl={apiUrl} accessToken={accessToken} open={sudoOpen} requiresTwoFactor={sudoStatus.data?.requires_two_factor ?? false} onOpenChange={setSudoOpen} onAuthenticated={(expiresAt) => { setSudoExpiresAt(expiresAt); client.setQueryData(['account-sudo-mode'], { active: true, expires_at: expiresAt, requires_two_factor: sudoStatus.data?.requires_two_factor ?? false }); if (confirmingAction?.action === 'reset-2fa') staffAction.mutate(confirmingAction) }} />
  </section>
}
