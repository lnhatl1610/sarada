import { Link } from 'react-router'
import './CollectionRouteState.css'

type CollectionRouteStateProps = {
  state: 'loading' | 'error' | 'not-found'
  onRetry: () => void
}

export function CollectionRouteState({ state, onRetry }: CollectionRouteStateProps) {
  if (state === 'loading') {
    return (
      <div className="container subpage collection-route-loading" aria-busy="true" aria-label="Đang tải bộ sưu tập">
        <div className="collection-route-skeleton-title" aria-hidden="true" />
        <div className="collection-route-skeleton-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => <div className="collection-route-skeleton-card" key={index} />)}
        </div>
        <p className="sr-only" role="status">Đang kiểm tra bộ sưu tập…</p>
      </div>
    )
  }

  const isError = state === 'error'

  return (
    <div className="container subpage collection-route-state">
      <section className="empty" role={isError ? 'alert' : undefined} aria-labelledby="collection-route-title">
        <img src="/illustrations/not-found.svg" alt="" aria-hidden="true" className="collection-route-illustration" />
        <p className="eyebrow">{isError ? 'KẾT NỐI' : '404'}</p>
        <h1 id="collection-route-title">{isError ? 'Chưa tải được bộ sưu tập' : 'Bộ sưu tập không còn khả dụng'}</h1>
        <p>{isError ? 'Kiểm tra kết nối rồi thử tải lại.' : 'Bộ sưu tập này có thể đã kết thúc hoặc không còn được xuất bản.'}</p>
        {isError && <button className="button dark" type="button" onClick={onRetry}>Thử lại</button>}{' '}
        <Link className="button dark" to="/products">Xem tất cả sản phẩm</Link>
      </section>
    </div>
  )
}
