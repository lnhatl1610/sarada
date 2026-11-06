import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router'
import type { CustomerOrderSummary, TrackedOrder } from './order-types'
import type { CustomerOrderPage, CustomerOrderStatusFilter } from './order-api'
import type { CustomerReviewValues } from './useCustomerOrderActions'
import { formatOrderStatus, formatPaymentMethod, formatPaymentStatus } from './order-status'

const customerOrderStatus = (order: { fulfillment_type?: string; status: string }) => order.fulfillment_type === 'pickup'
  ? order.status === 'shipping' ? 'Sẵn sàng nhận tại cửa hàng' : ['delivered', 'completed'].includes(order.status) ? 'Đã nhận hàng' : formatOrderStatus(order.status)
  : formatOrderStatus(order.status)
import './AccountOrdersPage.css'

const reviewSchema = z.object({
  order_item_id: z.string().min(1, 'Chọn sản phẩm bạn đã mua.').transform(Number),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160, 'Tiêu đề không được quá 160 ký tự.'),
  content: z.string().trim().max(5000, 'Nội dung không được quá 5000 ký tự.'),
  images: z.custom<FileList>().optional().transform((files) => Array.from(files ?? []))
    .refine((files) => files.length <= 5, 'Bạn có thể tải lên tối đa 5 ảnh.')
    .refine((files) => files.every((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)), 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.')
    .refine((files) => files.every((file) => file.size <= 2 * 1024 * 1024), 'Mỗi ảnh không được vượt quá 2 MB.'),
  videos: z.custom<FileList>().optional().transform((files) => Array.from(files ?? []))
    .refine((files) => files.length <= 1, 'Bạn có thể tải lên tối đa 1 video.')
    .refine((files) => files.every((file) => ['video/mp4', 'video/webm'].includes(file.type)), 'Chỉ hỗ trợ video MP4 hoặc WebM.')
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), 'Video không được vượt quá 5 MB.'),
}).refine(({ title, content }) => Boolean(title || content), {
  message: 'Vui lòng nhập tiêu đề hoặc nội dung đánh giá.',
  path: ['content'],
})

type AccountOrdersListPageProps = {
  authenticated: boolean
  orders: CustomerOrderSummary[]
  page: CustomerOrderPage | null
  loading: boolean
  error: string
  formatMoney: (amount: number) => string
  onRetry: () => void
}

const orderStatusTabs: { value: CustomerOrderStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' }, { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' }, { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' }, { value: 'cancelled', label: 'Đã hủy' }, { value: 'returned', label: 'Đổi / trả' },
]

export function AccountOrdersListPage({ authenticated, orders, page, loading, error, formatMoney, onRetry }: AccountOrdersListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStatus = (orderStatusTabs.some((tab) => tab.value === searchParams.get('status')) ? searchParams.get('status') : 'all') as CustomerOrderStatusFilter
  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next)
  }

  return (
    <div className="container subpage account-page">
      <p className="eyebrow">LỊCH SỬ MUA HÀNG</p>
      <h1>Đơn hàng của tôi</h1>
      {!authenticated ? (
        <>
          <p className="auth-lede">Đăng nhập để xem lịch sử mua hàng.</p>
          <Link className="button dark" to="/login">Đăng nhập</Link>
        </>
      ) : loading ? (
        <p className="state" role="status">Đang tải đơn hàng…</p>
      ) : error ? (
        <div className="empty" role="alert">
          <h2>Chưa tải được lịch sử đơn hàng</h2>
          <p>{error}</p>
          <button className="button dark" type="button" onClick={onRetry}>Thử lại</button>
        </div>
      ) : (
        <>
          <nav className="account-order-status-tabs" aria-label="Lọc đơn hàng theo trạng thái">
            {orderStatusTabs.map((tab) => <button key={tab.value} type="button" aria-pressed={activeStatus === tab.value} onClick={() => updateParams({ status: tab.value === 'all' ? '' : tab.value, page: '' })}>{tab.label}</button>)}
          </nav>
          <form className="account-order-filters" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updateParams({ q: String(values.get('q') ?? '').trim(), from: String(values.get('from') ?? ''), to: String(values.get('to') ?? ''), page: '' }) }}>
            <label>Tìm mã đơn hoặc sản phẩm<input name="q" type="search" maxLength={120} defaultValue={searchParams.get('q') ?? ''} /></label>
            <label>Từ ngày<input name="from" type="date" defaultValue={searchParams.get('from') ?? ''} /></label>
            <label>Đến ngày<input name="to" type="date" defaultValue={searchParams.get('to') ?? ''} /></label>
            <button className="button dark" type="submit">Lọc đơn hàng</button>
          </form>
          {page && <p className="account-order-result-count" aria-live="polite">{page.total} đơn hàng</p>}
          {orders.length ? <div className="order-history">
            {orders.map((order) => (
              <Link key={order.code} to={`/account/orders/${encodeURIComponent(order.code)}`}>
                <span><b>{order.code}</b><small>{order.placed_at ? new Date(order.placed_at).toLocaleDateString('vi-VN') : 'Đang cập nhật ngày đặt'}</small></span>
                <span>{customerOrderStatus(order)}</span>
                <strong>{formatMoney(order.grand_total)}</strong>
              </Link>
            ))}
          </div> : page?.total === 0 ? (
            <div className="empty"><h2>{activeStatus === 'all' && !searchParams.get('q') && !searchParams.get('from') && !searchParams.get('to') ? 'Bạn chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng phù hợp'}</h2><p>Thử đổi trạng thái hoặc khoảng thời gian tìm kiếm.</p>{activeStatus !== 'all' || searchParams.size > 0 ? <button className="button secondary" type="button" onClick={() => setSearchParams({})}>Xóa bộ lọc</button> : <Link className="button dark" to="/products">Khám phá sản phẩm</Link>}</div>
          ) : null}
          {page && page.lastPage > 1 && <nav className="account-order-pagination" aria-label="Phân trang đơn hàng"><button className="button secondary" type="button" disabled={loading || page.currentPage <= 1} onClick={() => updateParams({ page: String(page.currentPage - 1) })}>Trang trước</button><span>Trang {page.currentPage} / {page.lastPage}</span><button className="button secondary" type="button" disabled={loading || page.currentPage >= page.lastPage} onClick={() => updateParams({ page: String(page.currentPage + 1) })}>Trang sau</button></nav>}
        </>
      )}
    </div>
  )
}

type AccountOrderDetailPageProps = {
  authenticated: boolean
  order: TrackedOrder | null
  loading: boolean
  error: string
  reviewBusy: boolean
  formatMoney: (amount: number) => string
  onRetry: () => void
  onReorder: (order: TrackedOrder) => Promise<{ added: number; failed: number }>
  onReviewSubmit: (values: CustomerReviewValues) => Promise<string | null>
  onChangeRequest: (order: TrackedOrder) => void
}

export function AccountOrderDetailPage({
  authenticated,
  order,
  loading,
  error,
  reviewBusy,
  formatMoney,
  onRetry,
  onReorder,
  onReviewSubmit,
  onChangeRequest,
}: AccountOrderDetailPageProps) {
  const reviewableItems = order?.items.filter((item) => !item.review_status) ?? []
  const isDeliveredOrder = Boolean(order && ['delivered', 'completed'].includes(order.status))
  const returnDeadline = order?.delivered_at ? Date.parse(order.delivered_at) + 7 * 24 * 60 * 60 * 1000 : Number.NaN
  const hasDeliveryTimestamp = Boolean(order?.delivered_at && Number.isFinite(Date.parse(order.delivered_at)))
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [reorderBusy, setReorderBusy] = useState(false)
  const [reorderMessage, setReorderMessage] = useState('')
  useEffect(() => {
    if (!Number.isFinite(returnDeadline) || currentTime > returnDeadline) return
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), Math.max(0, returnDeadline - currentTime + 1))
    return () => window.clearTimeout(timeout)
  }, [currentTime, returnDeadline])
  const returnWindowOpen = hasDeliveryTimestamp && currentTime <= returnDeadline
  const hasPendingChangeRequest = Boolean(order?.change_requests?.some((request) => request.status === 'pending'))
  const { register, handleSubmit, reset, setError, clearErrors, control, formState: { errors } } = useForm<z.input<typeof reviewSchema>, unknown, CustomerReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { order_item_id: '', rating: 5, title: '', content: '' },
  })
  const selectedImages = useWatch({ control, name: 'images' })
  const selectedVideos = useWatch({ control, name: 'videos' })
  const submitReview = async (values: CustomerReviewValues) => {
    clearErrors('root.server')
    const error = await onReviewSubmit(values)
    if (error) setError('root.server', { message: error })
    else reset()
  }
  const reorder = async () => {
    if (!order || reorderBusy) return
    setReorderBusy(true)
    setReorderMessage('')
    try {
      const result = await onReorder(order)
      if (result.failed > 0) setReorderMessage(`Đã thêm ${result.added} sản phẩm vào giỏ; ${result.failed} sản phẩm không còn khả dụng hoặc chưa thêm được. Giỏ hàng giữ nguyên giá và tồn kho hiện tại.`)
    } finally {
      setReorderBusy(false)
    }
  }

  return (
    <div className="container subpage account-page">
      <Link className="back-link" to="/account/orders">← Quay lại đơn hàng</Link>
      {!authenticated ? (
        <div className="empty"><h1>Đăng nhập để xem đơn hàng</h1><Link className="button dark" to="/login">Đăng nhập</Link></div>
      ) : loading ? (
        <p className="state" role="status">Đang tải thông tin đơn hàng…</p>
      ) : error ? (
        <div className="empty" role="alert">
          <h2>Chưa tải được đơn hàng</h2>
          <p>{error}</p>
          <button className="button dark" type="button" onClick={onRetry}>Thử lại</button>
        </div>
      ) : order ? (
        <section className="account-order-detail">
          <p className="eyebrow">CHI TIẾT ĐƠN HÀNG</p>
          <h1>{order.code}</h1>
          <p className="order-status-label">Ngày đặt: {order.placed_at ? new Date(order.placed_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Đang cập nhật'} · {customerOrderStatus(order)} · {formatPaymentMethod(order.payment_method)} · {formatPaymentStatus(order.payment_status)}</p>
          <div className="account-order-actions">
            <button className="button secondary" type="button" onClick={() => window.print()}>In / lưu đơn hàng</button>
            <Link className="button secondary" to={`/contact?order_code=${encodeURIComponent(order.code)}`}>Liên hệ về đơn hàng</Link>
            <button className="button secondary" type="button" disabled={reorderBusy} onClick={() => void reorder()}>{reorderBusy ? 'Đang kiểm tra và thêm…' : 'Mua lại các sản phẩm'}</button>
            <p>Bản in là tóm tắt đơn hàng, không thay thế hóa đơn VAT.</p>
            {reorderMessage && <p role="status">{reorderMessage}</p>}
          </div>
          <div className="account-order-grid">
            <section>
              <h2>Sản phẩm</h2>
              {order.items.map((item, index) => (
                <div className="account-order-line" key={`${item.sku ?? item.product_name}-${index}`}>
                  <span>{item.product_name}{item.variant_name ? ` · ${item.variant_name}` : ''}<small>{item.sku ? `${item.sku} · ` : ''}Số lượng: {item.quantity}</small>{item.review_status && <small className="order-review-status" role="status">{item.review_status === 'pending' ? 'Đánh giá đang chờ duyệt' : item.review_status === 'approved' ? 'Đánh giá đã được duyệt và hiển thị' : 'Đánh giá chưa được duyệt'}</small>}</span>
                  <b>{formatMoney(item.line_total)}</b>
                </div>
              ))}
              <div className="summary">
                <p><span>Tạm tính</span><b>{formatMoney(order.subtotal ?? order.grand_total)}</b></p>
                <p><span>Giảm giá</span><b>−{formatMoney(order.discount_total ?? 0)}</b></p>
                {order.fulfillment_type !== 'pickup' && <p><span>Vận chuyển</span><b>{formatMoney(order.shipping_fee ?? 0)}</b></p>}
                <hr />
                <p><strong>Tổng cộng</strong><strong>{formatMoney(order.grand_total)}</strong></p>
              </div>
            </section>
            <section>
              <h2>{order.fulfillment_type === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao hàng'}</h2>
              {order.fulfillment_type !== 'pickup' && <p>{order.shipping_method?.name ?? 'Giao hàng theo tỉnh/thành'}{order.shipping_method?.est_days ? ` · Dự kiến ${order.shipping_method.est_days}` : ''}</p>}
              {order.fulfillment_type === 'pickup' && order.pickup_location ? <p><strong>{order.pickup_location.name}</strong><br />{order.pickup_location.address}, {order.pickup_location.ward_name}, {order.pickup_location.province_name}<br />Điện thoại: {order.pickup_location.phone}<br />{order.pickup_location.opening_hours}</p> : <p>{Object.values(order.shipping_address ?? {}).filter(Boolean).join(', ') || 'Thông tin giao hàng được lưu cùng đơn hàng.'}</p>}
              {order.shipments?.map((shipment) => <article className="account-order-shipment" key={shipment.id}>
                <b>{shipment.carrier || 'Đơn vị vận chuyển'} · {formatOrderStatus(shipment.status)}</b>
                <span>{shipment.tracking_code ? `Mã vận đơn: ${shipment.tracking_code}` : 'Mã vận đơn đang được cập nhật'}</span>
                {shipment.shipped_at && <small>Gửi lúc {new Date(shipment.shipped_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</small>}
              </article>)}
              <h2>Lịch sử đơn hàng</h2>
              <ol className="order-history-timeline">
                {order.history?.map((entry, index) => (
                  <li key={`${entry.created_at}-${index}`}>
                    <b>{formatOrderStatus(entry.to_status)}</b>
                    <small>{new Date(entry.created_at).toLocaleString('vi-VN')}{entry.note ? ` · ${entry.note}` : ''}</small>
                  </li>
                ))}
              </ol>
              {order.change_requests?.map((request) => (
                <article className="account-order-change-request" key={request.id}>
                  <b>{request.type === 'return' ? 'Yêu cầu trả hàng' : 'Yêu cầu hủy đơn'} · {request.status === 'pending' ? 'Đang chờ xử lý' : request.status === 'approved' ? 'Đã chấp thuận' : 'Đã từ chối'}</b>
                  <small>{new Date(request.created_at).toLocaleString('vi-VN')} · {request.reason}</small>
                  {request.resolution_note && <small>Phản hồi: {request.resolution_note}</small>}
                </article>
              ))}
              {(order.refunds?.length ?? 0) > 0 && <section className="account-order-refunds" aria-labelledby="account-order-refunds-title">
                <h2 id="account-order-refunds-title">Hoàn tiền</h2>
                <p>Đã hoàn tổng cộng: <b>{formatMoney(order.refund_total ?? 0)}</b></p>
                <ol>{order.refunds?.map((refund, index) => <li key={`${refund.created_at}-${index}`}><span>{formatMoney(refund.amount_vnd)}</span><time dateTime={refund.created_at}>{new Date(refund.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</time></li>)}</ol>
              </section>}
            </section>
          </div>
          {['delivered', 'completed'].includes(order.status) && reviewableItems.length > 0 && (
            <form className="review-form" onSubmit={handleSubmit(submitReview)} noValidate>
              <h2>Chia sẻ trải nghiệm của bạn</h2>
              <p>Đánh giá chỉ áp dụng cho sản phẩm trong đơn đã giao. Nội dung được duyệt trước khi công khai.</p>
              <label>Sản phẩm
                <select aria-invalid={Boolean(errors.order_item_id)} aria-describedby={errors.order_item_id ? 'review-item-error' : undefined} {...register('order_item_id')}>
                  <option value="">Chọn sản phẩm đã mua</option>
                  {reviewableItems.map((item) => <option key={item.id} value={item.id}>{item.product_name}{item.variant_name ? ` · ${item.variant_name}` : ''}</option>)}
                </select>
                {errors.order_item_id && <small id="review-item-error" className="field-error" role="alert">{errors.order_item_id.message}</small>}
              </label>
              <label>Điểm đánh giá
                <select aria-invalid={Boolean(errors.rating)} aria-describedby={errors.rating ? 'review-rating-error' : undefined} {...register('rating')}>
                  <option value={5}>5 · Rất hài lòng</option><option value={4}>4 · Hài lòng</option><option value={3}>3 · Bình thường</option><option value={2}>2 · Chưa hài lòng</option><option value={1}>1 · Không hài lòng</option>
                </select>
                {errors.rating && <small id="review-rating-error" className="field-error" role="alert">Điểm đánh giá phải từ 1 đến 5.</small>}
              </label>
              <label>Tiêu đề<input maxLength={160} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'review-title-error' : undefined} {...register('title')} />{errors.title && <small id="review-title-error" className="field-error" role="alert">{errors.title.message}</small>}</label>
              <label>Nội dung<textarea maxLength={5000} aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? 'review-content-error' : undefined} {...register('content')} />{errors.content && <small id="review-content-error" className="field-error" role="alert">{errors.content.message}</small>}</label>
              <label>Ảnh sản phẩm (không bắt buộc)
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple aria-invalid={Boolean(errors.images)} aria-describedby={errors.images ? 'review-images-error' : 'review-images-hint'} {...register('images')} />
                <small id="review-images-hint">Tối đa 5 ảnh JPG, PNG hoặc WebP; mỗi ảnh tối đa 2 MB.</small>
                {errors.images && <small id="review-images-error" className="field-error" role="alert">{errors.images.message}</small>}
                {selectedImages?.length ? <small>{Array.from(selectedImages).map((image) => image.name).join(', ')}</small> : null}
              </label>
              <label>Video trải nghiệm (không bắt buộc)
                <input type="file" accept="video/mp4,video/webm" aria-invalid={Boolean(errors.videos)} aria-describedby={errors.videos ? 'review-videos-error' : 'review-videos-hint'} {...register('videos')} />
                <small id="review-videos-hint">Tối đa 1 video MP4 hoặc WebM, dung lượng tối đa 5 MB.</small>
                {errors.videos && <small id="review-videos-error" className="field-error" role="alert">{errors.videos.message}</small>}
                {selectedVideos?.length ? <small>{Array.from(selectedVideos).map((video) => video.name).join(', ')}</small> : null}
              </label>
              {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
              <button className="button dark" disabled={reviewBusy}>{reviewBusy ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
            </form>
          )}
          {['delivered', 'completed'].includes(order.status) && reviewableItems.length === 0 && <p className="order-review-status" role="status">Bạn đã gửi đánh giá cho tất cả sản phẩm trong đơn này. Trạng thái duyệt được hiển thị riêng bên từng sản phẩm.</p>}
          {isDeliveredOrder && !hasPendingChangeRequest && returnWindowOpen && (
            <p className="order-return-deadline" role="status">Bạn có thể gửi yêu cầu trả hàng đến {new Date(returnDeadline).toLocaleString('vi-VN')} (trong vòng 7 ngày kể từ khi giao).</p>
          )}
          {isDeliveredOrder && !hasPendingChangeRequest && !returnWindowOpen && (
            <p className="order-return-expired" role="status">{hasDeliveryTimestamp ? 'Đã hết thời hạn 7 ngày để gửi yêu cầu trả hàng kể từ khi đơn được giao.' : 'Đơn hàng chưa có thời điểm giao thành công được ghi nhận nên chưa thể gửi yêu cầu trả hàng.'}</p>
          )}
          {order && (['pending', 'confirmed', 'processing'].includes(order.status) || (isDeliveredOrder && returnWindowOpen)) && !hasPendingChangeRequest && (
            <button className="button dark cancel-order-button" type="button" onClick={() => onChangeRequest(order)}>
              {['delivered', 'completed'].includes(order.status) ? 'Yêu cầu trả hàng' : 'Yêu cầu hủy đơn'}
            </button>
          )}
        </section>
      ) : (
        <p className="state" aria-live="polite">Không có thông tin đơn hàng.</p>
      )}
    </div>
  )
}
