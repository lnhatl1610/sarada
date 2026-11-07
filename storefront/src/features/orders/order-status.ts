import type { CustomerOrderSummary, TrackedOrder } from './order-types'

const ORDER_STATUS_LABELS: Record<CustomerOrderSummary['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipping: 'Đang giao hàng',
  delivery_failed: 'Giao hàng chưa thành công',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  returned: 'Đã trả hàng',
  cancelled: 'Đã hủy',
}

const PAYMENT_STATUS_LABELS: Record<TrackedOrder['payment_status'], string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
}

export function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return 'Đang cập nhật'

  return ORDER_STATUS_LABELS[status as CustomerOrderSummary['status']] ?? status.replaceAll('_', ' ')
}

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ lấy hàng',
  waiting: 'Chờ lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang vận chuyển',
  delivered: 'Đã giao',
  failed: 'Giao hàng chưa thành công',
  returned: 'Đã hoàn hàng',
}

export function formatShipmentStatus(status: string | null | undefined): string {
  if (!status) return 'Đang cập nhật'

  return SHIPMENT_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')
}

export function formatPaymentStatus(status: TrackedOrder['payment_status']): string {
  return PAYMENT_STATUS_LABELS[status]
}

export function formatPaymentMethod(method: string | null | undefined): string {
  const labels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    vnpay: 'VNPay',
    momo: 'MoMo',
    stripe: 'Thẻ thanh toán',
  }

  if (!method) return 'Chưa cập nhật phương thức thanh toán'

  return labels[method] ?? method.replaceAll('_', ' ')
}
