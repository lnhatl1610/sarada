import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../../HelpExtras.css'
import licenses from './third-party-licenses.json'

type Notice = { name: string; version: string; license: string; source: string; url?: string }

export function LicensesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<'all' | 'npm' | 'Composer'>('all')
  const filtered = useMemo(() => (licenses as Notice[]).filter((item) => {
    const matchesText = `${item.name} ${item.license} ${item.version}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    return matchesText && (source === 'all' || item.source === source)
  }), [search, source])
  const npmCount = licenses.filter((item) => item.source === 'npm').length
  const composerCount = licenses.filter((item) => item.source === 'Composer').length

  return <section className="admin-help-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Trợ giúp')}</p><h1>{t('Giấy phép phần mềm bên thứ ba')}</h1><p>{t('Danh sách thư viện và loại giấy phép lấy từ các gói npm và Composer đã cài khi build.')}</p></div></header>
    <p className="license-summary">{t('{{total}} gói · {{npm}} npm · {{composer}} Composer', { total: licenses.length, npm: npmCount, composer: composerCount })}</p>
    <div className="license-filters"><label>{t('Tìm gói hoặc giấy phép')}<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Ví dụ: react, MIT, Laravel')} /></label><label>{t('Nguồn')}<select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="all">{t('Tất cả')}</option><option value="npm">npm</option><option value="Composer">Composer</option></select></label></div>
    {filtered.length === 0 ? <p className="empty-state">{t('Không tìm thấy gói phù hợp.')}</p> : <div className="license-table-wrap"><table className="license-table"><thead><tr><th scope="col">{t('Gói')}</th><th scope="col">{t('Phiên bản')}</th><th scope="col">{t('Giấy phép khai báo')}</th><th scope="col">{t('Nguồn')}</th></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.source}:${item.name}@${item.version}`}><td>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.name}</a> : item.name}</td><td>{item.version}</td><td>{item.license}</td><td>{item.source}</td></tr>)}</tbody></table></div>}
  </section>
}
