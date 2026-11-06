import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { StorefrontPageLink } from './home-api'

type HomeServiceStripProps = {
  codEnabled: boolean
  bankTransferEnabled: boolean
  storeEmail?: string | null
  storePhone?: string | null
  returnPolicyPage?: StorefrontPageLink
  contactPage?: StorefrontPageLink
}

export function HomeServiceStrip({ codEnabled, bankTransferEnabled, storeEmail, storePhone, returnPolicyPage, contactPage }: HomeServiceStripProps) {
  const phone = storePhone?.trim()
  const email = storeEmail?.trim()
  const normalizedPhone = phone?.replace(/[^\d+]/g, '')
  const supportHref = normalizedPhone ? `tel:${normalizedPhone}` : email ? `mailto:${email}` : undefined
  const items: ReactNode[] = [
    <span key="delivery">GIAO HÀNG TOÀN QUỐC</span>,
    <span key="shipping-fee">PHÍ GIAO HÀNG TÍNH THEO ĐỊA CHỈ</span>,
  ]

  if (codEnabled) items.push(<span key="cod">THANH TOÁN KHI NHẬN HÀNG</span>)
  if (bankTransferEnabled) items.push(<span key="bank-transfer">CHUYỂN KHOẢN / VIETQR</span>)
  if (returnPolicyPage) items.push(<Link key="returns" to={`/pages/${returnPolicyPage.slug}`}>CHÍNH SÁCH ĐỔI TRẢ</Link>)
  if (supportHref) items.push(<a key="support" href={supportHref}>{normalizedPhone ? `HỖ TRỢ: ${phone}` : email}</a>)
  else if (contactPage) items.push(<Link key="contact" to={`/pages/${contactPage.slug}`}>LIÊN HỆ HỖ TRỢ</Link>)

  return <section className="home-service-strip" aria-label="Thông tin giao hàng và hỗ trợ" data-item-count={items.length}>
    {items.map((item, index) => <Fragment key={index}>{index > 0 && <span className="home-service-separator" aria-hidden="true">·</span>}{item}</Fragment>)}
  </section>
}
