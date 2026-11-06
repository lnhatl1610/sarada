const vndFormatter = new Intl.NumberFormat('vi-VN')

export function formatVnd(amount: number): string {
  return `${vndFormatter.format(amount)} ₫`
}
