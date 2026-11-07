Ngoài thư viện UI component và CSS, hệ sinh thái UI/UX còn nhiều nhóm khác. Mình xếp theo vai trò, ưu tiên những cái hợp với React + Vite.

## 1. Headless / Primitives (hành vi + accessibility, không kèm style)
| Thư viện | Dùng cho |
|---|---|
| **Radix UI** | Nền của shadcn/ui: Dialog, Popover, Tabs, Accordion, Tooltip... |
| **React Aria** (Adobe) | Accessibility rất sâu, hỗ trợ i18n, date/time picker |
| **Headless UI** | Menu, Listbox, Combobox, Transition (của Tailwind Labs) |
| **Ark UI / Base UI** | Primitives đa framework / bản kế thừa MUI |
| **Floating UI** | Định vị tooltip, popover, dropdown |
| **cmdk** | Command palette (Ctrl+K), search nhanh |
| **vaul** | Drawer/bottom sheet kiểu mobile |

## 2. Animation & Motion
| Thư viện | Dùng cho |
|---|---|
| **framer-motion** (gói mới: `motion`) | Animation khai báo cho React |
| **GSAP + ScrollTrigger** | Timeline phức tạp, scroll-driven, pin section; mạnh nhất cho trang editorial |
| **React Spring** | Animation theo vật lý (spring) |
| **AutoAnimate** | Tự animate thêm/xóa/sắp xếp list chỉ bằng 1 dòng |
| **Lottie** (`lottie-react`) | Chạy animation vector xuất từ After Effects |
| **Rive** | Animation tương tác có state machine |
| **Lenis** | Smooth scroll |
| **react-countup, react-type-animation, SplitType** | Số đếm, chữ gõ, tách chữ để animate |

## 3. Carousel / Slider / Gallery
- **Embla**, **Swiper**, **Splide**, **keen-slider**: slider
- **yet-another-react-lightbox**, **PhotoSwipe**: xem ảnh phóng to
- **react-zoom-pan-pinch**: zoom ảnh sản phẩm (rất cần cho fashion)
- **react-image-gallery**: gallery có thumbnail

## 4. Form, input, validation
- **react-hook-form**, **TanStack Form**, **Formik**
- **zod**, **valibot**, **yup**: schema validation
- **react-day-picker**: chọn ngày
- **input-otp**: nhập mã OTP
- **react-number-format**, **react-phone-number-input**: định dạng tiền, số điện thoại
- **react-select**, **downshift**: select/autocomplete nâng cao

## 5. Data, state, loading UX
| Thư viện | Dùng cho |
|---|---|
| **TanStack Query** | Fetch, cache, loading/error state, optimistic update |
| **SWR** | Tương tự, nhẹ hơn |
| **Zustand / Jotai** | State nhẹ (giỏ hàng, wishlist) |
| **Redux Toolkit** | State lớn, phức tạp |
| **nuqs** | Lưu filter/sort vào URL |

## 6. Bảng dữ liệu & danh sách lớn
- **TanStack Table**: bảng headless (sort, filter, phân trang)
- **TanStack Virtual**, **react-window**: virtual list khi hàng nghìn item

## 7. Biểu đồ & trực quan hóa
**Recharts**, **Chart.js**, **Nivo**, **visx**, **ECharts**, **D3** (nền tảng thấp). Dùng cho dashboard admin.

## 8. Phản hồi người dùng (feedback UX)
- **Sonner**, **react-hot-toast**: toast
- **react-loading-skeleton**: skeleton loading
- **NProgress**: thanh tiến trình khi chuyển trang
- **react-confetti**: hiệu ứng ăn mừng sau thanh toán

## 9. Icon & font
- Icon: **lucide-react**, **Phosphor**, **Tabler**, **Heroicons**, **react-icons**, **Iconify**
- Font: **Fontsource**, **Google Fonts**, **Utopia** (fluid typography)

## 10. Theming & design tokens
- **class-variance-authority (cva)**, **tailwind-variants**: quản lý variant của component
- **clsx**, **tailwind-merge**: gộp class
- **Style Dictionary**: quản lý design token
- **next-themes**: dark mode (dùng được cả ngoài Next.js, hoặc tự viết bằng context)

## 11. Hook tiện ích & tương tác
- **react-intersection-observer**: phát hiện phần tử vào viewport (lazy load, trigger animation)
- **@use-gesture**: kéo, vuốt, pinch
- **dnd-kit**, **pragmatic-drag-and-drop**: kéo thả
- **react-hotkeys-hook**: phím tắt
- **usehooks-ts**, **react-use**, **ahooks**: bộ hook sẵn

## 12. Media, 3D, hiệu ứng nâng cao
- **react-player**, **Plyr**: video
- **Three.js + react-three-fiber + drei**: 3D (xem áo 360°, hero 3D)
- **tsparticles**: hạt, hiệu ứng nền
- **Spline**: 3D thiết kế bằng giao diện, nhúng vào web
- **blurhash / thumbhash**: placeholder mờ khi ảnh tải

## 13. Editor & nội dung
**Tiptap**, **Lexical**, **Slate**: rich text editor (blog, mô tả sản phẩm trong admin).

## 14. Onboarding / hướng dẫn
**driver.js**, **react-joyride**, **Shepherd.js**: tour hướng dẫn người dùng mới.

## 15. Bản đồ
**Leaflet + react-leaflet**, **Mapbox GL / react-map-gl**: trang "Hệ thống cửa hàng".

## 16. Đa ngôn ngữ & định dạng
- **i18next / react-i18next**: đa ngôn ngữ (VI/EN)
- **date-fns**, **dayjs**: xử lý ngày
- **Intl API** (có sẵn): định dạng tiền VND, số, ngày

## 17. Routing, SEO, PWA, hiệu năng
- **React Router**, **TanStack Router**; **View Transitions API** cho chuyển trang mượt
- **react-helmet-async**: meta tag, SEO; thêm JSON-LD cho sản phẩm
- **vite-plugin-pwa** (Workbox): cài như app, chạy offline
- **vite-imagetools**, **web-vitals**: tối ưu ảnh, đo Core Web Vitals

## 18. Accessibility & kiểm thử UX
- **axe-core**, **eslint-plugin-jsx-a11y**, **Lighthouse**: kiểm tra a11y
- **Storybook**: tài liệu và test component riêng lẻ
- **Playwright**, **Vitest**, **Testing Library**: test tự động
- **Chromatic**: visual regression

## 19. Phân tích hành vi người dùng (UX research)
**Microsoft Clarity** (miễn phí, heatmap + replay), **Hotjar**, **PostHog**, **GA4**: xem người dùng click, cuộn, bỏ giỏ ở đâu.

## 20. Dành riêng cho e-commerce
**Stripe Elements**, **Medusa**, **Shopify Hydrogen / Storefront API**, **react-share** (chia sẻ), **react-rating**; ngoài ra có thể tự làm size guide, so sánh sản phẩm bằng Radix.

## Gợi ý bộ thư viện cho fashion store của bạn
| Nhu cầu | Chọn |
|---|---|
| Component | shadcn/ui (Radix) |
| Animation | framer-motion (+ GSAP nếu cần scroll phức tạp) |
| Slider | Embla |
| Zoom ảnh sản phẩm | react-zoom-pan-pinch |
| Form | react-hook-form + zod |
| State giỏ hàng | Zustand |
| Fetch dữ liệu | TanStack Query |
| Toast, skeleton | Sonner, react-loading-skeleton |
| Viewport trigger | react-intersection-observer |
| SEO | react-helmet-async |
| Phân tích UX | Microsoft Clarity |

Nguyên tắc chọn: mỗi nhóm chỉ chọn **một** thư viện, tránh trùng chức năng (ví dụ framer-motion và GSAP cùng animate một phần tử sẽ xung đột). Bắt đầu với bộ trong bảng, thiếu gì mới thêm.

## Lựa chọn cho Sarada (mỗi nhóm một lựa chọn)

Các mục này là quyết định áp dụng cho repo, thay cho các ví dụ ở trên. “Đã có” nghĩa là package đang nằm trong manifest; các package còn thiếu sẽ được cài vào đúng app. Không cài thêm thư viện thay thế cùng vai trò.

| # | Nhóm | Lựa chọn | App / phạm vi |
| --- | --- | --- | --- |
| 1 | Headless / primitives | `radix-ui` (nền shadcn/ui) | Admin + Storefront |
| 2 | Animation / motion | `motion` | Storefront; tôn trọng reduced motion |
| 3 | Carousel / slider / gallery | `embla-carousel-react` | Storefront; rail đơn giản dùng scroll-snap CSS |
| 4 | Form / validation | `react-hook-form` | Admin + Storefront; giữ Zod resolver hiện có cho schema |
| 5 | Data / state / loading UX | `@tanstack/react-query` | Admin + Storefront cho dữ liệu server; state giao diện dùng React, không cài Zustand khi chưa cần store client riêng |
| 6 | Data table / danh sách lớn | `@tanstack/react-table` | Admin; lọc, phân trang và sort do API sở hữu |
| 7 | Biểu đồ | `recharts` | Admin dashboard và báo cáo |
| 8 | Feedback | `sonner` | Admin + Storefront |
| 9 | Icon / font | `lucide-react` | Cả hai app; font tiếp tục tự host bằng Fontsource đã có |
| 10 | Theme / token / variant | `class-variance-authority` | Admin + Storefront |
| 11 | Hook / tương tác | `@dnd-kit/core` | Admin kéo-thả thứ tự; không thêm bộ hook tổng hợp |
| 12 | Media / hiệu ứng nâng cao | `react-player` | Storefront video sản phẩm/review, tải lười; không thêm 3D |
| 13 | Editor | `@tiptap/react` | Admin CMS/nội dung sản phẩm |
| 14 | Onboarding | `driver.js` | Admin tour; app tiếp tục lưu tiến độ theo tài khoản |
| 15 | Map | `react-leaflet` | Storefront trang cửa hàng, dùng Leaflet/OpenStreetMap |
| 16 | Localization / date / money | `i18next` | Admin VI/EN; Storefront hiện chỉ VI, định dạng tiền/ngày dùng `Intl` có sẵn |
| 17 | Routing / SEO / PWA / performance | `react-router` | Storefront; SEO metadata tiếp tục dùng hook hiện có, không thêm Helmet |
| 18 | Accessibility / kiểm thử UX | `@playwright/test` | Dev dependency; axe-core và Vitest hiện có vẫn là công cụ kiểm tra bổ trợ |
| 19 | UX analytics | Google Analytics 4 (`gtag.js`) | Storefront; dùng bridge và consent hiện có, không nạp thêm nhà cung cấp analytics |
| 20 | E-commerce | `react-share` | Storefront chia sẻ sản phẩm/so sánh; ưu tiên Web Share API khi có |

### Trạng thái tải và cài đặt

- Đã có trong manifest: `radix-ui`, `motion`, `embla-carousel-react`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, `@tanstack/react-table`, `sonner` (cả hai app), `lucide-react`, `class-variance-authority`, `@dnd-kit/core`, `@tiptap/react`, `i18next`, `react-router`, `@playwright/test`, `axe-core`. Storefront dùng React state cho state giao diện và không giữ Zustand vì không có nơi nào import package này.
- Đã tải vào manifest/lockfile: Admin `recharts@^3.10.1`, `driver.js@^1.10.2`; Storefront `react-player@^3.4.0`, `react-leaflet@^5.0.0`, `leaflet@^1.9.4`, `@types/leaflet@^1.9.22`, `react-share@^6.1.0`. Sonner đã có ở Storefront và vừa được bổ sung cho Admin.
- GA4 dùng `gtag.js` tải động từ Google sau consent analytics; không có package registry để cài. Microsoft Clarity không cài vì sẽ tạo nhà cung cấp thứ hai cùng vai trò. Dùng tiles bản đồ công khai phải giữ attribution và vẫn cho khách xem địa chỉ/directions nếu tiles lỗi.
- Kiến trúc, so sánh phương án, rủi ro và đường quay lui: [ADR-0020](docs/adr/0020-frontend-experience-libraries.md).
