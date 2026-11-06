import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { components } from '../../types/api'
import { adminApiFetch } from '../../lib/admin-api'
import { createApiResponseError } from '../../components/shared/api-validation'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import './PromotionNotificationsPage.css'

type Campaign = components['schemas']['StorefrontPromotionCampaign']
type Input = components['schemas']['StorefrontPromotionCampaignInput']
type ListResponse = components['schemas']['StorefrontPromotionCampaignListEnvelope']
type SendResponse = components['schemas']['StorefrontPromotionCampaignEnvelope']

async function request<T>(url: string, token: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json().catch(() => ({})) as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

const campaignSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề thông báo.').max(120, 'Tiêu đề tối đa 120 ký tự.'),
  message: z.string().trim().min(1, 'Nhập nội dung thông báo.').max(1000, 'Nội dung tối đa 1.000 ký tự.'),
  href: z.string().trim().min(1, 'Nhập đường dẫn ưu đãi.').max(255).regex(/^\/(?!\/)[^\s\\]*$/, 'Chỉ dùng đường dẫn nội bộ bắt đầu bằng /.'),
})

const campaignStatusLabel: Record<Campaign['status'], string> = {
  queued: 'Đang chờ gửi',
  sending: 'Đang gửi',
  sent: 'Đã đưa vào hàng đợi gửi',
  sent_with_errors: 'Đã gửi một phần',
  failed: 'Không gửi được',
}

export function PromotionNotificationsPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const form = useForm<Input>({ defaultValues: { title: '', message: '', href: '/sale' }, resolver: zodResolver(campaignSchema) })
  const query = useQuery({
    queryKey: ['admin', 'storefront-promotion-campaigns', page],
    queryFn: () => request<ListResponse>(`${apiUrl}/admin/storefront-promotion-campaigns?page=${page}&per_page=20`, accessToken, t('Không tải được lịch sử gửi thông báo ưu đãi.')),
    enabled: Boolean(accessToken),
    refetchInterval: (current) => current.state.data?.data.some((campaign) => campaign.status === 'queued' || campaign.status === 'sending') ? 4000 : false,
  })
  const send = useMutation({
    mutationFn: (payload: Input) => request<SendResponse>(`${apiUrl}/admin/storefront-promotion-campaigns`, accessToken, t('Không thể gửi chiến dịch ưu đãi.'), { method: 'POST', body: JSON.stringify(payload) }),
    onError: (error) => setNotice(error instanceof Error ? error.message : t('Không thể gửi chiến dịch ưu đãi.')),
    onSuccess: async (response) => {
      setConfirmOpen(false)
      setNotice(response.message || t('Chiến dịch đã được đưa vào hàng đợi gửi.'))
      form.reset({ title: '', message: '', href: '/sale' })
      setPage(1)
      await client.invalidateQueries({ queryKey: ['admin', 'storefront-promotion-campaigns'] })
    },
  })
  const campaigns = query.data?.data ?? []
  const meta = query.data?.meta

  return <div className="promotion-notifications">
    {notice && <p className="promotion-notifications__notice" role="status">{notice}</p>}
    <section className="panel" aria-labelledby="promotion-campaign-form-title">
      <div className="panel-heading"><div><h2 id="promotion-campaign-form-title">{t('Soạn thông báo ưu đãi')}</h2><p>{t('Tài khoản khách hàng nhận theo kênh đã bật. Email chỉ gửi tới người đã đồng ý nhận newsletter.')}</p></div></div>
      <form noValidate onSubmit={form.handleSubmit(() => { setNotice(''); setConfirmOpen(true) })}>
        <div className="promotion-notifications__form">
          <FormField label={t('Tiêu đề')} required error={form.formState.errors.title?.message}><input maxLength={120} {...form.register('title')} /></FormField>
          <FormField label={t('Nội dung')} required error={form.formState.errors.message?.message}><textarea rows={4} maxLength={1000} {...form.register('message')} /></FormField>
          <FormField label={t('Đường dẫn nội bộ')} required error={form.formState.errors.href?.message}><input maxLength={255} placeholder="/sale" {...form.register('href')} /></FormField>
        </div>
        <div className="promotion-notifications__actions"><button className="primary" type="submit" disabled={send.isPending}>{t('Xem lại và gửi')}</button></div>
      </form>
    </section>

    <section className="panel" aria-labelledby="promotion-campaign-history-title">
      <div className="panel-heading"><div><h2 id="promotion-campaign-history-title">{t('Lịch sử chiến dịch')}</h2><p>{t('{{count}} chiến dịch', { count: meta?.total ?? 0 })}</p></div></div>
      {query.isPending ? <p role="status">{t('Đang tải chiến dịch…')}</p> : query.isError ? <p role="alert">{query.error instanceof Error ? query.error.message : t('Không tải được lịch sử chiến dịch.')} <button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p> : campaigns.length === 0 ? <p>{t('Chưa có chiến dịch nào được gửi.')}</p> : <ul className="promotion-notifications__list">{campaigns.map((campaign) => <li key={campaign.id}>
        <div className="promotion-notifications__campaign-heading"><h3>{campaign.title}</h3><span className={`status-badge ${campaign.status === 'sent' ? 'status-badge-success' : campaign.status === 'sent_with_errors' || campaign.status === 'failed' ? 'status-badge-warning' : 'status-badge-neutral'}`}>{campaignStatusLabel[campaign.status]}</span></div>
        <p>{campaign.message}</p><a href={campaign.href}>{campaign.href}</a>
        <p className="promotion-notifications__counts">{t('Đối tượng')}: {campaign.recipient_count} · {t('Đã xếp hàng')}: {campaign.queued_count} · {t('Lỗi xếp hàng')}: {campaign.failed_count} · {t('Đã bỏ qua')}: {campaign.skipped_count}</p>
        <time dateTime={campaign.dispatched_at ?? campaign.created_at ?? undefined}>{campaign.dispatched_at ? new Date(campaign.dispatched_at).toLocaleString('vi-VN') : campaign.created_at ? new Date(campaign.created_at).toLocaleString('vi-VN') : ''}</time>
      </li>)}</ul>}
      {meta && meta.last_page > 1 && <nav className="promotion-notifications__pagination" aria-label={t('Phân trang chiến dịch')}><button className="secondary" type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)}>{t('Trang trước')}</button><span>{t('Trang {{page}} / {{lastPage}}', { page: meta.current_page, lastPage: meta.last_page })}</span><button className="secondary" type="button" disabled={page >= meta.last_page || query.isFetching} onClick={() => setPage((value) => value + 1)}>{t('Trang sau')}</button></nav>}
    </section>

    <ConfirmDialog open={confirmOpen} title={t('Gửi thông báo ưu đãi?')} description={<><p>{t('Chiến dịch sẽ được gửi nền tới khách hàng và người đăng ký nhận tin. Email chỉ tới địa chỉ có đồng ý tiếp thị.')}</p><strong>{form.getValues('title')}</strong><p>{form.getValues('message')}</p></>} confirmLabel={t('Đưa vào hàng đợi')} destructive={false} busy={send.isPending} onOpenChange={setConfirmOpen} onConfirm={() => send.mutate(form.getValues())} />
  </div>
}
