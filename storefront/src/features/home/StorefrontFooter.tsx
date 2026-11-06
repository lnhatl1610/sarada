import type { StorefrontPageLink } from './home-api'
import { Link } from 'react-router'
import { StorefrontBrand } from './StorefrontBrand'
import { CookieConsentManager } from '../privacy/CookieConsentManager'
import type { StorefrontConfiguration } from '../storefront/storefront-api'
import { NewsletterForm } from './NewsletterForm'

type StorefrontFooterProps = { pages: StorefrontPageLink[]; storeName: string; configuration?: StorefrontConfiguration }

export function StorefrontFooter({ pages, storeName, configuration }: StorefrontFooterProps) {
  const socialLinks: [string, string | undefined][] = [
    ['Facebook', configuration?.social_facebook],
    ['Instagram', configuration?.social_instagram],
    ['TikTok', configuration?.social_tiktok],
    ['Zalo', configuration?.social_zalo],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
  const supportPages = pages.filter((page) => /faq|hoi-dap|doi-tra|van-chuyen|shipping|size|kich-thuoc|privacy|terms|dieu-khoan/i.test(page.slug))
  const aboutPages = pages.filter((page) => !supportPages.includes(page) && page.slug !== 'contact')

  return <footer className="storefront-footer">
    <div className="footer-brand"><StorefrontBrand name={storeName} /><p>Thiết kế chậm, mặc thật lâu.</p>{socialLinks.length > 0 && <nav className="footer-social" aria-label="Mạng xã hội">{socialLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}</nav>}</div>
    <nav className="footer-links" aria-label="Hỗ trợ khách hàng"><h2>Hỗ trợ</h2><Link to="/track-order">Theo dõi đơn</Link><Link to="/faq">Trung tâm trợ giúp</Link><Link to="/contact">Liên hệ</Link>{supportPages.map((page) => <Link key={page.id} to={`/pages/${page.slug}`}>{page.title}</Link>)}</nav>
    <section className="footer-contact"><h2>Về cửa hàng</h2><Link to="/collections">Tất cả bộ sưu tập</Link><Link to="/style-guide">Phối đồ theo dịp</Link><Link to="/brands">Thương hiệu</Link><Link to="/stores">Hệ thống cửa hàng</Link><Link to="/membership">Chương trình thành viên</Link><Link to="/gift-cards">Thẻ quà tặng</Link><Link to="/refer-a-friend">Giới thiệu bạn bè</Link><Link to="/affiliate">Cộng tác viên</Link><Link to="/blog">Tạp chí phong cách</Link><Link to="/sitemap">Sơ đồ website</Link>{aboutPages.map((page) => <Link key={page.id} to={`/pages/${page.slug}`}>{page.title}</Link>)}{configuration?.store_phone && <a href={`tel:${configuration.store_phone.replace(/[^\d+]/g, '')}`}>{configuration.store_phone}</a>}{configuration?.store_email && <a href={`mailto:${configuration.store_email}`}>{configuration.store_email}</a>}{configuration?.store_address && <p>{configuration.store_address}</p>}{configuration?.business_hours && <p>{configuration.business_hours}</p>}</section>
    <section className="footer-service"><h2>Nhận tin &amp; mua sắm</h2><div className="newsletter footer-newsletter"><NewsletterForm storeName={storeName} idPrefix="footer-newsletter" /></div><div className="footer-shipping"><h3>Giao hàng &amp; thanh toán</h3><p>Giao hàng toàn quốc · Phí giao hàng hiển thị theo địa chỉ trước khi đặt.</p><div className="footer-payment-methods" aria-label="Phương thức thanh toán đang bật">{configuration?.payment_cod_enabled && <span>COD</span>}{configuration?.payment_bank_transfer_enabled && <span>Chuyển khoản · VietQR</span>}</div></div></section>
    <div className="footer-privacy-controls"><CookieConsentManager /></div>
    <small>© {new Date().getFullYear()} {storeName.toLocaleUpperCase('vi-VN')}.</small><div className="footer-locale" aria-label="Ngôn ngữ và tiền tệ"><span>Tiếng Việt</span><span>VND ₫</span></div>
  </footer>
}
