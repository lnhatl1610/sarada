import type { ReactNode } from 'react'
import { Link } from 'react-router'
import '../../Auth.css'
import './StorefrontAuthLayout.css'

export function StorefrontAuthLayout({ children }: { children: ReactNode }) {
  return <div className="storefront-auth-layout">
    <section className="storefront-auth-form-side">
      <div className="storefront-auth-content">{children}</div>
      <footer className="storefront-auth-footer" role="contentinfo" aria-label="Thông tin pháp lý của cửa hàng">
        <span>© 2026 SARADA</span>
        <nav aria-label="Điều khoản và chính sách">
          <Link to="/pages/terms">Điều khoản</Link>
          <Link to="/pages/privacy">Chính sách</Link>
        </nav>
      </footer>
    </section>
    <aside className="storefront-auth-brand-panel" aria-label="Sarada, thời trang cho nhịp sống riêng">
      <div className="storefront-auth-panel-topline"><span>SARADA<span>.</span> STUDIO</span><span>Sarada</span></div>
      <div className="storefront-auth-panel-copy">
        <p>THIẾT KẾ · CHẤT LIỆU · CÁ TÍNH</p>
        <h2>Phong cách bắt đầu từ lựa chọn của bạn.</h2>
        <span>Những thiết kế có chủ đích, dành cho nhịp sống của riêng bạn.</span>
      </div>
      <svg className="storefront-auth-brand-art" viewBox="0 0 500 560" role="img" aria-label="Đồ họa nhận diện thương hiệu Sarada">
        <circle cx="278" cy="280" r="214" fill="#f6e8d7" fillOpacity=".08" />
        <circle cx="278" cy="280" r="178" fill="none" stroke="#f6e8d7" strokeOpacity=".24" />
        <circle cx="278" cy="280" r="132" fill="none" stroke="#f6e8d7" strokeOpacity=".12" strokeWidth="24" />
        <path d="M185 375V185h38l110 126V185h38v190h-36L223 245v130z" fill="#f5e7d6" />
        <path d="M278 66v36m0 356v36M64 280h36m356 0h36" stroke="#f6e8d7" strokeOpacity=".42" strokeWidth="2" />
        <circle cx="278" cy="280" r="8" fill="#e8b99d" />
      </svg>
      <div className="storefront-auth-panel-bottom"><span>CHỌN PHONG CÁCH CỦA RIÊNG BẠN</span><span>01 / SARADA</span></div>
    </aside>
  </div>
}
