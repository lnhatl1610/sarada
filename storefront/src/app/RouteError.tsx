import { isRouteErrorResponse, useRouteError } from 'react-router'
import { StorefrontRecoveryPanel } from './StorefrontRecoveryPanel'
import './StorefrontRecoveryPanel.css'

export function RouteError() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : 500
  const isNotFound = status === 404
  const isForbidden = status === 403
  const title = isNotFound ? 'Không tìm thấy trang' : isForbidden ? 'Bạn không có quyền truy cập' : 'Trang đang gặp sự cố'
  const message = isNotFound
    ? 'Đường dẫn này không tồn tại hoặc đã được thay đổi.'
    : isForbidden
      ? 'Tài khoản hiện tại không được phép xem nội dung này.'
      : 'Vui lòng thử tải lại trang hoặc quay về trang chủ.'

  return <main className="container subpage" role="alert">
    <img src={isNotFound ? '/illustrations/not-found.svg' : isForbidden ? '/illustrations/access-denied.svg' : '/illustrations/connection-error.svg'} alt="" aria-hidden="true" style={{ display: 'block', width: 180, maxWidth: '70vw', height: 'auto', margin: '0 auto' }} />
    <StorefrontRecoveryPanel code={String(status)} title={title} message={message} onRetry={!isForbidden && !isNotFound ? () => window.location.reload() : undefined} />
  </main>
}
