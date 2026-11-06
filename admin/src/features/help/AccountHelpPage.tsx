import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import guide from './admin-guide.md?raw'
import englishGuide from './admin-guide.en.md?raw'

type Article = { id: string; category: string; title: string; body: string }
type Props = { page: 'guide' | 'policy' | 'privacy'; userId?: number }

function parseGuide(source: string): Article[] {
  let category = 'Hướng dẫn'
  let title = ''
  let body: string[] = []
  const articles: Article[] = []
  const save = () => { if (title) articles.push({ id: `${category}-${title}`, category, title, body: body.join('\n').trim() }) }
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith('## ')) { save(); title = ''; category = line.slice(3).trim(); body = [] }
    else if (line.startsWith('### ')) { save(); title = line.slice(4).trim(); body = [] }
    else if (!line.startsWith('# ')) body.push(line)
  }
  save()
  return articles
}

const policyItems = [
  ['Sử dụng tài khoản', 'Tài khoản quản trị dành cho nhân viên được phân quyền. Không chia sẻ mật khẩu, mã xác thực hoặc phiên đăng nhập. Mọi thao tác quản trị được ghi nhận theo tài khoản thực hiện.'],
  ['Dữ liệu cá nhân', 'Bạn có thể yêu cầu bản sao dữ liệu trong trang Quyền riêng tư & dữ liệu. Tệp ZIP chỉ tải được bằng liên kết đã ký và tự hết hạn sau bảy ngày. Nhật ký có thể được giữ lại theo thời hạn vận hành và yêu cầu kiểm toán.'],
  ['Hỗ trợ và ảnh đính kèm', 'Ticket chỉ hiển thị với người gửi và nhân viên có quyền hỗ trợ. Tệp ảnh được lưu riêng tư và chỉ tải qua API đã xác thực. Không đính kèm mật khẩu, mã khôi phục hoặc thông tin thanh toán đầy đủ.'],
]

const policyItemsEn = [
  ['Account use', 'Admin accounts are for authorized staff. Do not share passwords, verification codes, or sign-in sessions. Administrative actions are recorded under the account that performed them.'],
  ['Personal data', 'You can request a copy of your data on the Privacy & data page. ZIP files are available only through a signed link and expire after seven days. Logs may be retained according to operational and audit requirements.'],
  ['Support and attachments', 'Tickets are visible only to the sender and staff with support access. Images are stored privately and can only be downloaded through the authenticated API. Do not attach passwords, recovery codes, or full payment details.'],
]

export function AccountHelpPage({ page, userId }: Props) {
  const { t, i18n } = useTranslation()
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language).startsWith('en')
  const articles = useMemo(() => {
    const vietnamese = parseGuide(guide)
    const english = parseGuide(englishGuide).map((article, index) => ({ ...article, id: vietnamese[index]?.id ?? article.id }))
    return { vi: vietnamese, en: english }
  }, [])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vote, setVote] = useState<'yes' | 'no' | null>(null)
  const currentArticles = isEnglish ? articles.en : articles.vi
  const otherArticles = isEnglish ? articles.vi : articles.en
  const filtered = currentArticles.filter((article, index) => {
    const query = search.trim().toLocaleLowerCase(isEnglish ? 'en' : 'vi')
    return !query || `${article.category} ${article.title} ${article.body} ${otherArticles[index]?.category ?? ''} ${otherArticles[index]?.title ?? ''} ${otherArticles[index]?.body ?? ''}`.toLocaleLowerCase().includes(query)
  })
  const selected = filtered.find((article) => article.id === selectedId) ?? filtered[0]
  const title = page === 'guide' ? t('Hướng dẫn sử dụng') : page === 'policy' ? t('Điều khoản sử dụng') : t('Quyền riêng tư')

  function sendVote(value: 'yes' | 'no') {
    if (!selected) return
    try { localStorage.setItem(`fashion-admin-help-vote:${userId ?? 'account'}:${selected.id}`, value) } catch { /* storage may be unavailable */ }
    setVote(value)
  }

  const activePolicyItems = isEnglish ? policyItemsEn : policyItems
  return <section className="admin-help-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Trợ giúp')}</p><h1>{title}</h1><p>{page === 'guide' ? t('Tìm câu trả lời theo từng chức năng quản trị.') : t('Thông tin áp dụng cho tài khoản quản trị Sarada.')}</p></div></header>
    {page === 'guide' ? <>
      <label className="admin-help-search">{t('Tìm trong hướng dẫn')}<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedId(null); setVote(null) }} placeholder={t('Ví dụ: tồn kho, hoàn tiền, 2FA…')} /></label>
      <div className="admin-help-layout"><nav aria-label={t('Mục hướng dẫn')}>{filtered.map((article) => <button type="button" key={article.id} className={selected?.id === article.id ? 'active' : ''} onClick={() => { setSelectedId(article.id); setVote(null) }}><small>{article.category}</small>{article.title}</button>)}{filtered.length === 0 && <p>{t('Không tìm thấy nội dung phù hợp.')}</p>}</nav>
        {selected && <article className="admin-help-article"><p className="eyebrow">{selected.category}</p><h2>{selected.title}</h2>{selected.body.split('\n').filter(Boolean).map((line, index) => line.startsWith('- ') ? <p className="admin-help-bullet" key={index}>• {line.slice(2)}</p> : <p key={index}>{line}</p>)}<footer><span>{t('Nội dung này có hữu ích không?')}</span><button type="button" aria-pressed={vote === 'yes'} onClick={() => sendVote('yes')}>{t('Hữu ích')}</button><button type="button" aria-pressed={vote === 'no'} onClick={() => sendVote('no')}>{t('Chưa hữu ích')}</button>{vote && <small role="status">{t('Đã ghi nhận phản hồi của bạn.')}</small>}</footer></article>}
      </div>
    </> : <div className="admin-help-policy">{activePolicyItems.map(([heading, content]) => <article key={heading}><h2>{heading}</h2><p>{content}</p></article>)}<p>{isEnglish ? <>To view and manage account data, open <a href="/settings/account/privacy">Privacy & data</a>.</> : <>Để xem và quản lý dữ liệu tài khoản, mở <a href="/settings/account/privacy">Quyền riêng tư & dữ liệu</a>.</>}</p></div>}
  </section>
}
