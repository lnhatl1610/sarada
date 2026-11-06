import { adminApiFetch } from '../../lib/admin-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { adminRoleDescriptions, adminRoleLabels } from './roles'

type Props = { apiUrl: string; accessToken: string; canEdit?: boolean }
type Permission = { id: number; name: string }
type Role = { id: number; name: string; label: string; description: string; users_count: number; system: boolean; permissions: Permission[] }
type RolesResponse = { data?: Role[]; permissions?: Permission[]; message?: string }

export function RolePermissionMatrix({ apiUrl, accessToken, canEdit = false }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<number, number[]>>({})
  const [roleToConfirm, setRoleToConfirm] = useState<Role | null>(null)
  const roles = useQuery({
    queryKey: ['admin', 'staff', 'roles'],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/staff/roles`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as RolesResponse
      if (!response.ok || !body.data || !body.permissions) throw new Error(body.message ?? t('Không tải được ma trận quyền.'))
      return body
    },
    enabled: Boolean(accessToken),
  })
  const save = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number; permissions: number[] }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/staff/roles/${roleId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions }) })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không lưu được quyền của vai trò.'))
      return roleId
    },
    onSuccess: (roleId) => {
      setDrafts((current) => { const next = { ...current }; delete next[roleId]; return next })
      setRoleToConfirm(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff', 'roles'] })
    },
  })
  if (roles.isLoading) return <section className="panel reference-page"><div className="shared-skeleton" role="status" aria-label={t('Đang tải ma trận quyền')} /></section>
  if (roles.error || !roles.data) return <section className="panel reference-page" role="alert"><p>{roles.error instanceof Error ? t(roles.error.message) : t('Không tải được ma trận quyền.')}</p><button className="secondary" onClick={() => void roles.refetch()}>{t('Thử lại')}</button></section>
  const permissions = roles.data.permissions ?? []
  const roleRows = roles.data.data ?? []
  const permissionIds = permissions.map((permission) => permission.id)
  const selectedFor = (role: Role) => drafts[role.id] ?? role.permissions.map((permission) => permission.id)
  const changed = (role: Role) => {
    const selected = [...selectedFor(role)].sort((a, b) => a - b)
    const original = role.permissions.map((permission) => permission.id).sort((a, b) => a - b)
    return selected.length !== original.length || selected.some((id, index) => id !== original[index])
  }
  const togglePermissionForRoles = (permissionId: number) => {
    const editableRoles = roleRows.filter((role) => role.name !== 'super_admin')
    const remove = editableRoles.every((role) => selectedFor(role).includes(permissionId))
    setDrafts((current) => Object.fromEntries(editableRoles.map((role) => {
      const selected = current[role.id] ?? role.permissions.map((permission) => permission.id)
      return [role.id, remove ? selected.filter((id) => id !== permissionId) : [...new Set([...selected, permissionId])]]
    })))
  }
  const permissionActionLabels: Record<string, string> = { view: 'Xem', create: 'Tạo', update: 'Cập nhật', delete: 'Xóa', 'update status': 'Cập nhật trạng thái', adjust: 'Điều chỉnh', manage: 'Quản lý', security: 'Bảo mật', moderate: 'Kiểm duyệt', assign: 'Phân công', health: 'Sức khỏe', backup: 'Sao lưu', schedule: 'Lên lịch', share: 'Chia sẻ', 'view performance': 'Xem hiệu suất' }
  const labelForPermission = (name: string) => name.split('.').map((part) => t(permissionActionLabels[part.replaceAll('_', ' ')] ?? part.replaceAll('_', ' '))).join(' · ')
  const moduleLabels: Record<string, string> = { orders: 'Đơn hàng', products: 'Sản phẩm', inventory: 'Kho hàng', customers: 'Khách hàng', users: 'Nhân viên', reviews: 'Đánh giá', coupons: 'Khuyến mãi', banners: 'Banner', content: 'Nội dung', reports: 'Báo cáo', settings: 'Cài đặt', tags: 'Thẻ', collections: 'Bộ sưu tập' }
  const roleLabel = (role: Role) => t(role.label || adminRoleLabels[role.name] || role.name)
  const roleDescription = (role: Role) => t(role.description || adminRoleDescriptions[role.name] || 'Vai trò hệ thống.')
  const formatCount = (value: number) => new Intl.NumberFormat(i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'vi').format(value)
  const permissionGroups = [...new Set(permissions.map((permission) => permission.name.split('.')[0]))]

  return <section className="panel reference-page">
    <div className="section-heading"><div><h2>{t('Ma trận vai trò và quyền')}</h2><p className="muted">{t('Quyền được API kiểm tra ở mỗi thao tác. Thay đổi có hiệu lực ở yêu cầu tiếp theo.')}</p></div></div>
    <div className="staff-role-cards">{roleRows.map((role) => <article key={role.id}><strong>{roleLabel(role)}</strong><span>{formatCount(role.users_count)} {t('nhân viên')}</span><p>{roleDescription(role)}</p></article>)}</div>
    <div className="table-wrap"><table><thead><tr><th>{t('Phân hệ / quyền')}</th>{roleRows.map((role) => <th key={role.id}><span>{roleLabel(role)}</span>{canEdit && role.name !== 'super_admin' && <label className="role-column-select"><input type="checkbox" aria-label={t('Chọn tất cả quyền cho {{role}}', { role: roleLabel(role) })} checked={selectedFor(role).length === permissionIds.length} onChange={(event) => setDrafts((current) => ({ ...current, [role.id]: event.target.checked ? permissionIds : [] }))} /> {t('Toàn bộ')}</label>}</th>)}</tr></thead><tbody>{permissionGroups.map((module) => <Fragment key={module}><tr className="role-permission-module"><th scope="rowgroup" colSpan={roleRows.length + 1}>{t(moduleLabels[module] ?? module.replaceAll('_', ' '))}</th></tr>{permissions.filter((permission) => permission.name.split('.')[0] === module).map((permission) => <tr key={permission.id}><td><code>{labelForPermission(permission.name)}</code><small>{permission.name}</small>{canEdit && <button className="link-button role-row-select" type="button" onClick={() => togglePermissionForRoles(permission.id)}>{roleRows.filter((role) => role.name !== 'super_admin').every((role) => selectedFor(role).includes(permission.id)) ? t('Bỏ quyền ở mọi vai trò') : t('Chọn cho mọi vai trò')}</button>}</td>{roleRows.map((role) => { const selected = selectedFor(role); return <td key={role.id}><input aria-label={`${roleLabel(role)}: ${permission.name}`} type="checkbox" checked={selected.includes(permission.id)} disabled={!canEdit || role.name === 'super_admin'} onChange={(event) => setDrafts((current) => ({ ...current, [role.id]: event.target.checked ? [...selected, permission.id] : selected.filter((id) => id !== permission.id) }))} /></td> })}</tr>)}</Fragment>)}</tbody></table></div>
    {canEdit ? <div className="button-row">{roleRows.filter((role) => role.name !== 'super_admin').map((role) => <button key={role.id} className="primary" disabled={save.isPending || !changed(role)} onClick={() => { const removesPermissions = role.permissions.some((permission) => !selectedFor(role).includes(permission.id)); if (role.users_count > 0 && removesPermissions) setRoleToConfirm(role); else save.mutate({ roleId: role.id, permissions: selectedFor(role) }) }}>{t('Lưu {{role}}', { role: roleLabel(role) })}</button>)}</div> : <p className="muted">{t('Chỉ chủ cửa hàng được chỉnh sửa ma trận. Quyền gốc của chủ cửa hàng được bảo vệ.')}</p>}
    <ConfirmDialog open={Boolean(roleToConfirm)} title={t('Thu hồi quyền của vai trò đang có nhân viên?')} description={roleToConfirm ? <>{t('Vai trò')} <strong>{roleLabel(roleToConfirm)}</strong> {t('đang được gán cho {{count}} nhân viên. Các quyền bị bỏ sẽ mất hiệu lực với những tài khoản đó.', { count: formatCount(roleToConfirm.users_count) })}</> : ''} confirmLabel={t('Lưu thay đổi quyền')} onConfirm={() => { if (roleToConfirm) save.mutate({ roleId: roleToConfirm.id, permissions: selectedFor(roleToConfirm) }) }} onOpenChange={(next) => { if (!next && !save.isPending) setRoleToConfirm(null) }} busy={save.isPending} />
    {save.error && <p className="form-error" role="alert">{save.error instanceof Error ? t(save.error.message) : t('Không lưu được quyền.')}</p>}
    {save.isSuccess && <p className="success-text" role="status">{t('Đã lưu ma trận quyền.')}</p>}
  </section>
}
