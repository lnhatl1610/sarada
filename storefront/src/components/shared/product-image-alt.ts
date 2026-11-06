const pendingProductPhotoAlt = 'Ảnh chờ cập nhật: Chưa có ảnh chụp thật của sản phẩm này.'

function isPendingProductPhoto(src: string | null | undefined): boolean {
  return !src
}

export function getProductImageAlt(src: string | null | undefined, alt: string | null | undefined, productName: string): string {
  const suppliedAlt = alt?.trim()
  if (suppliedAlt) return suppliedAlt
  if (isPendingProductPhoto(src)) return pendingProductPhotoAlt

  return `Ảnh sản phẩm ${productName}`
}
