import { lazy, Suspense, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import type { StorefrontConfiguration } from '../storefront/storefront-api'
import type { components } from '../../types/api'
import { fetchStorefrontPageLinks, type StorefrontPageLink } from '../home/home-api'
import { getStoreLocations } from './store-locations-api'
import { ContactForm } from './ContactForm'
import { StorefrontContentPageError, useStorefrontContentPage } from './content-api'

const StoreLocationsMap = lazy(() => import('./StoreLocationsMap').then((module) => ({ default: module.StoreLocationsMap })))

type PublicContentPageProps = {
  query: ReturnType<typeof useStorefrontContentPage>
  isContact?: boolean
  isPolicy?: boolean
  policyPages?: StorefrontPageLink[]
  configuration?: StorefrontConfiguration
  customer?: components['schemas']['StorefrontUser'] | null
}

const policySlugs = new Set(['returns', 'shipping', 'payment', 'privacy', 'terms', 'cookies'])

function preparePolicySections(html: string): { html: string; headings: Array<{ id: string; title: string; level: number }> } {
  const document = new DOMParser().parseFromString(`<div id="policy-content-root">${html}</div>`, 'text/html')
  const root = document.getElementById('policy-content-root')
  if (!root) return { html: '', headings: [] }
  const usedIds = new Set<string>()
  const headings = Array.from(root.querySelectorAll('h2, h3')).map((heading, index) => {
    const title = heading.textContent?.trim() ?? ''
    const baseId = title.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `muc-${index + 1}`
    let id = `policy-${baseId}`
    let suffix = 2
    while (usedIds.has(id)) id = `policy-${baseId}-${suffix++}`
    usedIds.add(id)
    heading.id = id
    return { id, title, level: Number(heading.tagName.slice(1)) }
  }).filter((heading) => Boolean(heading.title))
  return { html: root.innerHTML, headings }
}

function policyPageHref(page: StorefrontPageLink): string {
  return policySlugs.has(page.slug) ? `/policies/${encodeURIComponent(page.slug)}` : `/pages/${encodeURIComponent(page.slug)}`
}

export function PublicContentPage({ query, isContact = false, isPolicy = false, policyPages = [], configuration, customer }: PublicContentPageProps) {
  const policyPageLinksQuery = useQuery({
    queryKey: ['pages', 'storefront-links'],
    queryFn: ({ signal }) => fetchStorefrontPageLinks(signal),
    enabled: isPolicy,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const sanitizedContent = useMemo(
    () => query.data ? sanitizePageContent(query.data.content) : '',
    [query.data],
  )
  const policyContent = useMemo(() => preparePolicySections(sanitizedContent), [sanitizedContent])
  const dateValue = query.data?.updated_at || query.data?.created_at
  const publishedPolicyPages = (policyPageLinksQuery.data ?? policyPages).filter((page) => page.is_published && policySlugs.has(page.slug))

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

  if (isPolicy) {
    return <div className="container subpage content-page-public">
      <h1 id="policy-page-title">{query.data.title}</h1>
      {dateValue && <p className="mb-8 text-sm text-muted-foreground"><span>{query.data.updated_at ? 'Cập nhật' : 'Đăng tải'}: </span><time dateTime={dateValue}>{new Date(dateValue).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })}</time></p>}
      <div className={policyContent.headings.length > 0 ? 'grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start' : ''}>
        {policyContent.headings.length > 0 && <nav className="h-fit border-y border-border py-5 lg:sticky lg:top-6" aria-label="Mục lục chính sách">
          <h2 className="mb-3 text-base font-semibold">Trong trang này</h2>
          <ul className="grid gap-2">
            {policyContent.headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}><a className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`#${heading.id}`}>{heading.title}</a></li>)}
          </ul>
        </nav>}
        <article className="content-page-body min-w-0" dangerouslySetInnerHTML={{ __html: policyContent.html }} />
      </div>
      {(publishedPolicyPages.length > 0 || policyPageLinksQuery.isError) && <nav className="mt-12 border-t border-border pt-6" aria-label="Chính sách liên quan">
        <h2 className="mb-3 text-lg font-semibold">Chính sách liên quan</h2>
        {policyPageLinksQuery.isError && publishedPolicyPages.length === 0
          ? <div role="alert"><p className="text-sm text-muted-foreground">Chưa tải được liên kết chính sách.</p><button className="mt-2 min-h-11 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" onClick={() => void policyPageLinksQuery.refetch()}>Thử tải lại</button></div>
          : <ul className="flex flex-wrap gap-x-6 gap-y-3">{publishedPolicyPages.map((page) => <li key={page.id}><Link className="text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={policyPageHref(page)} aria-current={page.slug === query.data?.slug ? 'page' : undefined}>{page.title}</Link></li>)}</ul>}
      </nav>}
    </div>
  }

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

  const locations = useQuery({
    queryKey: ['store-locations', 'contact-map'],
    queryFn: ({ signal }) => getStoreLocations({ page: 1, signal }),
    staleTime: 5 * 60 * 1000,
  })
  const activeLocations = locations.data?.data ?? []
  const selectedLocation = activeLocations[0]

  return <div className="store-contact-details">
    <section className="store-contact-details__info" aria-labelledby="store-contact-details-title">
      <h2 id="store-contact-details-title">Thông tin liên hệ</h2>
      {phone && <p><span>Điện thoại</span><a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a></p>}
      {email && <p><span>Email</span><a href={`mailto:${email}`}>{email}</a></p>}
      {configuration?.social_zalo?.trim() && <p><span>Zalo</span><a href={configuration.social_zalo} target="_blank" rel="noreferrer">Nhắn tin qua Zalo</a></p>}
      {hours && <p><span>Giờ hỗ trợ</span><span>{hours}</span></p>}
      {address && <p><span>Địa chỉ</span><span>{address} <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Xem bản đồ</a></span></p>}
      {!phone && !email && !hours && !address && <p>Vui lòng gửi lời nhắn qua biểu mẫu để cửa hàng hỗ trợ bạn.</p>}
    </section>
    <section className="mt-8 space-y-4" aria-labelledby="contact-store-map-title">
      <div>
        <h2 className="text-xl font-medium" id="contact-store-map-title">Bản đồ hệ thống cửa hàng</h2>
        <p className="mt-2 text-sm text-muted-foreground">Vị trí được lấy từ danh sách cửa hàng đang hoạt động.</p>
      </div>
      {locations.isPending && <p className="text-sm" role="status">Đang tải bản đồ cửa hàng…</p>}
      {locations.isError && <div role="alert"><p className="text-sm">Chưa tải được vị trí cửa hàng.</p><button className="button dark mt-3" type="button" onClick={() => void locations.refetch()}>Thử tải lại</button></div>}
      {!locations.isPending && !locations.isError && selectedLocation && <>
        <div className="overflow-hidden rounded-lg border border-border">
          <Suspense fallback={<p className="p-4 text-sm" role="status">Đang chuẩn bị bản đồ…</p>}>
            <StoreLocationsMap selected={selectedLocation} locations={activeLocations} />
          </Suspense>
        </div>
        <Link className="inline-flex text-sm underline underline-offset-4" to="/stores">Xem danh sách cửa hàng và chỉ đường</Link>
      </>}
      {!locations.isPending && !locations.isError && !selectedLocation && <p className="text-sm" role="status">Cửa hàng chưa công bố vị trí trên bản đồ. <Link className="underline underline-offset-4" to="/stores">Xem danh sách cửa hàng</Link></p>}
    </section>
    <div className="mt-6 flex flex-wrap gap-4 text-sm" role="group" aria-label="Liên kết hỗ trợ nhanh">
      <Link className="underline underline-offset-4" to="/faq">Câu hỏi thường gặp</Link>
      <Link className="underline underline-offset-4" to="/track-order">Theo dõi đơn hàng</Link>
    </div>
    {configuration?.contact_form_enabled !== false
      ? <ContactForm customer={customer ?? null} />
      : <section className="store-contact-form" role="status"><h2>Biểu mẫu tạm thời chưa khả dụng</h2><p>Cửa hàng chưa cấu hình email nhận yêu cầu liên hệ. Vui lòng thử lại sau.</p></section>}
  </div>
}
