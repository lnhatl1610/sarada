# Bố cục chi tiết website thời trang — đối chiếu triển khai

Nguồn chuẩn: [`Bố cục chi tiết website thời trang.md`](../../Bố%20cục%20chi%20tiết%20website%20thời%20trang.md).

Đây là đối chiếu theo các mục lớn của tài liệu, không phải phần trăm hoàn thành: mỗi mục lớn chứa nhiều yêu cầu nhỏ với trọng lượng khác nhau. “Có mã” chỉ xác nhận có implementation trong working tree; không thay cho kiểm tra trình duyệt, thiết bị thật, nội dung cửa hàng hoặc nghiệm thu phát hành. Checklist [`storefront-full-spec/tasks.md`](../storefront-full-spec/tasks.md) theo dõi roadmap storefront rộng hơn nên không dùng làm tỷ lệ hoàn thành cho tài liệu này.

| Mục tài liệu | Trạng thái hiện tại | Bằng chứng / phần còn thiếu |
| --- | --- | --- |
| 1. Thư viện và hiệu ứng | Một phần | Đang dùng `lucide-react`, `motion`, Embla, React Hook Form/Zod, TanStack Table và Tailwind. Các thư viện gợi ý khác (GSAP/Lenis, Lottie, Three/model-viewer, Swiper, zoom, tsparticles, Recharts) chưa được dùng rộng rãi; trang dùng hiệu ứng nhẹ và reduced-motion ở các vị trí đã triển khai. Cần đối chiếu hiệu năng thay vì cài đủ thư viện gợi ý. |
| 2.1 Header | Gần đủ | Có top announcement bar, menu danh mục/bộ sưu tập, search dialog toàn màn hình, mini-cart drawer, bottom navigation mobile và account/wishlist/cart controls. CSS đặt search/utility controls xuống hàng thứ hai đến 460px để giữ chỗ cho logo và menu; chưa nghiệm thu trực quan trên viewport thật. |
| 2.2 Footer | Có mã | Footer 4 cột, newsletter consent, social/contact/configured payment, locale và sitemap links ở `StorefrontFooter.tsx`; nội dung phụ thuộc cấu hình/CMS. |
| 2.3 Component dùng lại | Có mã | Product card, breadcrumbs, pagination, rating, quantity/variant controls và empty/recovery states được dùng trong các feature; chưa đối chiếu từng component ở toàn bộ viewport. |
| 3.1 Home | Có mã | `HomePage.tsx` có hero/banner, category/product rails, campaign, lookbook, service strip, Instagram từ cấu hình và newsletter. Newsletter welcome dialog chỉ hiện khi coupon chào mừng còn hiệu lực. Chưa nghiệm thu ảnh/thứ tự nội dung trên thiết bị thật. |
| 3.2 Catalog/search/sale | Có mã | Catalog dùng API filters/sort/pagination; search có typo-tolerance, recent/trending/content suggestions; sale countdown dùng cấu hình campaign. Header search hiện là dialog toàn màn hình với tối đa 4 gợi ý sản phẩm ảnh 64×80. |
| 3.3 Collection/lookbook/brand | Có mã | Collection index, editorial Lookbook có hotspot/outfit selection, brand index/detail và metadata đã được nối API/Admin. |
| 3.4 Product detail | Một phần | PDP có gallery với dialog zoom, vuốt cảm ứng và phím mũi tên trái/phải, màu/size, size guide, reviews/Q&A, outfit builder, sticky mobile add, và frame viewer 360° kéo trực tiếp. Admin cần sắp 24–36 ảnh 360° theo thứ tự cho mỗi màu. Chưa có model 3D/AR; nội dung/ảnh thật phải do cửa hàng cung cấp. |
| 3.5 Wishlist/recently viewed | Có mã | Wishlist có chuyển giỏ; recently viewed dùng browser history cho khách và API/account state cho người đăng nhập. |
| 3.6 Compare | Có mã (tùy chọn) | `/compare` so sánh tối đa 4 sản phẩm và chia sẻ lựa chọn qua URL/browser state. |
| 3.7 Cart | Có mã | Cart drawer/page, bulk selection/removal, server-authoritative quote, cross-sell có chọn biến thể và trạng thái lỗi/empty. |
| 3.8 Checkout | Một phần | Checkout có các bước, shipping quote, COD/manual bank transfer theo cấu hình. VNPay/MoMo/thẻ trong tài liệu chưa bật; hiện chưa có provider/contract được cấu hình. Không hiển thị hoặc giả lập phương thức chưa tích hợp. |
| 3.9 Order result/tracking | Một phần | Có trang thành công, chuyển khoản và tracking/timeline; cần đối chiếu đầy đủ trạng thái thất bại/giữ đơn 24 giờ theo plan với từng provider thực tế. |
| 3.10 Voucher/gift card | Một phần | Ví voucher API-backed; `/gift-cards` có UI xem trước mệnh giá/mẫu/người nhận/lời nhắn/ngày gửi. Chưa phát hành, thanh toán, balance/history, refund hay redemption; chờ chính sách cửa hàng và Admin/API. |
| 3.11 Authentication | Một phần | Login/registration/recovery/email/OTP/passkeys có implementation. OAuth Google/Facebook trong plan chưa được cấu hình provider. |
| 3.12 Customer account | Có mã, cần nghiệm thu | Có profile, address book, orders/details, change requests, wishlist, vouchers, membership points, notification preferences/inbox và password/session security. Cần kiểm tra bố cục responsive trên thiết bị thật. |
| 3.13 Editorial/content pages | Một phần | CMS pages, blog, contact, FAQ, store locator, size guide, Lookbook và `/style-guide` có code. Style Guide liệt kê Lookbook đã được Admin chọn; trang chi tiết hỗ trợ chọn biến thể và thêm cả bộ vào giỏ. Careers/application, press kit và sustainability story cần nội dung/quy trình do cửa hàng cung cấp; các dịp phối cụ thể cũng phụ thuộc Lookbook được biên tập. |
| 3.14 Policies/help | Một phần | CMS policies và FAQ có; `/faq` hiện đóng vai trò help center với tối đa 6 thẻ chủ đề lấy từ FAQ đang xuất bản, tìm kiếm URL-backed, trạng thái tải/lỗi/trống và form yêu cầu hỗ trợ thu gọn dùng chung endpoint liên hệ (chỉ hiện khi cấu hình bật). Chat/Zalo cần cấu hình OA thực tế; nội dung chủ đề phụ thuộc dữ liệu cửa hàng. |
| 3.15 Membership/marketing | Một phần | Loyalty/membership API, newsletter popup và campaign promotion có. Referral/affiliate mới là giao diện xem trước; gift/reward rules, live codes, history, commission và application persistence còn thiếu. |
| 3.16 System pages | Gần đủ | Có 404/403/500 recovery; 404 có tìm kiếm, bốn lối tắt, đường về trang chủ và minh họa SVG váy chuyển động nhẹ (tắt khi reduced-motion); maintenance screen, HTML sitemap và XML sitemap. Maintenance notification signup và Lottie/3D artwork chưa có; không thu email khi chưa có endpoint/consent flow. |
| 3.17 Admin | Có implementation rộng, nghiệm thu còn thiếu | Có dashboard với 4 KPI chính, biểu đồ doanh thu, doanh thu theo danh mục (5 danh mục + Khác, theo trạng thái giao/thu tiền và trừ hoàn tiền theo tỷ trọng), bảng 8 đơn gần nhất, top sản phẩm và cảnh báo tồn kho; có products/images/360 metadata, categories/brands/collections, orders, customers, coupons/campaigns, banners/settings, CMS/blog, reviews/questions, staff/RBAC, reports. Chưa xác nhận tất cả bảng/filters/bulk actions/export và visual layout đúng từng yêu cầu của tài liệu trên viewport mục tiêu. |
| 5. Ảnh sản phẩm | Một phần | Có 19 master demo riêng đang được seeder sử dụng, với các biến thể WebP/AVIF hiện có và API `srcset`; `ResponsiveImage` ưu tiên AVIF và dự phòng WebP. Script optimizer Storefront đã bị xóa theo yêu cầu. Nguồn 800×1000 chưa có bản 1200×1600; còn thiếu bộ 7 góc theo màu và ảnh thật do cửa hàng cung cấp. |

## Nguồn mã để đối chiếu

- Thư viện: `storefront/package.json`, `admin/package.json`.
- Khung header/footer, search, cart drawer và điều hướng mobile: `storefront/src/features/home/StorefrontHeader.tsx`, `StorefrontFooter.tsx`, `MobileNavigationSheet.tsx`, `MobileBottomNavigation.tsx`; `storefront/src/features/search/StorefrontSearchBox.tsx`; `storefront/src/features/cart/CartDrawer.tsx`.
- ProductCard/catalog/search: `storefront/src/features/catalog/CatalogPage.tsx`, `storefront/src/features/catalog/useStorefrontCatalog.tsx`, `storefront/src/features/search/StorefrontSearchBox.tsx`.
- Home/marketing: `storefront/src/features/home/HomePage.tsx`, `NewsletterWelcomePopup.tsx`, `storefront/src/features/marketing/GiftCardPage.tsx`, `ReferralProgramPage.tsx`.
- Collections/lookbook/brands/PDP: `storefront/src/features/catalog/CollectionsIndexPage.tsx`, `LookbookEditorialPage.tsx`, `BrandsIndexPage.tsx`, `ProductDetailPage.tsx`; Admin 360-frame metadata ở `admin/src/features/products/ProductImagesPage.tsx`.
- Wishlist/recent/compare/cart/checkout/orders: `storefront/src/features/account/WishlistPage.tsx`, `storefront/src/features/catalog/RecentlyViewedProducts.tsx`, `ProductComparePage.tsx`, `storefront/src/features/cart/CartPage.tsx`, `storefront/src/features/checkout/CheckoutPage.tsx`, `CheckoutSuccessPage.tsx`, `storefront/src/features/orders/TrackOrderPage.tsx`.
- Auth/account/content/support/system: `storefront/src/features/auth/`, `storefront/src/features/account/`, `storefront/src/features/content/`, `storefront/src/app/RouteError.tsx`, `StorefrontRecoveryPanel.tsx`.
- Admin: `admin/src/features/dashboard/AdminDashboardPage.tsx`, `products/`, `orders/`, `customers/`, `staff/`, `reports/`, `settings/`, `content/`, `reviews/`.
- Ảnh: `api/app/Http/Resources/ProductResource.php`, `admin/src/features/products/ProductCreatePage.tsx`.

## Việc còn lại để hoàn thành plan

1. Hoàn thiện/duyệt các quyết định cần chủ cửa hàng: phương thức thanh toán/provider, gift card, referral/affiliate, nội dung editorial, OA Zalo, ảnh thật và chính sách thành viên.
2. Hoàn thiện các flow còn một phần nêu trong bảng; ưu tiên các route customer-facing đang chỉ có UI preview.
3. Đối chiếu toàn bộ Admin rows/actions với 3.17 và ghi nhận thiếu hụt cụ thể.
4. Chạy build/lint, keyboard/accessibility audits và nghiệm thu responsive/browser khi được yêu cầu; checklist chưa được đánh dấu đạt chỉ dựa trên việc có mã.
