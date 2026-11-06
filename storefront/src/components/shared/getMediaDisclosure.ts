export function getMediaDisclosureLabel(alt: string | null | undefined): string | null {
  const normalized = alt?.trim().toLocaleLowerCase('vi-VN') ?? ''
  if (normalized.startsWith('ảnh ai demo:')) return 'Ảnh dựng'
  if (normalized.startsWith('ảnh chờ cập nhật:')) return 'Chưa có ảnh thật'
  if (normalized.startsWith('ảnh đồ họa:')) return 'Ảnh đồ họa'
  if (normalized.startsWith('ảnh concept demo:')) return 'Ảnh ý tưởng'
  if (normalized.includes('hình minh họa màu')) return 'Hình minh họa màu'
  return null
}

export function hasMediaDisclosure(alt: string | null | undefined): boolean {
  return getMediaDisclosureLabel(alt) !== null
}
