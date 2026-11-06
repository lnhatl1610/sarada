import { adminApiFetch } from './admin-api'

export type AdminExportType = 'customers' | 'products' | 'orders' | 'inventory' | 'activity' | 'report'

function filtersFromSearchParams(params: URLSearchParams): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {}
  params.forEach((value, rawKey) => {
    const key = rawKey.replace(/\[\]$/, '')
    const current = filters[key]
    if (current === undefined) filters[key] = value
    else if (Array.isArray(current)) current.push(value)
    else filters[key] = [current, value]
  })
  return filters
}

export async function enqueueAdminExportWhenLarge({
  apiUrl,
  accessToken,
  type,
  rowCount,
  filters,
}: {
  apiUrl: string
  accessToken: string
  type: AdminExportType
  rowCount: number
  filters: URLSearchParams
}): Promise<boolean> {
  if (rowCount <= 5000) return false

  const response = await adminApiFetch(`${apiUrl}/admin/downloads/exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, filters: filtersFromSearchParams(filters) }),
  })
  const body = await response.json().catch(() => ({})) as { message?: string }
  if (!response.ok) throw new Error(body.message || 'Không thể đưa tệp xuất vào hàng đợi.')
  return true
}
