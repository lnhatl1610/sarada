import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import { createApiResponseError } from '../../components/shared/api-validation'

type StockRow = { variant_id: number; sku: string; product_name: string; color: string | null; size: string | null; quantity: number; reserved: number; available: number }
type Movement = { id: number; sku: string; product_name: string; type: string; quantity_change: number; stock_after: number; note: string; actor_name: string | null; created_at: string }
async function request<T>(url: string, token: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json().catch(() => ({})) as T & { message?: string }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

export function StoreLocationInventoryPanel({ apiUrl, accessToken, storeId, storeName }: { apiUrl: string; accessToken: string; storeId: number; storeName: string }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [adjustments, setAdjustments] = useState<Record<number, { change: string; reason: string }>>({})
  const [notice, setNotice] = useState('')
  const stock = useQuery({ queryKey: ['admin', 'store-inventory', storeId], queryFn: () => request<{ data: StockRow[] }>(`${apiUrl}/admin/stores/${storeId}/inventory`, accessToken, t('Không tải được tồn kho cửa hàng.')) })
  const movements = useQuery({ queryKey: ['admin', 'store-inventory-movements', storeId], queryFn: () => request<{ data: Movement[] }>(`${apiUrl}/admin/stores/${storeId}/inventory/movements?per_page=10`, accessToken, t('Không tải được lịch sử tồn kho.')) })
  const adjust = useMutation({
    mutationFn: (input: { variant_id: number; quantity_change: number; reason: string }) => request(`${apiUrl}/admin/stores/${storeId}/inventory/adjust`, accessToken, t('Không điều chỉnh được tồn kho.'), { method: 'POST', body: JSON.stringify(input) }),
    onError: (error) => setNotice(error instanceof Error ? error.message : t('Không điều chỉnh được tồn kho.')),
    onSuccess: async (_result, input) => {
      setAdjustments((values) => ({ ...values, [input.variant_id]: { change: '', reason: '' } }))
      setNotice(t('Đã cập nhật tồn kho cửa hàng.'))
      await Promise.all([client.invalidateQueries({ queryKey: ['admin', 'store-inventory', storeId] }), client.invalidateQueries({ queryKey: ['admin', 'store-inventory-movements', storeId] })])
    },
  })
  const value = (id: number) => adjustments[id] ?? { change: '', reason: '' }

  return <section className="panel" aria-labelledby="store-stock-title">
    <div className="panel-heading"><div><h2 id="store-stock-title">{t('Tồn kho · {{name}}', { name: storeName })}</h2><p>{t('Tồn tại cửa hàng được quản lý riêng với kho giao hàng online.')}</p></div></div>
    {notice && <p role="status">{notice}</p>}
    {stock.isLoading ? <p role="status">{t('Đang tải tồn kho…')}</p> : stock.isError ? <p role="alert">{stock.error instanceof Error ? stock.error.message : t('Không tải được tồn kho.')}</p> : <div className="table-scroll"><table><thead><tr><th>{t('Sản phẩm')}</th><th>SKU</th><th>{t('Tồn / Đang giữ / Khả dụng')}</th><th>{t('Điều chỉnh')}</th></tr></thead><tbody>{stock.data?.data.map((row) => {
      const draft = value(row.variant_id)
      return <tr key={row.variant_id}><td>{row.product_name}<small>{[row.color, row.size].filter(Boolean).join(' · ')}</small></td><td>{row.sku}</td><td>{row.quantity} / {row.reserved} / {row.available}</td><td><form onSubmit={(event) => { event.preventDefault(); adjust.mutate({ variant_id: row.variant_id, quantity_change: Number(draft.change), reason: draft.reason }) }}><input aria-label={t('Thay đổi số lượng')} type="number" step="1" required value={draft.change} onChange={(event) => setAdjustments((items) => ({ ...items, [row.variant_id]: { ...value(row.variant_id), change: event.target.value } }))} /><input aria-label={t('Lý do điều chỉnh')} required minLength={3} maxLength={500} value={draft.reason} onChange={(event) => setAdjustments((items) => ({ ...items, [row.variant_id]: { ...value(row.variant_id), reason: event.target.value } }))} /><button className="secondary" disabled={adjust.isPending || !Number(draft.change) || draft.reason.trim().length < 3}>{t('Cập nhật')}</button></form></td></tr>
    })}</tbody></table></div>}
    <h3>{t('Lịch sử điều chỉnh và giao dịch')}</h3>
    {movements.isLoading ? <p role="status">{t('Đang tải lịch sử…')}</p> : movements.isError ? <p role="alert">{movements.error instanceof Error ? movements.error.message : t('Không tải được lịch sử.')}</p> : movements.data?.data.length ? <ul>{movements.data.data.map((movement) => <li key={movement.id}>{movement.created_at} · {movement.product_name} ({movement.sku}) · {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} → {movement.stock_after} · {movement.note}{movement.actor_name ? ` · ${movement.actor_name}` : ''}</li>)}</ul> : <p>{t('Chưa có giao dịch tồn kho tại cửa hàng này.')}</p>}
  </section>
}
