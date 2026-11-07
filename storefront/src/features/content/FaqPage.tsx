import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { serializeStorefrontJsonLd } from '../seo/useStorefrontSeo'
import type { components } from '../../types/api'
import { ContactForm } from './ContactForm'
import { FaqHelpfulVote } from './FaqHelpfulVote'
import { fetchStorefrontFaqs } from './faq-api'
import './FaqPage.css'
import './FaqPageHelp.css'
import './FaqPageTopics.css'

export function FaqPage({ customer, contactFormEnabled }: { customer: components['schemas']['StorefrontUser'] | null; contactFormEnabled: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').slice(0, 120)
  const faqs = useQuery({
    queryKey: ['storefront', 'faqs', query],
    queryFn: ({ signal }) => fetchStorefrontFaqs(query, signal),
    staleTime: 5 * 60 * 1000,
  })
  const entries = useMemo(() => faqs.data?.flatMap((group) => group.items.map((item) => ({ ...item, category: group.category }))) ?? [], [faqs.data])
  const structuredData = useMemo(() => entries.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  } : null, [entries])

  const updateQuery = (value: string) => {
    const next = new URLSearchParams(searchParams)
    const normalized = value.slice(0, 120)
    if (normalized) next.set('q', normalized)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return <main className="container subpage faq-page">
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStorefrontJsonLd(structuredData) }} />}
    <header className="faq-page-heading"><p className="eyebrow">HỖ TRỢ · THÔNG TIN</p><h1>Trung tâm trợ giúp</h1><p>Tìm câu trả lời theo chủ đề hoặc gửi yêu cầu để cửa hàng hỗ trợ bạn.</p></header>
    <label className="faq-search">Tìm câu hỏi<input type="search" value={query} maxLength={120} onChange={(event) => updateQuery(event.target.value)} placeholder="Nhập từ khóa cần tìm" /></label>
    {!faqs.isPending && !faqs.isError && faqs.data && faqs.data.length > 0 && <nav className="faq-topic-grid" aria-label="Chủ đề trợ giúp">{faqs.data.slice(0, 6).map((group, index) => <a className="faq-topic-card" href={`#faq-category-${index}`} key={group.category}><span className="faq-topic-number">0{index + 1}</span><span className="faq-topic-copy"><strong>{group.category}</strong><small>{group.items.length} câu trả lời</small></span><span aria-hidden="true" className="faq-topic-arrow">↗</span></a>)}</nav>}
    {faqs.isPending ? <p className="faq-state" role="status">Đang tải câu trả lời…</p>
      : faqs.isError ? <section className="faq-state faq-state-error" role="alert"><p>Chưa tải được câu hỏi thường gặp.</p><button className="button dark" type="button" onClick={() => void faqs.refetch()}>Thử lại</button></section>
        : faqs.data?.length ? <div className="faq-groups">{faqs.data.map((group, index) => <section className="faq-group" key={group.category} aria-labelledby={`faq-category-${index}`}><h2 id={`faq-category-${index}`}>{group.category}</h2><div>{group.items.map((item) => <details className="faq-item" key={item.id}><summary>{item.question}</summary><div className="faq-answer">{item.answer}<FaqHelpfulVote faqId={item.id} /></div></details>)}</div></section>)}</div>
          : <section className="faq-state"><h2>{query ? 'Không tìm thấy câu trả lời phù hợp' : 'Cửa hàng đang cập nhật câu hỏi'}</h2><p>{query ? 'Thử từ khóa khác hoặc liên hệ cửa hàng nếu bạn cần hỗ trợ thêm.' : 'Hiện chưa có câu hỏi thường gặp được xuất bản.'}</p>{query && <button className="link-button" type="button" onClick={() => updateQuery('')}>Xóa từ khóa tìm kiếm</button>}</section>}
    <p className="faq-contact-hint">Chưa tìm thấy thông tin? <a href="/contact">Liên hệ cửa hàng</a>.</p>
    <section className="faq-help-request" aria-labelledby="faq-help-request-title">
      <h2 id="faq-help-request-title">Cần hỗ trợ thêm?</h2>
      <p>Gửi câu hỏi cho cửa hàng; thông tin bạn cung cấp chỉ được dùng để phản hồi yêu cầu này.</p>
      {contactFormEnabled
        ? <details className="faq-help-request__details"><summary>Gửi yêu cầu hỗ trợ</summary><ContactForm customer={customer} /></details>
        : <p role="status">Biểu mẫu đang tạm thời chưa khả dụng. <a href="/contact">Xem thông tin liên hệ</a>.</p>}
    </section>
  </main>
}
