import { Link } from "react-router";
import {
  Camera as Instagram,
  Users as Facebook,
  Video as Youtube,
  MapPin,
  Mail,
  Clock,
} from "lucide-react";
const groups = [
  {
    title: "Về chúng tôi",
    links: [
      ["Câu chuyện thương hiệu", "/pages/about"],
      ["Hệ thống cửa hàng", "/contact"],
      ["Tin tức", "/pages/about"],
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      ["Chính sách đổi trả", "/faq"],
      ["Chính sách bảo mật", "/pages/privacy-policy"],
      ["Hướng dẫn chọn size", "/faq"],
      ["Hướng dẫn mua hàng", "/faq"],
      ["Câu hỏi thường gặp", "/faq"],
      ["Liên hệ", "/contact"],
    ],
  },
  {
    title: "Danh mục",
    links: [
      ["Nữ", "/search?q=nữ"],
      ["Nam", "/search?q=nam"],
      ["Phụ kiện", "/search?q=phụ%20kiện"],
      ["Bộ sưu tập mới", "/products"],
      ["Sale", "/products"],
    ],
  },
];
export function BlazerFooter() {
  return (
    <footer className="bg-foreground px-5 pb-7 pt-16 text-background md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr_1.2fr]">
          <div>
            <Link
              to="/"
              className="font-['Cormorant_Garamond_Variable'] text-5xl"
            >
              Blzr
            </Link>
            <p className="mt-5 max-w-60 text-xs leading-6 text-background/70">
              Thời trang hiện đại, tối giản và bền vững dành cho người Việt.
            </p>
            <div className="mt-6 flex gap-5">
              {[
                {
                  Icon: Facebook,
                  href: "https://www.facebook.com/",
                  label: "Facebook",
                },
                {
                  Icon: Instagram,
                  href: "https://www.instagram.com/",
                  label: "Instagram",
                },
                {
                  Icon: Youtube,
                  href: "https://www.youtube.com/",
                  label: "YouTube",
                },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon className="size-4 transition-transform hover:-translate-y-1" />
                </a>
              ))}
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-5 hidden text-xs font-semibold uppercase tracking-wider md:block">
                {group.title}
              </h3>
              <div className="hidden flex-col gap-3 md:flex">
                {group.links.map(([label, to]) => (
                  <Link
                    key={label}
                    to={to}
                    className="text-xs text-background/70 hover:text-background"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <details className="border-b border-white/20 pb-4 md:hidden">
                <summary className="cursor-pointer text-sm">
                  {group.title}
                </summary>
                <div className="mt-4 flex flex-col gap-4">
                  {group.links.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      className="text-xs text-background/70"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          ))}
          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-wider">
              Liên hệ
            </h3>
            <div className="flex flex-col gap-4 text-xs leading-6 text-background/70">
              <p className="flex gap-2">
                <MapPin className="mt-1 size-4 shrink-0" />
                Thông tin cửa hàng tại trang Liên hệ
              </p>
              <Link to="/contact" className="flex gap-2">
                <Mail className="mt-1 size-4 shrink-0" />
                Gửi lời nhắn cho Sarada
              </Link>
              <p className="flex gap-2">
                <Clock className="mt-1 size-4 shrink-0" />
                8:00 – 22:00 mỗi ngày
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-y border-white/20 py-6">
          <p className="text-xs text-background/60">Thanh toán khi nhận hàng</p>
          <div className="flex flex-wrap gap-2">
            {["COD", "GHN", "GHTK", "Viettel Post"].map((name) => (
              <span
                key={name}
                className="border border-white/25 px-3 py-1.5 text-[10px]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-3 text-[10px] text-background/60">
          <p>© 2026 Sarada. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/faq">Điều khoản</Link>
            <Link to="/pages/privacy-policy">Bảo mật</Link>
          </div>
        </div>
        <p className="mt-5 text-[10px] leading-5 text-background/50">
          Giao diện giới thiệu: sản phẩm, giá, ưu đãi, đánh giá và số liệu bên
          trên là dữ liệu mẫu. Các nút mạng xã hội mở nền tảng; tài khoản thương
          hiệu cần được xác nhận.
        </p>
      </div>
    </footer>
  );
}
