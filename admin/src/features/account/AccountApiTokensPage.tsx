import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { SudoModeDialog } from './SudoModeDialog'
import { adminApiFetch } from '../../lib/admin-api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useTranslation } from 'react-i18next'

type ApiToken = {
  id: number
  name: string
  permissions: string[]
  created_at: string
  last_used_at: string | null
  last_used_ip: string | null
  expires_at: string | null
}
type TokenList = { tokens: ApiToken[]; permissions: string[]; requires_two_factor: boolean; allow_non_expiring: boolean }
type ApiResponse<T> = { data?: T; message?: string; code?: string; errors?: Record<string, string[]> }

const permissionLabels: Record<string, string> = {
  'products.view': 'Xem sản phẩm', 'products.create': 'Tạo sản phẩm', 'products.update': 'Cập nhật sản phẩm', 'products.delete': 'Xóa sản phẩm',
  'orders.view': 'Xem đơn hàng', 'orders.manage': 'Quản lý đơn hàng', 'inventory.view': 'Xem tồn kho', 'inventory.adjust': 'Điều chỉnh tồn kho',
  'customers.view': 'Xem khách hàng', 'customers.manage': 'Quản lý khách hàng', 'reviews.moderate': 'Duyệt đánh giá', 'coupons.manage': 'Quản lý mã giảm giá',
  'content.manage': 'Quản lý nội dung', 'settings.manage': 'Quản lý cài đặt', 'users.manage': 'Quản lý nhân sự',
  'system.health': 'Xem tình trạng hệ thống',
}
const date = (value: string | null, locale: string, t: (key: string) => string) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('Chưa sử dụng')

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as ApiResponse<T>
  if (!response.ok) { const error = new Error(Object.values(body.errors ?? {})[0]?.[0] ?? body.message ?? 'Không thể xử lý yêu cầu.') as Error & { code?: string }; error.code = body.code; throw error }
  return body.data as T
}

export function AccountApiTokensPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [expiresIn, setExpiresIn] = useState('30')
  const [sudoOpen, setSudoOpen] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now())
    const timeout = window.setTimeout(updateCurrentTime, 0)
    const interval = window.setInterval(updateCurrentTime, 60_000)
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [])


  const list = useQuery({
    queryKey: ['account-api-tokens'],
    queryFn: async () => readResponse<TokenList>(await adminApiFetch(`${apiUrl}/account/tokens`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })),
  })
  const sudoStatus = useQuery({
    queryKey: ['account-sudo-mode'],
    queryFn: async () => readResponse<{ active: boolean; expires_at: string | null; requires_two_factor: boolean }>(await adminApiFetch(`${apiUrl}/account/sudo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })),
  })
  const requireSudo = (action: () => void) => {
    const expiresAt = sudoStatus.data?.expires_at
    if (sudoStatus.data?.active && expiresAt && new Date(expiresAt).getTime() > Date.now()) action()
    else { pendingAction.current = action; setSudoOpen(true) }
  }
  const create = useMutation({
    mutationFn: async () => readResponse<{ token: string }>(await adminApiFetch(`${apiUrl}/account/tokens`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), permissions, expires_in: expiresIn === 'never' ? 'never' : Number(expiresIn) }),
    })),
    onSuccess: async (data) => {
      setCreatedToken(data.token); setName(''); setPermissions([]); setNotice(t('Đã tạo token. Sao chép token ngay; token sẽ không hiển thị lại sau khi đóng thông báo này.')); setError('')
      await client.invalidateQueries({ queryKey: ['account-api-tokens'] })
    },
    onError: (cause: unknown) => { if ((cause as Error & { code?: string })?.code === 'RECENT_AUTH_REQUIRED') { pendingAction.current = () => create.mutate(); setError(''); setSudoOpen(true) } else setError(cause instanceof Error ? t(cause.message) : t('Không thể tạo token.')) },
  })
  const revoke = useMutation({
    mutationFn: async () => {
      if (!revokeTarget) return
      await readResponse<unknown>(await adminApiFetch(`${apiUrl}/account/tokens/${revokeTarget.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      }))
    },
    onSuccess: async () => { setRevokeTarget(null); setNotice(t('Đã thu hồi token.')); setError(''); await client.invalidateQueries({ queryKey: ['account-api-tokens'] }) },
    onError: (cause: unknown) => { if ((cause as Error & { code?: string })?.code === 'RECENT_AUTH_REQUIRED') { pendingAction.current = () => revoke.mutate(); setError(''); setSudoOpen(true) } else setError(cause instanceof Error ? t(cause.message) : t('Không thể thu hồi token.')) },
  })

  const togglePermission = (permission: string) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])
  const copyToken = async () => {
    if (!createdToken) return
    try { await navigator.clipboard.writeText(createdToken); setNotice(t('Đã sao chép token vào clipboard.')) }
    catch { setNotice(t('Không thể sao chép tự động. Hãy chọn và sao chép token đang hiển thị.')) }
  }

  return <div className="account-api-tokens-page">
    <header className="page-header"><div><h1>{t('Mã truy cập API cá nhân')}</h1><p>{t('Tạo token riêng cho script hoặc dịch vụ cần truy cập API quản trị.')}</p></div></header>
    {notice && <div className="admin-state-card" role="status"><p>{notice}</p>{createdToken && <div className="api-token-plaintext"><code>{createdToken}</code><button type="button" className="secondary" onClick={() => void copyToken()}>{t('Sao chép token')}</button><button type="button" className="link-button" onClick={() => setCreatedToken(null)}>{t('Đã lưu, đóng')}</button></div>}</div>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    {list.isPending && <p role="status">{t('Đang tải danh sách token…')}</p>}
    {list.isError && <div className="admin-state-card" role="alert"><p>{t(list.error.message)}</p><button type="button" className="secondary" onClick={() => void list.refetch()}>{t('Thử lại')}</button></div>}
    {list.data && <>
      <section className="panel account-api-token-create">
        <div className="panel-heading"><div><h2>{t('Tạo token mới')}</h2><p>{t('Token chỉ xuất hiện một lần. Mỗi tài khoản được tạo tối đa 10 token.')}</p></div></div>
        <form className="account-api-token-form" onSubmit={(event) => { event.preventDefault(); setError(''); requireSudo(() => create.mutate()) }}>
          <label>{t('Tên token')}<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required placeholder={t('Ví dụ: Đồng bộ tồn kho')} /></label>
          <fieldset><legend>{t('Quyền được cấp')}</legend><p>{t('Chọn đúng các quyền mà tích hợp cần. Token không thể có quyền cao hơn tài khoản hiện tại.')}</p><div className="api-token-permission-grid">{list.data.permissions.map((permission) => <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)} />{t(permissionLabels[permission] ?? permission)}<small>{permission}</small></label>)}</div>{permissions.length === 0 && <small>{t('Chọn ít nhất một quyền.')}</small>}</fieldset>
          <label>{t('Thời hạn')}<select value={expiresIn} onChange={(event) => setExpiresIn(event.target.value)}><option value="7">{t('7 ngày')}</option><option value="30">{t('30 ngày')}</option><option value="90">{t('90 ngày')}</option>{list.data.allow_non_expiring && <option value="never">{t('Không hết hạn')}</option>}</select></label>
                    <button type="submit" disabled={create.isPending || !permissions.length || list.data.tokens.length >= 10}>{create.isPending ? t('Đang tạo…') : t('Tạo API token')}</button>
        </form>
      </section>
      <section className="panel account-api-token-list">
        <div className="panel-heading"><div><h2>{t('API token của bạn')}</h2><p>{t('{{count}}/10 token', { count: list.data.tokens.length })}</p></div></div>
        {!list.data.tokens.length ? <div className="no-orders compact">{t('Bạn chưa tạo API token nào.')}</div> : <div className="table-wrap"><table><thead><tr><th>{t('TÊN')}</th><th>{t('QUYỀN')}</th><th>{t('TẠO LÚC')}</th><th>{t('SỬ DỤNG GẦN NHẤT')}</th><th>{t('IP GẦN NHẤT')}</th><th>{t('HẾT HẠN')}</th><th>{t('THAO TÁC')}</th></tr></thead><tbody>{list.data.tokens.map((token) => <tr key={token.id}><td><strong>{token.name}</strong></td><td>{token.permissions.map((permission) => <span className="api-token-scope" key={permission}>{t(permissionLabels[permission] ?? permission)}</span>)}</td><td>{date(token.created_at, i18n.language, t)}</td><td>{date(token.last_used_at, i18n.language, t)}</td><td>{token.last_used_ip ?? '—'}</td><td>{token.expires_at ? `${currentTime > 0 && new Date(token.expires_at).getTime() <= currentTime ? t('Đã hết hạn · ') : ''}${date(token.expires_at, i18n.language, t)}` : t('Không hết hạn')}</td><td><button type="button" className="link-button danger" onClick={() => { setError(''); setRevokeTarget(token) }}>{t('Thu hồi')}</button></td></tr>)}</tbody></table></div>}
      </section>
    </>}
    <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => { if (!open) setRevokeTarget(null) }}>
      <DialogContent className="api-token-revoke-dialog">
        {error && revokeTarget && <p className="account-settings-error" role="alert">{error}</p>}
        <DialogHeader><DialogTitle>{t('Thu hồi token?')}</DialogTitle><DialogDescription>{t('Ứng dụng đang dùng “{{name}}” sẽ mất quyền truy cập ngay lập tức.', { name: revokeTarget?.name })}</DialogDescription></DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); requireSudo(() => revoke.mutate()) }}>
          <DialogFooter><button type="button" className="secondary" onClick={() => setRevokeTarget(null)}>{t('Hủy')}</button><button type="submit" className="danger" disabled={revoke.isPending}>{revoke.isPending ? t('Đang thu hồi…') : t('Thu hồi token')}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <SudoModeDialog apiUrl={apiUrl} accessToken={accessToken} open={sudoOpen} requiresTwoFactor={sudoStatus.data?.requires_two_factor ?? list.data?.requires_two_factor ?? false} onOpenChange={setSudoOpen} onAuthenticated={(expiresAt) => { client.setQueryData(['account-sudo-mode'], { active: true, expires_at: expiresAt, requires_two_factor: list.data?.requires_two_factor ?? false }); const action = pendingAction.current; pendingAction.current = null; action?.() }} />
  </div>
}
