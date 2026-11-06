import { useMemo } from 'react'
import { Link } from 'react-router'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import type { StorefrontConfiguration } from '../storefront/storefront-api'
import type { components } from '../../types/api'
import { ContactForm } from './ContactForm'
import { StorefrontContentPageError, useStorefrontContentPage } from './content-api'

type PublicContentPageProps = {
  query: ReturnType<typeof useStorefrontContentPage>
  isContact?: boolean
  configuration?: StorefrontConfiguration
  customer?: components['schemas']['StorefrontUser'] | null
}

export function PublicContentPage({ query, isContact = false, configuration, customer }: PublicContentPageProps) {
  const sanitizedContent = useMemo(
    () => query.data ? sanitizePageContent(query.data.content) : '',
    [query.data],
  )

  if (query.isPending) {
    return <div className="container subpage content-page-public"><p className="eyebrow">SARADA · THÔNG TIN CỬA HÀNG</p><p className="state" role="status">Đang tải nội dung…</p></div>
  }

  if (query.isError) {
    const missing = query.error instanceof StorefrontContentPageError && query.error.status === 404
    if (isContact) {
      return <div className="container subpage content-page-public"><p className="eyebrow">SARADA · THÔNG TIN CỬA HÀNG</p><h1>Liên hệ cửa hàng</h1><p>{missing ? 'Gửi câu hỏi hoặc yêu cầu hỗ trợ, cửa hàng sẽ phản hồi qua thông tin bạn cung cấp.' : 'Nội dung hướng dẫn liên hệ chưa tải được. Bạn vẫn có thể xem thông tin cửa hàng hoặc gửi yêu cầu hỗ trợ bên dưới.'}</p>{!missing && <p role="alert">Chưa tải được nội dung trang liên hệ. <button className="link-button" type="button" onClick={() => void query.refetch()}>Thử tải lại</button></p>}<ContactPageContent configuration={configuration} customer={customer} /></div>
    }
    return <div className="container subpage content-page-public"><p className="eyebrow">SARADA · THÔNG TIN CỬA HÀNG</p><div className="empty"><img className="storefront-state-illustration" src={missing ? '/illustrations/not-found.svg' : '/illustrations/connection-error.svg'} alt="" aria-hidden="true" /><h1>{missing ? 'Không tìm thấy trang' : 'Chưa tải được trang'}</h1><p>{missing ? 'Trang có thể chưa được xuất bản hoặc đường dẫn không tồn tại.' : 'Kiểm tra kết nối rồi thử tải lại.'}</p>{missing ? <Link className="button dark" to="/">Về trang chủ</Link> : <button className="button dark" type="button" onClick={() => void query.refetch()}>Thử lại</button>}</div></div>
  }

  if (!query.data) return null

  return <div className="container subpage content-page-public">
    <p className="eyebrow">SARADA · THÔNG TIN CỬA HÀNG</p>
    <h1>{query.data.title}</h1>
    <article className="content-page-body" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    {isContact && <ContactPageContent configuration={configuration} customer={customer} />}
  </div>
}

function ContactPageContent({ configuration, customer }: Pick<PublicContentPageProps, 'configuration' | 'customer'>) {
  const email = configuration?.support_email?.trim() || configuration?.store_email?.trim() || ''
  const phone = configuration?.support_phone?.trim() || configuration?.store_phone?.trim() || ''
  const hours = configuration?.support_hours?.trim() || configuration?.business_hours?.trim() || ''
  const address = configuration?.store_address?.trim() || ''

  return <div className="store-contact-details">
    <section className="store-contact-details__info" aria-labelledby="store-contact-details-title">
      <h2 id="store-contact-details-title">Thông tin liên hệ</h2>
      {phone && <p><span>Điện thoại</span><a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a></p>}
      {email && <p><span>Email</span><a href={`mailto:${email}`}>{email}</a></p>}
      {hours && <p><span>Giờ hỗ trợ</span><span>{hours}</span></p>}
      {address && <p><span>Địa chỉ</span><span>{address} <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Xem bản đồ</a></span></p>}
      {!phone && !email && !hours && !address && <p>Vui lòng gửi lời nhắn qua biểu mẫu để cửa hàng hỗ trợ bạn.</p>}
    </section>
    {configuration?.contact_form_enabled !== false
      ? <ContactForm customer={customer ?? null} />
      : <section className="store-contact-form" role="status"><h2>Biểu mẫu tạm thời chưa khả dụng</h2><p>Cửa hàng chưa cấu hình email nhận yêu cầu liên hệ. Vui lòng thử lại sau.</p></section>}
  </div>
}
