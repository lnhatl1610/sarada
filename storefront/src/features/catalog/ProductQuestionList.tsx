import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { components } from '../../types/api'
import { getApiErrorMessage } from '../../lib/http'
import { fetchProductQuestions, submitProductQuestion } from './catalog-api'
import './ProductQuestionList.css'

const questionSchema = z.object({ question: z.string().trim().min(8, 'Câu hỏi cần có ít nhất 8 ký tự.').max(2000, 'Câu hỏi không được quá 2.000 ký tự.') })
type QuestionValues = z.infer<typeof questionSchema>
type Question = components['schemas']['StorefrontProductQuestion']

export function ProductQuestionList({ slug, accessToken, authenticated, enabled }: { slug: string; accessToken: string; authenticated: boolean; enabled: boolean }) {
  const [page, setPage] = useState(1)
  const form = useForm<QuestionValues>({ resolver: zodResolver(questionSchema), defaultValues: { question: '' } })
  const query = useQuery({
    queryKey: ['catalog', 'product-questions', slug, page],
    queryFn: ({ signal }) => fetchProductQuestions(slug, page, signal),
    enabled,
  })
  const mutation = useMutation({
    mutationFn: (values: QuestionValues) => submitProductQuestion(slug, accessToken, values.question.trim()),
    onSuccess: () => form.reset(),
  })

  const questions = query.data?.data ?? []
  const meta = query.data?.meta
  const returnTo = `/products/${encodeURIComponent(slug)}`

  return <section className="product-question-list" aria-label="Hỏi đáp sản phẩm">
    <h2>Hỏi đáp sản phẩm</h2>
    {authenticated ? <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <label htmlFor="product-question-input">Bạn muốn hỏi gì về sản phẩm này?</label>
      <textarea id="product-question-input" rows={4} maxLength={2000} aria-invalid={Boolean(form.formState.errors.question)} aria-describedby={form.formState.errors.question ? 'product-question-error' : 'product-question-hint'} {...form.register('question')} />
      <small id="product-question-hint">Câu hỏi của bạn chỉ hiển thị sau khi cửa hàng phản hồi.</small>
      {form.formState.errors.question && <small id="product-question-error" className="field-error" role="alert">{form.formState.errors.question.message}</small>}
      {mutation.isError && <p className="auth-error" role="alert">{getApiErrorMessage(mutation.error, 'Không gửi được câu hỏi. Vui lòng thử lại.')}</p>}
      {mutation.isSuccess && <p className="question-success" role="status">Câu hỏi đã được gửi đến cửa hàng và sẽ hiển thị sau khi có phản hồi.</p>}
      <button className="button dark" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Đang gửi…' : 'Gửi câu hỏi'}</button>
    </form> : <p> <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Đăng nhập</Link> để gửi câu hỏi cho cửa hàng.</p>}
    {query.isPending ? <p role="status">Đang tải câu hỏi…</p> : query.isError ? <div role="alert"><p>Chưa tải được câu hỏi.</p><button className="text-button" type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : questions.length ? <>
      <div className="product-question-answers">{questions.map((question: Question) => <article key={question.id}>
        <h3>{question.question}</h3>
        <small>{question.customer_name} · {new Date(question.created_at).toLocaleDateString('vi-VN')}</small>
        <div><strong>{question.answered_by || 'Cửa hàng'}</strong><p>{question.answer}</p></div>
      </article>)}</div>
      {meta && meta.last_page > 1 && <nav className="product-question-pagination" aria-label="Trang câu hỏi"><button type="button" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)}>Trang trước</button><span aria-live="polite" aria-atomic="true">Trang {meta.current_page} / {meta.last_page} · {meta.total} câu hỏi</span><button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)}>Trang sau</button></nav>}
    </> : <p>Chưa có câu hỏi nào được cửa hàng trả lời.</p>}
  </section>
}
