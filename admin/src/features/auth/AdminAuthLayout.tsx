import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ADMIN_STOREFRONT_URL } from '../../lib/storefront-base'
import './AdminAuthLayout.css'

const storefrontUrl = ADMIN_STOREFRONT_URL

export function AdminAuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return <main className="admin-auth-layout">
    <section className="admin-auth-form-side">
      <div className="admin-auth-content">{children}</div>
      <footer className="admin-auth-footer">
        <span>© 2026 NÉT STUDIO</span>
        <nav aria-label={t('Điều khoản và chính sách')}>
          <a href={`${storefrontUrl}/pages/terms`} target="_blank" rel="noreferrer">{t('Điều khoản')}</a>
          <a href={`${storefrontUrl}/pages/privacy`} target="_blank" rel="noreferrer">{t('Chính sách')}</a>
        </nav>
      </footer>
    </section>
    <aside className="admin-auth-brand-panel" aria-label={t('NÉT Studio, thời trang cho nhịp sống riêng')}>
      <div className="admin-auth-panel-topline"><span>NÉT<span className="admin-auth-panel-dot">.</span> STUDIO</span><span>Sarada</span></div>
      <div className="admin-auth-panel-copy">
        <p className="admin-auth-panel-kicker">{t('THIẾT KẾ · CHẤT LIỆU · CÁ TÍNH')}</p>
        <h2>{t('Phong cách bắt đầu từ lựa chọn của bạn.')}</h2>
        <p>{t('Không gian quản trị dành cho những bộ sưu tập được tạo nên bằng sự chỉn chu.')}</p>
      </div>
      <svg className="admin-auth-brand-art" viewBox="0 0 500 500" role="img" aria-label={t('Đồ họa nhận diện thương hiệu NÉT Studio')}>
        <defs>
          <linearGradient id="authBrandRibbon" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f5e7d6" />
            <stop offset="1" stopColor="#d6bba5" />
          </linearGradient>
          <linearGradient id="authBrandAccent" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#c99a83" />
            <stop offset="1" stopColor="#a66f68" />
          </linearGradient>
        </defs>
        <circle cx="286" cy="250" r="214" fill="#f6e8d7" fillOpacity=".08" />
        <circle cx="286" cy="250" r="178" fill="none" stroke="#f6e8d7" strokeOpacity=".24" />
        <circle cx="286" cy="250" r="128" fill="none" stroke="#f6e8d7" strokeOpacity=".16" strokeDasharray="2 12" />
        <ellipse cx="286" cy="282" rx="166" ry="78" transform="rotate(-28 286 282)" fill="none" stroke="#f6e8d7" strokeOpacity=".2" strokeWidth="2" />
        <ellipse cx="286" cy="282" rx="166" ry="78" transform="rotate(28 286 282)" fill="none" stroke="#f6e8d7" strokeOpacity=".2" strokeWidth="2" />
        <path d="M194 365V198h34l105 115V198h38v167h-31L232 245v120Z" fill="url(#authBrandRibbon)" />
        <path d="M213 346h23v19h-42v-19Zm137-148h21v19h-21Z" fill="url(#authBrandAccent)" />
        <path d="M112 468h348" stroke="#f6e8d7" strokeOpacity=".55" strokeWidth="2" />
      </svg>
      <div className="admin-auth-panel-bottom"><span>{t('CHỌN PHONG CÁCH CỦA RIÊNG BẠN')}</span><span>01 / NÉT STUDIO</span></div>
    </aside>
  </main>
}
