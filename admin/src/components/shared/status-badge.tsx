import { useTranslation } from 'react-i18next'

/* eslint-disable react-refresh/only-export-components -- status labels are part of the shared badge module. */
type StatusKind = 'product' | 'order' | 'payment' | 'review'

const labels: Record<StatusKind, Record<string, string>> = {
  product: { active: 'Đang bán', draft: 'Bản nháp', archived: 'Lưu trữ' },
  order: {
    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao',
    delivered: 'Đã giao', delivery_failed: 'Giao thất bại', returned: 'Đã hoàn hàng', completed: 'Hoàn tất', cancelled: 'Đã hủy',
  },
  payment: { paid: 'Đã thu', success: 'Đã thanh toán', unpaid: 'Chưa thu · COD', pending: 'Chưa thu · COD', failed: 'Giao dịch thất bại', refunded: 'Đã hoàn' },
  review: { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã ẩn' },
}

const tones: Record<StatusKind, Record<string, string>> = {
  product: { active: 'success', draft: 'neutral', archived: 'muted' },
  order: { pending: 'warning', confirmed: 'info', processing: 'info', shipping: 'info', delivered: 'success', completed: 'success', cancelled: 'danger', delivery_failed: 'danger', returned: 'warning' },
  payment: { paid: 'success', success: 'success', unpaid: 'warning', pending: 'warning', failed: 'danger', refunded: 'neutral' },
  review: { pending: 'warning', approved: 'success', rejected: 'danger' },
}

type StatusBadgeProps = { kind: StatusKind; status: string }

export function getStatusLabel(kind: StatusKind, status: string) {
  return labels[kind][status] ?? status.replaceAll('_', ' ')
}

export function StatusBadge({ kind, status }: StatusBadgeProps) {
  const { t } = useTranslation()
  const label = t(getStatusLabel(kind, status))
  const tone = tones[kind][status] ?? 'neutral'

  return <span className={`status-badge status-badge-${tone}`}>
    <span className="status-badge-dot" aria-hidden="true" />
    {label}
  </span>
}
