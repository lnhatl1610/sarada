export type RecentAdminAccount = { name: string; email: string; avatar: string | null }

const storageKey = 'fashion-admin-recent-accounts'

export function readRecentAdminAccounts(): RecentAdminAccount[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is RecentAdminAccount => Boolean(
      item && typeof item === 'object' &&
      typeof item.name === 'string' && typeof item.email === 'string' &&
      (typeof item.avatar === 'string' || item.avatar === null),
    )).slice(0, 3)
  } catch {
    return []
  }
}

export function rememberRecentAdminAccount(account: RecentAdminAccount): RecentAdminAccount[] {
  const normalized = { ...account, name: account.name.trim(), email: account.email.trim().toLocaleLowerCase() }
  if (!normalized.email || !normalized.name) return readRecentAdminAccounts()
  const accounts = [normalized, ...readRecentAdminAccounts().filter((item) => item.email.toLocaleLowerCase() !== normalized.email)].slice(0, 3)
  try {
    localStorage.setItem(storageKey, JSON.stringify(accounts))
  } catch {
    // Recent accounts are a convenience and may be unavailable in private browsing.
  }
  return accounts
}
