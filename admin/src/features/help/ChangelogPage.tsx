import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_API_BASE_URL } from '../../lib/api-base'
import { useTranslation } from 'react-i18next'
import '../../HelpExtras.css'
import notes from './changelog.md?raw'

type Entry = { version: string; title: string; notes: string[] }
type Combined = { appVersion: string; lastSeen: string | null }
const apiBase = ADMIN_API_BASE_URL

function parseChangelog(source: string): Entry[] {
  const entries: Entry[] = []
  let current: Entry | null = null
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      if (current) entries.push(current)
      const heading = line.slice(3).trim()
      const [version, ...title] = heading.split(' — ')
      current = { version, title: title.join(' — ') || version, notes: [] }
    } else if (current && line.startsWith('- ')) current.notes.push(line.slice(2))
  }
  if (current) entries.push(current)
  return entries
}

export function ChangelogPage({ userId }: { userId?: number }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const entries = useMemo(() => parseChangelog(notes), [])
  const query = useQuery({
    queryKey: ['admin-changelog', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Combined> => {
      const [infoResponse, preferencesResponse] = await Promise.all([
        adminApiFetch(`${apiBase}/admin/app-info`, { headers: { Accept: 'application/json' } }),
        adminApiFetch(`${apiBase}/account/preferences`, { headers: { Accept: 'application/json' } }),
      ])
      const info = await infoResponse.json().catch(() => ({})) as { data?: { app_version?: string }; message?: string }
      const preferences = await preferencesResponse.json().catch(() => ({})) as { data?: Record<string, { last_seen_version?: string }> }
      if (!infoResponse.ok || !preferencesResponse.ok || !info.data) throw new Error(info.message ?? t('Không tải được thông tin phiên bản.'))
      return { appVersion: info.data.app_version || '0.0.0', lastSeen: preferences.data?.admin_changelog?.last_seen_version ?? null }
    },
  })
  const markSeen = useMutation({
    mutationFn: async (version: string) => {
      const response = await adminApiFetch(`${apiBase}/account/preferences`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_changelog', value: { last_seen_version: version } }) })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể lưu trạng thái đã xem.'))
      return version
    },
    onSuccess: (version) => { client.setQueryData<Combined>(['admin-changelog', userId], (old) => old ? { ...old, lastSeen: version } : old); void client.invalidateQueries({ queryKey: ['admin-account-menu-summary', userId] }) },
  })
  const currentVersion = query.data?.appVersion
  const unread = Boolean(currentVersion && query.data?.lastSeen !== currentVersion)
  const displayEntries = entries.map((entry) => entry.version === 'current' ? { ...entry, version: currentVersion ?? 'current' } : entry)

  return <section className="admin-help-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Trợ giúp')}</p><h1>{t('Có gì mới')}</h1><p>{t('Lịch sử cập nhật của trang quản trị Sarada.')}</p></div>{unread && <Button disabled={markSeen.isPending} onClick={() => markSeen.mutate(currentVersion!)}>{t('Đánh dấu phiên bản hiện tại đã xem')}</Button>}</header>
    {query.isPending && <p role="status">{t('Đang tải phiên bản…')}</p>}{query.isError && <p role="alert">{query.error.message}</p>}{markSeen.isError && <p role="alert">{markSeen.error.message}</p>}
    {!query.isPending && !query.isError && <div className="changelog-entries">{displayEntries.map((entry) => <article className="admin-help-article changelog-entry" key={entry.version}><header><div><p className="eyebrow">{t('Phiên bản {{version}}{{current}}', { version: entry.version, current: entry.version === currentVersion ? t(' · Đang cài đặt') : '' })}</p><h2>{entry.title}</h2></div>{unread && entry.version === currentVersion && <span className="changelog-new">{t('Mới')}</span>}</header><ul>{entry.notes.map((note, index) => <li key={`${entry.version}-${index}`}>{note.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, partIndex) => { const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/); return match ? <a key={partIndex} href={match[2]}>{match[1]}</a> : part })}</li>)}</ul></article>)}</div>}
  </section>
}
