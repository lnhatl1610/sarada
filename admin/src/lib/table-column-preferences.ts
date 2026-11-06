export type TableColumnOption = { id: string; label: string; hideable: boolean }
export type TableRegistryEntry = { id: string; label: string; columns: TableColumnOption[] }

export function tableRegistryKey(userId: string | number) {
  return `fashion-admin-table-registry:${userId}`
}

export function tableColumnsKey(userId: string | number, tableId: string) {
  return `fashion-admin-table-columns:${userId}:${tableId}`
}

export function readLocalTableColumns(userId: string | number, tableId: string): string[] | null {
  try {
    const value = JSON.parse(localStorage.getItem(tableColumnsKey(userId, tableId)) ?? 'null') as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return Object.entries(value).filter(([, visible]) => visible !== false).map(([id]) => id)
  } catch {
    return null
  }
}

export function clearLocalTableColumns(userId: string | number, tableId: string) {
  try { localStorage.removeItem(tableColumnsKey(userId, tableId)) } catch { /* Storage can be unavailable in private browsing. */ }
}

export function readTableRegistry(userId: string | number): TableRegistryEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(tableRegistryKey(userId)) ?? '[]') as unknown
    if (!Array.isArray(value)) return []
    return value.filter((item): item is TableRegistryEntry => Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string' && Array.isArray(item.columns)))
  } catch {
    return []
  }
}

export function registerAdminTable(userId: string | number, table: TableRegistryEntry) {
  try {
    const current = readTableRegistry(userId).filter((entry) => entry.id !== table.id)
    localStorage.setItem(tableRegistryKey(userId), JSON.stringify([...current, table].slice(-100)))
  } catch { /* The table still works when browser storage is unavailable. */ }
}
