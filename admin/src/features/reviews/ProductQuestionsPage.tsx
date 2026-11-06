import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { components } from '../../types/api'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import './ProductQuestionsPage.css'

type Question = components['schemas']['AdminProductQuestion']
type PageSize = 10 | 20 | 50 | 100
type Values = { answer: string }
const answerSchema = z.object({ answer: z.string().trim().min(2, 'Nhập phản hồi ít nhất 2 ký tự.').max(4000, 'Phản hồi không được quá 4.000 ký tự.') })
const statuses = ['pending', 'answered', 'hidden'] as const
type Status = typeof statuses[number]

type Props = { apiUrl: string; accessToken: string; pageSize: PageSize }

async function readError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { message?: string }
  return payload.message || fallback
}

export function ProductQuestionsPage({ apiUrl, accessToken, pageSize }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('pending')
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const queryKey = ['admin', 'product-questions', status, search, page, pageSize] as const
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ status, page: String(page), per_page: String(pageSize) })
      if (search) params.set('q', search)
      const response = await adminApiFetch(`${apiUrl}/admin/product-questions?${params}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(await readError(response, 'Không tải được câu hỏi sản phẩm.'))
      return response.json() as Promise<components['schemas']['AdminProductQuestionPage']>
    },
    enabled: Boolean(accessToken),
  })
  const mutation = useMutation({
    mutationFn: async ({ id, nextStatus, answer }: { id: number; nextStatus: Status; answer?: string }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/product-questions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: nextStatus, ...(answer !== undefined ? { answer } : {}) }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Không cập nhật được câu hỏi.'))
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'product-questions'] }) },
  })

  const questions = query.data?.data ?? []
  const meta = query.data?.meta
  const statusLabels: Record<Status, string> = { pending: t('Chờ trả lời'), answered: t('Đã trả lời'), hidden: t('Đã ẩn') }

  return <section className="panel listing product-questions-page">
    <div className="panel-heading"><div><h2>{t('Hỏi đáp sản phẩm')}</h2><p>{t('Trả lời câu hỏi của khách hàng trước khi hiển thị trên Storefront.')}</p></div></div>
    <div className="review-status-tabs" role="tablist" aria-label={t('Trạng thái câu hỏi')}>
      {statuses.map((nextStatus) => <button key={nextStatus} type="button" role="tab" aria-selected={status === nextStatus} className={status === nextStatus ? 'active' : ''} onClick={() => { setStatus(nextStatus); setPage(1) }}>{statusLabels[nextStatus]}</button>)}
    </div>
    <form className="product-questions-search" onSubmit={(event) => { event.preventDefault(); setSearch(draftSearch.trim()); setPage(1) }}>
      <label htmlFor="product-questions-search">{t('Tìm câu hỏi')}</label>
      <input id="product-questions-search" value={draftSearch} maxLength={160} onChange={(event) => setDraftSearch(event.target.value)} placeholder={t('Nội dung, khách hàng hoặc sản phẩm')} />
      <button type="submit" className="secondary">{t('Tìm kiếm')}</button>
    </form>
    {query.isPending ? <p role="status">{t('Đang tải câu hỏi…')}</p> : query.isError ? <div role="alert"><p>{query.error.message}</p><button type="button" className="secondary" onClick={() => void query.refetch()}>{t('Thử lại')}</button></div> : questions.length ? <div className="product-question-admin-list">
      {questions.map((question) => <AdminQuestionCard key={question.id} question={question} statusLabel={statusLabels[question.status as Status] ?? question.status} busy={mutation.isPending && mutation.variables?.id === question.id} error={mutation.isError && mutation.variables?.id === question.id ? mutation.error.message : ''} onAnswer={(answer) => mutation.mutate({ id: question.id, nextStatus: 'answered', answer })} onStatus={(nextStatus) => mutation.mutate({ id: question.id, nextStatus })} />)}
    </div> : <p className="product-questions-empty">{t('Không có câu hỏi ở trạng thái này.')}</p>}
    {meta && meta.last_page > 1 && <nav className="product-questions-pagination" aria-label={t('Phân trang câu hỏi')}><button type="button" className="secondary" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)}>{t('Trang trước')}</button><span>{t('Trang {{page}} / {{last}} · {{count}} câu hỏi', { page: meta.current_page, last: meta.last_page, count: meta.total })}</span><button type="button" className="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)}>{t('Trang sau')}</button></nav>}
  </section>
}

function AdminQuestionCard({ question, statusLabel, busy, error, onAnswer, onStatus }: { question: Question; statusLabel: string; busy: boolean; error: string; onAnswer: (answer: string) => void; onStatus: (status: Status) => void }) {
  const { t } = useTranslation()
  const form = useForm<Values>({ resolver: zodResolver(answerSchema), defaultValues: { answer: question.answer ?? '' } })

  return <article className="product-question-admin-card">
    <header><div><h3>{question.product.name}</h3><p>{t('Khách hàng: {{name}}', { name: question.customer.name })} · {formatDateTime(question.created_at)}</p></div><span className={`product-question-status is-${question.status}`}>{statusLabel}</span></header>
    <p className="product-question-admin-question">{question.question}</p>
    <form onSubmit={form.handleSubmit((values) => onAnswer(values.answer.trim()))}>
      <label htmlFor={`question-answer-${question.id}`}>{t('Phản hồi công khai')}</label>
      <textarea id={`question-answer-${question.id}`} rows={3} maxLength={4000} aria-invalid={Boolean(form.formState.errors.answer)} aria-describedby={form.formState.errors.answer ? `question-answer-error-${question.id}` : undefined} {...form.register('answer')} />
      {form.formState.errors.answer && <small id={`question-answer-error-${question.id}`} className="field-error" role="alert">{form.formState.errors.answer.message}</small>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="product-question-admin-actions"><button className="primary" type="submit" disabled={busy}>{busy ? t('Đang lưu…') : t('Trả lời và công khai')}</button>{question.status !== 'hidden' && <button className="secondary" type="button" disabled={busy} onClick={() => onStatus('hidden')}>{t('Ẩn câu hỏi')}</button>}{question.status !== 'pending' && <button className="secondary" type="button" disabled={busy} onClick={() => onStatus('pending')}>{t('Chuyển về chờ')}</button>}</div>
    </form>
  </article>
}
