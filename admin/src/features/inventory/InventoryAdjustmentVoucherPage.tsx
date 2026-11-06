import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../../InventoryControls.css'
import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'

type InventoryVariant = { variant_id: number; sku: string; product_name: string; barcode: string | null; color_name: string | null; size_name: string | null; quantity: number; reserved: number }
type AdjustmentRow = InventoryVariant & { quantity_change: string }
type BatchDetail = { id: number; code: string; reason_category: string; note: string | null; created_at: string; creator_name: string | null; rows: { sku: string; product_name: string; quantity_change: number; stock_after: number; note: string | null }[] }
type Props = { apiUrl: string; accessToken: string; batchId?: number }

export function InventoryAdjustmentVoucherPage({ apiUrl, accessToken, batchId }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const term = useDebouncedValue(search.trim())
  const [rows, setRows] = useState<AdjustmentRow[]>([])
  const [reasonCategory, setReasonCategory] = useState('stocktake')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{ code: string; rows: { sku: string | null; quantity_change: number; stock_after: number }[] } | null>(null)

  const variantsQuery = useQuery({
    queryKey: ['admin', 'inventory-adjustment-search', term],
    enabled: Boolean(accessToken && term.length >= 2),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: term, per_page: '20' })
      const response = await adminApiFetch(`${apiUrl}/admin/inventory?${params}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: InventoryVariant[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không tìm được biến thể trong kho.'))
      return body.data ?? []
    },
  })
  const batchQuery = useQuery({
    queryKey: ['admin', 'inventory-adjustment-batch', batchId],
    enabled: Boolean(accessToken && batchId),
    queryFn: async ({ signal }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/adjustments/${batchId}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: BatchDetail; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? t('Không tải được phiếu điều chỉnh.'))
      return body.data
    },
  })

  const add = (variant: InventoryVariant) => {
    setRows((current) => current.some((row) => row.variant_id === variant.variant_id) || current.length >= 100 ? current : [...current, { ...variant, quantity_change: '' }])
    setError('')
  }
  const isValid = rows.length > 0 && rows.every((row) => {
    const change = Number(row.quantity_change)
    return Number.isInteger(change) && change !== 0 && Math.abs(change) <= 100000 && row.quantity + change >= row.reserved
  })
  if (batchId) {
    const batch = batchQuery.data
    const reason = ({ stocktake: t('Kiểm kê'), damage: t('Hàng hỏng'), loss: t('Thất thoát'), other: t('Khác') } as Record<string, string>)[batch?.reason_category ?? ''] ?? batch?.reason_category
    return <section className="panel reference-page inventory-adjustment-voucher"><div className="panel-heading"><div><h2>{t('Phiếu {{code}}', { code: batch?.code ?? `#${batchId}` })}</h2><p>{t('Chi tiết điều chỉnh tồn kho đã ghi nhận.')}</p></div><a className="secondary" href="/inventory/movements">{t('Quay lại lịch sử')}</a></div>{batchQuery.isPending && <p role="status">{t('Đang tải phiếu…')}</p>}{batchQuery.error instanceof Error && <p className="reference-error" role="alert">{batchQuery.error.message}<button className="secondary" type="button" onClick={() => void batchQuery.refetch()}>{t('Thử lại')}</button></p>}{batch && <><dl className="inventory-adjustment-batch-meta"><div><dt>{t('Thời gian')}</dt><dd>{formatDateTime(batch.created_at)}</dd></div><div><dt>{t('Người tạo')}</dt><dd>{batch.creator_name ?? t('Tài khoản đã xóa')}</dd></div><div><dt>{t('Lý do')}</dt><dd>{reason}</dd></div><div><dt>{t('Ghi chú')}</dt><dd>{batch.note || '—'}</dd></div></dl><div className="table-wrap"><table><thead><tr><th>{t('SKU / Sản phẩm')}</th><th>{t('Biến động')}</th><th>{t('Tồn sau')}</th><th>{t('Ghi chú')}</th></tr></thead><tbody>{batch.rows.map((row, index) => <tr key={`${row.sku}-${index}`}><td><strong>{row.sku}</strong><br />{row.product_name}</td><td>{row.quantity_change > 0 ? '+' : ''}{row.quantity_change}</td><td>{row.stock_after}</td><td>{row.note}</td></tr>)}</tbody></table></div></>}</section>
  }

  const submit = async () => {
    if (!isValid || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/adjustments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason_category: reasonCategory, note: note.trim() || null, rows: rows.map((row) => ({ variant_id: row.variant_id, quantity_change: Number(row.quantity_change) })) }),
      })
      const body = await response.json() as { data?: { code: string; rows: { sku: string | null; quantity_change: number; stock_after: number }[] }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? t('Không thể lưu phiếu điều chỉnh.'))
      setReceipt(body.data)
      setRows([])
      setSearch('')
      setNote('')
      setConfirming(false)
    } catch (cause) {
      setConfirming(false)
      setError(cause instanceof Error ? cause.message : t('Không thể lưu phiếu điều chỉnh.'))
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel reference-page inventory-adjustment-voucher">
    <div className="panel-heading"><div><h2>{t('Phiếu điều chỉnh tồn')}</h2><p>{t('Gom nhiều biến thể vào một phiếu. Mỗi biến động được kiểm tra và ghi nhận cùng giao dịch.')}</p></div><a className="secondary" href="/inventory">{t('Quay lại kho')}</a></div>
    {receipt && <div className="reference-notice" role="status"><strong>{t('Đã ghi phiếu {{code}}.', { code: receipt.code })}</strong><ul>{receipt.rows.map((row, index) => <li key={`${row.sku}-${index}`}>{t('{{sku}}: {{change}} · tồn sau {{stock}}', { sku: row.sku, change: `${row.quantity_change > 0 ? '+' : ''}${row.quantity_change}`, stock: row.stock_after })}</li>)}</ul><button className="secondary" type="button" onClick={() => setReceipt(null)}>{t('Tạo phiếu tiếp')}</button></div>}
    <FormField id="adjustment-search" label={t('Thêm SKU hoặc sản phẩm')} hint={t('Nhập ít nhất 2 ký tự. Có thể thêm tối đa 100 biến thể.')}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('SKU, barcode hoặc tên sản phẩm')} /></FormField>
    {variantsQuery.isFetching && <p role="status">{t('Đang tìm biến thể…')}</p>}
    {variantsQuery.error instanceof Error && <p className="reference-error" role="alert">{variantsQuery.error.message}<button className="secondary" type="button" onClick={() => void variantsQuery.refetch()}>{t('Thử lại')}</button></p>}
    {(variantsQuery.data?.length ?? 0) > 0 && <div className="inventory-manual-results" aria-label={t('Kết quả tìm biến thể')}>{variantsQuery.data?.filter((variant) => !rows.some((row) => row.variant_id === variant.variant_id)).map((variant) => <button key={variant.variant_id} type="button" disabled={rows.length >= 100} onClick={() => add(variant)}><strong>{variant.sku}</strong><span>{variant.product_name} · {[variant.color_name, variant.size_name].filter(Boolean).join(' / ') || t('Biến thể mặc định')}</span><small>{t('Tồn {{quantity}} · Đang giữ {{reserved}}', { quantity: variant.quantity, reserved: variant.reserved })}</small></button>)}</div>}
    {rows.length > 0 && <div className="table-wrap"><table><thead><tr><th>{t('SKU / Sản phẩm')}</th><th>{t('Tồn')}</th><th>{t('Đang giữ')}</th><th>{t('Điều chỉnh')}</th><th>{t('Tồn sau')}</th><th /></tr></thead><tbody>{rows.map((row) => {
      const change = Number(row.quantity_change)
      const valid = Number.isInteger(change) && change !== 0 && Math.abs(change) <= 100000 && row.quantity + change >= row.reserved
      return <tr key={row.variant_id}><td><strong>{row.sku}</strong><br />{row.product_name}<small>{[row.color_name, row.size_name].filter(Boolean).join(' / ')}</small></td><td>{row.quantity}</td><td>{row.reserved}</td><td><input aria-label={t('Điều chỉnh số lượng SKU {{sku}}', { sku: row.sku })} type="number" step="1" min="-100000" max="100000" value={row.quantity_change} aria-invalid={Boolean(row.quantity_change) && !valid} onChange={(event) => setRows((current) => current.map((item) => item.variant_id === row.variant_id ? { ...item, quantity_change: event.target.value } : item))} />{row.quantity_change && !valid && <small role="alert">{t('Số lượng phải khác 0 và tồn sau không thấp hơn số đang giữ.')}</small>}</td><td>{valid ? row.quantity + change : '—'}</td><td><button className="secondary" type="button" aria-label={t('Xóa SKU {{sku}} khỏi phiếu', { sku: row.sku })} onClick={() => setRows((current) => current.filter((item) => item.variant_id !== row.variant_id))}>{t('Bỏ')}</button></td></tr>
    })}</tbody></table></div>}
    <div className="reference-form-grid inventory-adjustment-voucher-reason"><FormField id="adjustment-reason" label={t('Lý do điều chỉnh')} required><select value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}><option value="stocktake">{t('Kiểm kê')}</option><option value="damage">{t('Hàng hỏng')}</option><option value="loss">{t('Thất thoát')}</option><option value="other">{t('Khác')}</option></select></FormField><FormField id="adjustment-note" label={t('Ghi chú chung')} hint={t('Tối đa 500 ký tự.')}><textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></FormField></div>
    {error && <p className="reference-error" role="alert">{error}</p>}
    <div className="reference-form-actions"><button className="primary" type="button" disabled={!isValid || busy} onClick={() => setConfirming(true)}>{t('Xem lại và tạo phiếu ({{count}})', { count: rows.length })}</button></div>
    <ConfirmDialog open={confirming} title={t('Tạo phiếu điều chỉnh tồn?')} description={t('Phiếu gồm {{count}} biến thể, lý do {{reason}}. Tất cả dòng phải hợp lệ thì mới được ghi.', { count: rows.length, reason: ({ stocktake: t('kiểm kê'), damage: t('hàng hỏng'), loss: t('thất thoát'), other: t('khác') } as Record<string, string>)[reasonCategory] })} confirmLabel={t('Tạo phiếu')} busy={busy} onConfirm={() => void submit()} onOpenChange={(open) => { if (!open && !busy) setConfirming(false) }} />
  </section>
}
