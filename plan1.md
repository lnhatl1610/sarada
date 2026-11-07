# Fashion Store — Đặc tả chi tiết các trang Storefront

Tài liệu mô tả từng trang của storefront: mục tiêu, bố cục (theo tỉ lệ tương đối), thành phần, chức năng, dữ liệu/API và trạng thái giao diện. Dựa trên schema MySQL của dự án (users, addresses, categories, brands, colors, sizes, products, product\_variants, product\_images, collections, cart, wishlist, coupons, orders, payments, shipments, inventory\_movements, reviews, banners, settings).

## 0. Nguyên tắc chung

### 0.1 Bố cục và phong cách

- Layout chia theo tỉ lệ (%, fr, rem, clamp), không dùng px cố định. Lưới 12 cột; container rộng tối đa khoảng 90rem, lề hai bên 4–6% màn hình.
- Phong cách hiện đại, tối giản: nền trắng ngà, chữ đen than, một màu nhấn (ví dụ be/camel hoặc xanh rêu), khoảng trắng rộng, bo góc nhỏ, ảnh sản phẩm là trung tâm.
- Chữ: một font tiêu đề (serif hoặc display) và một font nội dung (sans-serif); cỡ chữ co giãn bằng clamp().
- Responsive: mobile (1–2 cột), tablet (3 cột), desktop (4 cột sản phẩm).
- Ảnh: WebP/AVIF, lazy-load, srcset nhiều kích thước, placeholder mờ (blur-up), giữ dung lượng nhỏ.

### 0.2 Thư viện và kỹ thuật (tận dụng tối đa kiến trúc React)

- Chọn đúng một thư viện trong mỗi nhóm theo [bảng lựa chọn Sarada trong `lib.md`](lib.md); chi tiết được duyệt nằm ở [frontend architecture](docs/architecture/frontend-architecture.md) và [ADR-0020](docs/adr/0020-frontend-experience-libraries.md).
- Route dùng React Router; dữ liệu server dùng TanStack Query; Zustand chỉ dành cho state giao diện do client sở hữu. Form dùng React Hook Form cùng schema Zod đã có. Motion dùng `motion`; carousel có điều khiển chỉ dùng Embla, rail đơn giản dùng scroll-snap CSS.
- Admin dùng TanStack Table, Recharts, Sonner, Tiptap, i18next, dnd-kit và Driver.js theo đúng feature. Storefront dùng Sonner, ReactPlayer, React Leaflet và React Share. Phân tích hành vi chỉ dùng GA4 qua bridge hiện có, có kiểm tra consent; không nạp thêm Clarity. Không thêm Swiper, Helmet, GSAP, Three.js hoặc một thư viện thứ hai cho cùng vai trò.
- API là Laravel REST với access JWT trong bộ nhớ và refresh token qua cookie httpOnly; không dùng Sanctum theo giả định cũ. Giá, tồn kho và quyền hạn vẫn do API quyết định.
- Tiền VND và ngày dùng `Intl` qua helper dùng chung. SEO title/meta/canonical/JSON-LD dùng hook hiện có; sitemap/robots do Laravel cung cấp. GA4 không khởi tạo nếu thiếu consent analytics hoặc Measurement ID.

### 0.2a Route chuẩn trong repo

Các URL dưới đây là route hiện được Storefront đăng ký; các tên route trong phần plan còn lại là tên mô tả và cần quy đổi khi đối chiếu implementation.

| Tên cũ trong plan | Route chuẩn |
| --- | --- |
| `/shop` | `/products` |
| `/category/:slug` | `/categories/:slug` |
| `/product/:slug` | `/products/:slug` |
| `/wishlist` | `/account/wishlist` |
| `/policy/:slug` | `/pages/:slug` (nếu CMS page đã xuất bản) |
| `/size-guide` | Bảng size theo danh mục/biến thể tại trang chi tiết sản phẩm; chưa có route độc lập |

Các route hiện có khác gồm `/collections`, `/collections/:slug`, `/lookbook/:slug`, `/brands`, `/search`, `/cart`, `/checkout`, `/track-order`, `/stores`, `/blog`, `/faq` và `/account/*`. Source route chuẩn: `storefront/src/app/route-paths.ts`.

### 0.3 Thành phần dùng chung

| Thành phần | Chức năng |
| --- | --- |
| Header | Logo, menu mega, tìm kiếm, wishlist, giỏ, tài khoản; sticky, thu nhỏ khi cuộn |
| Mega menu | Nhóm danh mục, ảnh gợi ý, link Sale/Mới |
| Search box | Gợi ý tức thì (debounce), lịch sử tìm kiếm, sản phẩm gợi ý |
| Mini-cart drawer | Trượt từ phải, sửa số lượng, xóa, tổng tiền, nút Xem giỏ/Thanh toán |
| Account dropdown | Chưa đăng nhập: Đăng nhập/Đăng ký. Đã đăng nhập: Tài khoản, Đơn hàng, Yêu thích, Địa chỉ, Mã giảm giá, Đánh giá, Đăng xuất |
| ProductCard | Ảnh (hover đổi ảnh), chấm màu, tên, giá gốc/giá giảm, nhãn Mới/Sale/Hết hàng, tim, quick view |
| QuickView modal | Xem nhanh, chọn màu/size, thêm giỏ |
| Breadcrumb, Pagination, Rating, PriceTag (VND), Badge, EmptyState, Skeleton, Toast, ScrollToTop |  |
| Footer | Giới thiệu, chính sách, hỗ trợ, đăng ký nhận tin, mạng xã hội, phương thức thanh toán (từ settings) |

### 0.4 Quy ước chung

- Tiền tệ VND, định dạng 1.250.000₫. Giá giảm hiển thị giá cũ gạch ngang và % giảm.
- Mỗi trang có 4 trạng thái: loading (skeleton), có dữ liệu, rỗng, lỗi (nút thử lại).
- Hành động cần đăng nhập (wishlist, đánh giá, thanh toán tùy cấu hình) chuyển tới /login kèm redirect quay lại.
- Khả năng truy cập: alt cho ảnh, focus rõ, điều hướng bằng bàn phím, tương phản đủ.

---

## 1. Trang chủ `/`

**Mục tiêu:** gây ấn tượng thương hiệu, dẫn khách vào danh mục, bộ sưu tập và sản phẩm.

| # | Section | Chiều cao tương đối | Nội dung và thành phần |
| --- | --- | --- | --- |
| 1 | Hero slider | 85–100% viewport | Ảnh lớn từ banners (position=hero), tiêu đề, mô tả, nút CTA, chấm/mũi tên điều hướng, tự chạy, hiệu ứng parallax nhẹ |
| 2 | Thanh ưu đãi | 4% | Miễn phí vận chuyển, đổi trả, thanh toán an toàn (icon + chữ) |
| 3 | Danh mục nổi bật | \~50% | 4–6 ô ảnh lớn (Nam, Nữ, Giày, Túi, Phụ kiện), hover phóng nhẹ + hiện nút Mua ngay |
| 4 | Hàng mới về | \~60% | Tiêu đề, tab (Tất cả/Nam/Nữ/Phụ kiện), carousel ProductCard, nút Xem tất cả |
| 5 | Banner khuyến mãi | \~40% | Banner đôi hoặc đơn, đếm ngược flash sale, mã coupon có nút sao chép |
| 6 | Bộ sưu tập | \~70% | Bố cục bất đối xứng (1 ảnh lớn + 2 nhỏ) từ collections, mô tả ngắn, CTA |
| 7 | Bán chạy | \~60% | Lưới 4 cột sản phẩm bán chạy |
| 8 | Lookbook / phối đồ | \~60% | Ảnh outfit đầy đủ, chấm hotspot bấm vào hiện sản phẩm và giá, nút Thêm cả bộ |
| 9 | Thương hiệu | \~15% | Dải logo chạy ngang (marquee) |
| 10 | Đánh giá khách hàng | \~40% | Slider trích dẫn, sao, ảnh khách (lấy từ reviews nổi bật) |
| 11 | Đăng ký nhận tin | \~25% | Ô email, nút đăng ký, thông báo thành công |

**Chức năng:** thêm yêu thích từ card, quick view, sao chép coupon, đăng ký newsletter, lazy-load từng section khi cuộn, hiệu ứng reveal. **API:** GET /banners, /categories?featured, /collections?featured, /products?sort=newest|best\_seller|on\_sale, /brands, /reviews?featured, POST /newsletter.

---

## 2. Trang danh sách sản phẩm

**Đường dẫn:** `/shop`, `/category/:slug`, `/brand/:slug`, `/collection/:slug`, `/sale`, `/new`.

**Bố cục:** tiêu đề danh mục (banner mỏng \~20% chiều cao) → thanh công cụ → \[bộ lọc 22% | lưới sản phẩm 78%\] trên desktop; trên mobile bộ lọc là drawer.

**Thành phần:**

- Breadcrumb, tiêu đề, mô tả danh mục, số lượng sản phẩm.
- Chip danh mục con (từ categories cha–con).
- **Bộ lọc:** danh mục, thương hiệu (checkbox + tìm), màu (ô màu, từ colors), size (nút, từ sizes), khoảng giá (slider hai đầu + ô nhập), đánh giá từ sao trở lên, chỉ còn hàng, đang giảm giá. Hiển thị chip bộ lọc đang áp dụng và nút Xóa tất cả.
- **Sắp xếp:** mới nhất, bán chạy, giá tăng/giảm, đánh giá cao, giảm giá nhiều.
- Nút đổi chế độ lưới (2/3/4 cột).
- Lưới ProductCard; phân trang hoặc Tải thêm (infinite scroll tùy chọn).

**Chức năng:** bộ lọc và sắp xếp lưu trong URL (chia sẻ/refresh giữ nguyên), prefetch trang chi tiết khi hover, thêm yêu thích, quick view, nhớ vị trí cuộn khi quay lại. **Trạng thái:** skeleton lưới, không có kết quả (gợi ý bỏ bớt bộ lọc, sản phẩm đề xuất). **API:** GET /products?category=&brand=&collection=&color\[\]=&size\[\]=&price\_min=&price\_max=&rating=&in\_stock=&sale=&sort=&page=; GET /filters (các giá trị lọc kèm số lượng).

---

## 3. Tìm kiếm `/search?q=`

- Ô tìm lớn ở đầu trang, hiển thị 'Kết quả cho "..."' và số lượng.
- Dùng lại bộ lọc/sắp xếp/lưới của mục 2.
- Gợi ý khi gõ (dropdown): sản phẩm (ảnh nhỏ + giá), danh mục, thương hiệu.
- Không có kết quả: gợi ý sửa từ khóa, từ khóa phổ biến, sản phẩm bán chạy.
- API: GET /search/suggest?q=, GET /products?q=.

---

## 4. Chi tiết sản phẩm `/product/:slug`

**Bố cục desktop:** \[gallery 55% | thông tin 45%\], bên dưới là tab và các carousel; thông tin cột phải sticky khi cuộn.

**Gallery:**

- Ảnh lớn + dải thumbnail dọc, zoom khi di chuột, lightbox toàn màn hình, vuốt trên mobile.
- Ảnh đổi theo màu đang chọn (product\_images gắn color).
- Tab Xem 3D/360° (nếu có), video ngắn (tùy chọn).

**Thông tin:**

- Breadcrumb, thương hiệu (link), tên, SKU, sao + số đánh giá (cuộn tới phần đánh giá).
- Giá, giá gốc, % giảm, thông báo tiết kiệm.
- Chọn **màu** (ô màu, tên màu hiển thị khi chọn), chọn **size** (nút; size hết hàng bị làm mờ gạch chéo), liên kết Hướng dẫn chọn size (modal).
- Số lượng (+/-, giới hạn theo tồn kho variant), thông báo 'Chỉ còn N sản phẩm'.
- Nút **Thêm vào giỏ** (hiệu ứng bay vào giỏ), **Mua ngay**, tim Yêu thích, Chia sẻ.
- Khối cam kết: giao hàng, đổi trả, kiểm tra hàng; ước tính ngày giao theo tỉnh/thành.
- Nhận thông báo khi có hàng (nếu variant hết).

**Tab nội dung:** Mô tả; Chi tiết & chất liệu (thông số, hướng dẫn giặt); Đánh giá; Hỏi đáp (tùy chọn); Giao hàng & đổi trả.

**Đánh giá (reviews):** điểm trung bình, biểu đồ phân bổ 5–1 sao, bộ lọc (sao, có ảnh), sắp xếp, danh sách (tên, sao, ngày, size đã mua, nội dung, ảnh, nhãn Đã mua hàng), hữu ích/không, phân trang; form viết đánh giá (sao, nội dung, tải ảnh) chỉ cho người đã mua.

**Khối phụ:** Phối cùng (outfit và phụ kiện đi kèm, nút Thêm cả bộ), Sản phẩm liên quan, Đã xem gần đây (localStorage), thanh mua nhanh dính đáy trên mobile.

**Chức năng đặc biệt:** chọn variant → cập nhật giá, tồn kho, ảnh; lưu vào lịch sử xem; JSON-LD Product (giá, tồn kho, rating) cho SEO. **API:** GET /products/:slug (kèm variants, images, brand, category), GET /products/:id/reviews, POST /reviews, GET /products/:id/related, GET /products/:id/outfit, POST /cart/items, POST /wishlist, POST /stock-alerts.

---

## 5. Bộ sưu tập `/collections` và Thương hiệu `/brands`

- **Danh sách:** lưới ảnh bìa lớn (2–3 cột) kèm tên, mô tả ngắn, số sản phẩm; hover phóng ảnh.
- **Trang bộ sưu tập `/collection/:slug`:** banner bìa toàn chiều rộng (\~45% viewport), mô tả/câu chuyện, rồi lưới sản phẩm như mục 2.
- **Trang thương hiệu:** logo, giới thiệu, rồi lưới sản phẩm của thương hiệu.
- API: GET /collections, /collections/:slug, /brands, /brands/:slug.

---

## 6. Giỏ hàng `/cart`

**Bố cục:** \[danh sách item 65% | tóm tắt đơn 35%\], tóm tắt dính khi cuộn.

**Thành phần:**

- Mỗi dòng: ảnh, tên (link), màu/size, đơn giá, số lượng (+/-), thành tiền, Xóa, Chuyển sang yêu thích. Cảnh báo nếu hết hàng hoặc giá đổi.
- Ô nhập **mã giảm giá**, danh sách coupon khả dụng để chọn nhanh; hiển thị lỗi (hết hạn, chưa đủ giá trị tối thiểu, hết lượt).
- Tóm tắt: tạm tính, giảm giá, phí vận chuyển (ước tính hoặc miễn phí từ ngưỡng, thanh tiến độ 'Mua thêm X để miễn phí ship'), tổng cộng.
- Nút **Tiến hành thanh toán**, Tiếp tục mua sắm, ghi chú đơn hàng.
- Gợi ý mua kèm / có thể bạn thích.

**Chức năng:** khách chưa đăng nhập lưu giỏ ở local, khi đăng nhập thì gộp vào giỏ server; cập nhật số lượng có debounce; kiểm tra tồn kho theo thời gian thực. **Trạng thái rỗng:** minh họa + nút đi mua sắm + sản phẩm gợi ý. **API:** GET /cart, POST/PATCH/DELETE /cart/items, POST /cart/merge, POST /cart/coupon, DELETE /cart/coupon, GET /shipping/estimate.

---

## 7. Thanh toán `/checkout`

**Bố cục:** \[biểu mẫu từng bước 60% | tóm tắt đơn 40%\]; thanh tiến trình Giao hàng → Vận chuyển → Thanh toán → Xác nhận.

**Các bước:**

1. **Thông tin giao hàng:** chọn địa chỉ đã lưu (addresses) hoặc nhập mới (họ tên, SĐT, tỉnh/thành, quận/huyện, phường/xã, địa chỉ cụ thể, loại địa chỉ), email (khách vãng lai), lưu địa chỉ.
2. **Vận chuyển:** các phương thức (tiêu chuẩn/nhanh), phí, thời gian dự kiến.
3. **Thanh toán:** COD, chuyển khoản (hiển thị thông tin tài khoản/QR), cổng/ví điện tử; mô tả từng phương thức.
4. **Xác nhận:** xem lại, mã giảm giá, ghi chú, đồng ý điều khoản, nút **Đặt hàng**.

**Tóm tắt đơn:** danh sách item thu gọn, tạm tính, giảm giá, phí ship, tổng cộng. **Chức năng:** kiểm tra hợp lệ biểu mẫu (zod), chống đặt trùng (nút khóa + idempotency key), kiểm tra lại tồn kho khi đặt, trừ kho tạo inventory\_movements, tạo orders/order\_items/payments/shipments. **API:** GET /addresses, POST /addresses, GET /shipping/methods, GET /payment/methods, POST /orders, POST /payments/:id/confirm (hoặc callback cổng thanh toán).

## 8. Đặt hàng thành công `/order-success/:code`

- Biểu tượng thành công (animation), mã đơn, tổng tiền, phương thức, địa chỉ, ngày giao dự kiến.
- Nếu chuyển khoản: thông tin và QR thanh toán, hạn thanh toán.
- Nút Xem đơn hàng, Tiếp tục mua sắm; email xác nhận được gửi.

## 9. Tra cứu đơn hàng `/track-order`

- Form: mã đơn + email hoặc SĐT.
- Kết quả: trạng thái hiện tại, timeline (Đã đặt → Xác nhận → Đóng gói → Đang giao → Đã giao), đơn vị vận chuyển + mã vận đơn (từ shipments), danh sách sản phẩm.
- API: POST /orders/track.

---

## 10. Xác thực

| Trang | Thành phần và chức năng |
| --- | --- |
| `/login` | Bố cục chia đôi (ảnh thương hiệu 45% |
| `/register` | Họ tên, email, SĐT, mật khẩu + xác nhận (thanh độ mạnh mật khẩu), đồng ý điều khoản, đăng ký nhận tin (tùy chọn); kiểm tra email trùng theo thời gian thực |
| `/forgot-password` | Nhập email, gửi link đặt lại; luôn hiển thị thông báo trung tính để tránh lộ email tồn tại; nút gửi lại có đếm ngược |
| `/reset-password/:token` | Mật khẩu mới + xác nhận; xử lý token hết hạn; thành công thì chuyển về đăng nhập |
| `/verify-email` | Thông báo đã gửi email xác thực, nút gửi lại, xử lý link xác thực |

API: POST /auth/login, /auth/register, /auth/logout, /auth/forgot-password, /auth/reset-password, GET /auth/verify-email/:id/:hash, GET /me.

---

## 11. Khu vực tài khoản `/account/*` (trang nhấn mạnh)

**Bố cục chung:** \[sidebar 24% | nội dung 76%\]; mobile chuyển thành thanh tab cuộn ngang hoặc menu thả. Sidebar có avatar, tên, hạng thành viên (nếu có) và các mục bên dưới. Mục đang mở được tô nổi bật; chuyển trang có animation mượt.

### 11.1 Tổng quan `/account`

- Lời chào, avatar, ngày tham gia.
- Thẻ thống kê: đơn đang xử lý, tổng đơn, số yêu thích, coupon khả dụng.
- Đơn hàng gần đây (3–5 đơn, trạng thái, nút xem), lối tắt tới Địa chỉ, Hồ sơ, Mã giảm giá.
- Gợi ý sản phẩm theo lịch sử xem/mua.

### 11.2 Hồ sơ `/account/profile`

- Ảnh đại diện (tải lên, cắt ảnh), họ tên, email (xác thực), SĐT, giới tính, ngày sinh.
- Nút Lưu thay đổi, thông báo thành công; tùy chọn nhận tin khuyến mãi; xóa tài khoản (xác nhận nhiều bước).
- API: GET/PUT /me, POST /me/avatar.

### 11.3 Sổ địa chỉ `/account/addresses`

- Danh sách thẻ địa chỉ (tên, SĐT, địa chỉ đầy đủ, nhãn Nhà riêng/Văn phòng, huy hiệu Mặc định).
- Thêm/sửa trong modal (chọn tỉnh → quận → phường theo cascade), xóa có xác nhận, Đặt làm mặc định.
- API: GET/POST/PUT/DELETE /addresses, PATCH /addresses/:id/default.

### 11.4 Đơn hàng `/account/orders`

- Tab trạng thái: Tất cả, Chờ xác nhận, Đang xử lý, Đang giao, Hoàn tất, Đã hủy, Trả hàng.
- Ô tìm theo mã đơn/tên sản phẩm, lọc theo khoảng ngày.
- Mỗi đơn: mã, ngày, trạng thái (badge màu), ảnh các sản phẩm, tổng tiền; nút Xem chi tiết, Mua lại, Đánh giá (khi hoàn tất), Hủy (khi chưa giao).
- Phân trang. API: GET /orders?status=&q=&from=&to=&page=.

### 11.5 Chi tiết đơn `/account/orders/:code`

- Timeline trạng thái ngang/dọc, thông tin vận chuyển và mã vận đơn (link tra cứu).
- Địa chỉ nhận, phương thức thanh toán + trạng thái thanh toán, ghi chú.
- Danh sách sản phẩm (ảnh, màu/size, số lượng, giá) kèm nút Viết đánh giá từng sản phẩm.
- Tóm tắt tiền: tạm tính, giảm giá, phí ship, tổng.
- Hành động: Hủy đơn (kèm lý do), Yêu cầu đổi/trả, Mua lại, In hóa đơn, Liên hệ hỗ trợ.
- API: GET /orders/:code, POST /orders/:code/cancel, POST /orders/:code/return, POST /orders/:code/reorder, GET /orders/:code/invoice.

### 11.6 Yêu thích `/account/wishlist`

- Lưới ProductCard, nút Thêm vào giỏ (hoặc chọn size nếu cần), Xóa, Chia sẻ danh sách; nhãn Giảm giá/Sắp hết/Hết hàng; Thêm tất cả vào giỏ.
- API: GET/POST/DELETE /wishlist.

### 11.7 Mã giảm giá `/account/coupons`

- Tab Khả dụng / Đã dùng / Hết hạn; thẻ coupon (mã, giá trị, điều kiện tối thiểu, hạn dùng, nút Sao chép, Dùng ngay).
- Ô nhập mã để lưu vào ví. API: GET /me/coupons, POST /me/coupons.

### 11.8 Đánh giá của tôi `/account/reviews`

- Tab Chờ đánh giá (sản phẩm đã mua chưa đánh giá, nút Viết đánh giá) và Đã đánh giá (sửa, xóa).
- Form: sao, tiêu đề, nội dung, tải tối đa vài ảnh, chọn size cảm nhận (vừa/rộng/chật).
- API: GET /me/reviews, POST/PUT/DELETE /reviews.

### 11.9 Đổi mật khẩu `/account/password`

- Mật khẩu hiện tại, mới, xác nhận; thanh độ mạnh; tùy chọn đăng xuất các thiết bị khác. API: PUT /me/password.

### 11.10 Thông báo `/account/notifications`

- Danh sách (cập nhật đơn hàng, khuyến mãi, hết hàng đã đăng ký), đánh dấu đã đọc, đọc tất cả, cài đặt kênh nhận (email/SMS). API: GET/PATCH /notifications.

### 11.11 Đăng xuất

- Xóa token/phiên, xóa state, về trang chủ.

---

## 12. Trang thông tin và hỗ trợ

### 12.1 Giới thiệu `/about`

- Hero ảnh + câu khẩu hiệu; câu chuyện thương hiệu (chữ/ảnh xen kẽ); giá trị cốt lõi (3–4 icon); số liệu nổi bật (đếm số khi cuộn); đội ngũ; cam kết chất lượng/bền vững; CTA khám phá bộ sưu tập.

### 12.2 Liên hệ `/contact`

- Form (họ tên, email, SĐT, chủ đề, nội dung) kiểm tra hợp lệ, chống spam (honeypot/captcha); thông tin liên hệ, giờ mở cửa, mạng xã hội, bản đồ nhúng. API: POST /contact.

### 12.3 Hệ thống cửa hàng `/stores`

- Danh sách chi nhánh + bản đồ, tìm theo tỉnh/thành, giờ mở cửa, chỉ đường.

### 12.4 FAQ `/faq`

- Nhóm theo chủ đề (Đặt hàng, Thanh toán, Vận chuyển, Đổi trả, Tài khoản), accordion, ô tìm câu hỏi, liên kết liên hệ nếu chưa giải đáp.

### 12.5 Hướng dẫn chọn size `/size-guide`

- Tab theo loại (áo, quần, giày, túi/phụ kiện), bảng size theo cm, cách đo kèm hình minh họa, công cụ gợi ý size (nhập chiều cao/cân nặng).

### 12.6 Chính sách

- `/policy/shipping`, `/policy/returns`, `/policy/payment`, `/policy/privacy`, `/terms`: trang văn bản có mục lục bên trái, nội dung lấy từ settings hoặc CMS, ngày cập nhật.

### 12.7 Blog `/blog`, `/blog/:slug` (tùy chọn)

- Danh sách bài (ảnh, tiêu đề, tóm tắt, ngày), lọc theo chủ đề; bài viết có sản phẩm được nhắc đến và chia sẻ.

## 13. Trang hệ thống

- **404:** minh họa, ô tìm kiếm, nút về trang chủ, danh mục gợi ý.
- **Lỗi/500:** thông báo thân thiện, nút thử lại.
- **Bảo trì:** bật qua settings, hiển thị thời gian dự kiến.
- **Không có quyền / hết phiên:** chuyển tới đăng nhập, giữ đường dẫn quay lại.

---

## 14. Tổng hợp endpoint API

**Đã có theo schema (dự kiến):** products, categories, brands, colors, sizes, collections, cart, wishlist, coupons, orders, payments, shipments, reviews, banners, settings, addresses, auth.

**Nên bổ sung:**

- GET /filters (giá trị lọc kèm số lượng), GET /search/suggest.
- GET /products/:id/outfit (phối cùng), POST /stock-alerts (báo có hàng).
- POST /cart/merge, POST/DELETE /cart/coupon, GET /shipping/estimate, GET /shipping/methods, GET /payment/methods.
- POST /orders/track, POST /orders/:code/cancel|return|reorder, GET /orders/:code/invoice.
- GET/POST /me/coupons, GET /me/reviews, GET/PATCH /notifications, POST /me/avatar, PUT /me/password.
- POST /newsletter, POST /contact, GET /stores.

## 15. Quy ước ảnh sản phẩm (nhẹ, số lượng lớn)

- Mỗi sản phẩm nhiều góc (mặt trước, sau, chi tiết, người mẫu, lifestyle) cho mọi nhóm: giày, túi, quần áo, phụ kiện.
- Ảnh phối đồ: mỗi loại sản phẩm có ảnh outfit kèm phụ kiện phù hợp, gắn hotspot để dẫn tới sản phẩm.
- Xuất WebP/AVIF, nhiều kích thước (400/800/1600), mục tiêu mỗi ảnh nhỏ (khoảng dưới 100–150 KB), đặt tên nhất quán theo slug-màu-góc.

---

# PHẦN BỔ SUNG TRƯỚC KHI CHỐT PLAN

Phần này bổ sung và làm rõ các mục ở trên: cách dùng thư viện đã chọn, hệ thống bố cục theo quan hệ tỉ lệ, hiệu ứng/thao tác, phong cách UI và màu sắc, bố cục chi tiết khu vực Account, kế hoạch ảnh sản phẩm số lượng lớn, API bổ sung và danh sách việc còn thiếu.

## 16. Cách dùng thư viện đã chọn (thay thế mục 0.2)

Quy tắc: thư viện đã chốt trong architecture thì dùng đúng, không thêm thư viện thứ hai cho cùng một vai trò. Các tên thư viện nêu ở mục 0.2 chỉ là ví dụ ban đầu; khi triển khai, thay bằng thư viện thật của dự án theo vai trò dưới đây.

| Vai trò | Dùng cho thành phần nào | Cách dùng |
| --- | --- | --- |
| Router | Mọi trang, route guard `/account/*`, redirect sau đăng nhập | Lazy-load theo trang, khôi phục vị trí cuộn, bộ lọc/sắp xếp/phân trang lưu trong query string |
| Data fetching và cache | Danh sách, chi tiết, giỏ, đơn hàng, đánh giá | Cache theo query key, prefetch khi hover card, retry, invalidate sau khi thêm giỏ/đặt hàng, optimistic update cho wishlist và số lượng giỏ |
| State toàn cục | Phiên đăng nhập, giỏ hàng, drawer/modal, bộ lọc đang mở | Chỉ giữ state giao diện và phiên; dữ liệu server để cho lớp cache |
| Form và validation | Đăng nhập/đăng ký, checkout, địa chỉ, hồ sơ, đánh giá, liên hệ | Một schema dùng chung cho form và kiểm tra lỗi, thông báo lỗi theo từng ô, khóa nút khi đang gửi |
| Animation | Chuyển trang, reveal khi cuộn, hover card, drawer, bay vào giỏ, đếm số | Dùng preset chung (thời lượng, easing) để toàn site đồng nhất; tôn trọng chế độ giảm chuyển động |
| Slider/carousel | Hero, carousel sản phẩm, đánh giá, thumbnail gallery | Một cấu hình mặc định, tự dừng khi hover, hỗ trợ vuốt và bàn phím |
| Icon | Header, nút hành động, badge, trạng thái đơn | Một bộ icon duy nhất, cùng độ dày nét và kích thước theo đơn vị em |
| 3D / 360° | Gallery chi tiết sản phẩm, hero trang chủ (tùy chọn) | Tải lười khi người dùng mở tab, có ảnh dự phòng khi thiết bị yếu |
| Toast / thông báo | Thêm giỏ, lưu địa chỉ, lỗi API | Vị trí cố định, tự ẩn, có nút hoàn tác khi xóa |
| Bảng/lưới dữ liệu (nếu architecture có) | Lịch sử đơn hàng, coupon | Dạng bảng trên desktop, tự đổi thành thẻ trên mobile |
| Component kit (nếu có) | Modal, drawer, dropdown, tabs, accordion, tooltip, rating | Dùng làm nền cho mọi thành phần tương tác để thống nhất truy cập bàn phím |
| Định dạng ngày/tiền | Ngày giao, VND, % giảm | Một hàm dùng chung, không tự format rải rác |
| Head/SEO | Title, meta, Open Graph, JSON-LD sản phẩm | Cấu hình theo từng route |
| Xử lý ảnh | Card, gallery, banner | Lazy-load, srcset, blur-up, tỉ lệ khung cố định để không nhảy bố cục |

## 17. Hệ thống bố cục theo quan hệ tỉ lệ

### 17.1 Nguyên tắc

- Mọi kích thước dùng đơn vị tương đối: %, fr, vw/vh, rem, clamp(). Không đặt px cố định cho khung lớn.
- Chia bố cục theo quan hệ giữa các khối (ví dụ 22/78, 55/45, 62/38) thay vì nhồi một khối to. Mỗi section tối đa 2–3 vùng nhìn chính, giữa các section có khoảng thở.
- Thang khoảng cách (rem): 0,25 · 0,5 · 0,75 · 1 · 1,5 · 2 · 3 · 4 · 6 · 8. Padding section = clamp(3rem, 8vw, 7rem). Khoảng cách giữa card = 1–1,5rem.
- Lưới 12 cột; số cột sản phẩm: mobile 2, tablet 3, desktop 4, màn rộng 5.
- Điểm gãy: điện thoại, máy tính bảng dọc, laptop, màn rộng; layout chuyển từ nhiều cột sang xếp dọc, sidebar thành drawer.

### 17.2 Tỉ lệ khung ảnh (aspect-ratio)

| Khung | Tỉ lệ |
| --- | --- |
| Ảnh sản phẩm (card, gallery) | 4:5 |
| Hero desktop / mobile | 16:9 hoặc 21:9 / 4:5 |
| Ô danh mục | 3:4 |
| Bìa bộ sưu tập | 16:9 và 3:4 xen kẽ |
| Lookbook | 4:5 |
| Avatar, logo thương hiệu | 1:1 |

### 17.3 Tỉ lệ chiều cao các thành phần chung

- Header: khoảng 6–7% chiều cao màn hình (thu nhỏ còn khoảng 5% khi cuộn). Thanh ưu đãi trên cùng khoảng 3–4%.
- Hero: 80–100% chiều cao màn hình trừ header.
- Mỗi section nội dung: 50–70% chiều cao màn hình, xen kẽ section dày và section mỏng để tạo nhịp.
- Footer: nền tối, 3 vùng: \[thương hiệu + newsletter 35% | liên kết 40% | thanh toán + mạng xã hội 25%\], dòng bản quyền bên dưới.

### 17.4 Tỉ lệ cột theo trang

| Trang | Desktop | Mobile |
| --- | --- | --- |
| Danh sách sản phẩm | Bộ lọc 22% / lưới 78% | Bộ lọc thành drawer, lưới 2 cột |
| Chi tiết sản phẩm | Gallery 55% / thông tin 45% (sticky) | Gallery trên, thông tin dưới, thanh mua nhanh dính đáy |
| Giỏ hàng | Danh sách 65% / tóm tắt 35% (sticky) | Xếp dọc, tóm tắt dính đáy |
| Thanh toán | Form 60% / tóm tắt 40% | Xếp dọc, tóm tắt thu gọn |
| Đăng nhập/đăng ký | Ảnh 45% / form 55% | Chỉ form |
| Account | Sidebar 22% / nội dung 78% | Thanh tab cuộn ngang |

## 18. Hiệu ứng và thao tác chuẩn

| Vị trí | Hiệu ứng / thao tác |
| --- | --- |
| Header | Dính trên cùng, thu nhỏ và đổ bóng nhẹ khi cuộn xuống, ẩn khi cuộn xuống nhanh và hiện lại khi cuộn lên; mega menu mở dần có độ trễ nhỏ |
| Chuyển trang | Mờ dần + trượt nhẹ; giữ header và footer đứng yên |
| Reveal khi cuộn | Section, tiêu đề, card hiện dần theo thứ tự (stagger), chỉ chạy một lần |
| ProductCard | Hover đổi sang ảnh thứ hai, ảnh phóng nhẹ, hiện nút Quick view và tim; chạm trên mobile hiện nút cố định |
| Thêm vào giỏ | Ảnh thu nhỏ bay tới icon giỏ, icon giỏ nảy nhẹ và số cập nhật, mở mini-cart |
| Mini-cart, bộ lọc mobile, menu mobile | Drawer trượt, nền mờ, khóa cuộn trang, đóng bằng Esc hoặc bấm nền |
| Gallery sản phẩm | Zoom theo vị trí chuột, vuốt trên mobile, lightbox, đổi ảnh theo màu đang chọn có hiệu ứng mờ chéo |
| Hero | Slide tự chạy, parallax nhẹ, chữ trượt vào từng dòng |
| Marquee thương hiệu | Chạy ngang liên tục, dừng khi hover |
| Số liệu (About) | Đếm số khi vào vùng nhìn |
| Tải dữ liệu | Skeleton có ánh sáng quét; không dùng spinner toàn trang |
| Form | Nhãn nổi, kiểm tra lỗi ngay khi rời ô, rung nhẹ khi lỗi, tích xanh khi hợp lệ |
| Wishlist | Tim phóng to và đổi màu, cập nhật lạc quan, hoàn tác qua toast |
| Account | Chuyển giữa các mục bằng trượt ngang nhẹ, thẻ thống kê đếm số, timeline đơn hàng tô dần theo tiến độ |
| Trang thành công | Dấu tích vẽ nét, hiệu ứng chúc mừng nhẹ |
| Giảm chuyển động | Khi hệ điều hành bật giảm chuyển động thì tắt parallax, marquee, bay vào giỏ |

## 19. Phong cách UI và màu sắc

**Định hướng:** thời trang hiện đại, biên tập (editorial) và tối giản: nhiều khoảng trắng, ảnh lớn, chữ thanh, đường viền mảnh, góc bo nhỏ, bóng mờ nhẹ. Tham khảo tinh thần của các trang thời trang cao cấp tối giản và các thương hiệu fast-fashion hiện đại (bố cục lưới sạch, ảnh người mẫu cỡ lớn, menu mega rõ ràng); đối chiếu với các reference bạn đã thu thập để tinh chỉnh.

**Bảng màu trong phần này đã lỗi thời và không còn là chỉ dẫn triển khai.** Dùng token và bảng màu hiện hành trong [`docs/ui-ux/DESIGN.md`](docs/ui-ux/DESIGN.md): nền `#f9f8f5`, chữ `#252522`, màu chính burgundy `#7f2638`. Không dùng bảng camel/xanh rêu/đen ở bản plan cũ cho thay đổi UI mới.

**Chữ:** một font hiển thị có chân (serif) cho tiêu đề lớn và một font không chân cho nội dung; cỡ chữ co giãn bằng clamp(); tiêu đề lớn dùng khoảng cách chữ rộng hơn một chút, nút bấm in hoa nhỏ.

**Thành phần:** dùng màu hành động theo token hiện hành trong `docs/ui-ux/DESIGN.md`; nút phụ viền mảnh; card và trạng thái tương tác tuân theo design system hiện có; bo góc nhỏ đồng nhất; icon nét mảnh.

**Cân bằng thị giác:** xen kẽ section sáng và section tối; mỗi màn hình tối đa một vùng nhấn mạnh; ảnh lớn đi kèm vùng chữ ít để tránh dồn một cục.

## 20. Bố cục chi tiết khu vực Account (nhấn mạnh)

**Khung chung:** sidebar 22% (avatar 1:1 nhỏ, tên, hạng thành viên, danh sách mục, nút đăng xuất ở đáy) và vùng nội dung 78% có tiêu đề trang + mô tả ngắn ở trên cùng. Mục đang mở có thanh nhấn màu camel bên trái. Trên mobile, sidebar thành thanh tab cuộn ngang dính dưới header.

| Trang | Bố cục theo quan hệ tỉ lệ |
| --- | --- |
| Tổng quan | Hàng 1: lời chào + avatar 100%. Hàng 2: 4 thẻ thống kê, mỗi thẻ 25%. Hàng 3: \[đơn gần đây 62% / cột phải 38% gồm coupon sắp hết hạn trên, wishlist xem trước dưới\]. Hàng 4: gợi ý sản phẩm 100% (carousel) |
| Hồ sơ | \[Cột ảnh đại diện 28% / form 72%\]; form chia hai cột 50/50, trường dài (email) chiếm 100%; thanh lưu dính đáy |
| Địa chỉ | Lưới 2 cột 50/50 gồm thẻ địa chỉ; thẻ «Thêm địa chỉ» nét đứt cùng kích thước; form thêm/sửa trong modal |
| Đơn hàng | Thanh tab trạng thái 100%, thanh tìm kiếm + lọc ngày; mỗi dòng đơn: \[ảnh 12% / thông tin 48% / tổng tiền 18% / hành động 22%\] |
| Chi tiết đơn | Hàng 1: timeline tiến độ 100%. Hàng 2: \[danh sách sản phẩm 62% / cột phải 38% gồm địa chỉ, thanh toán, tóm tắt tiền\] |
| Yêu thích | Lưới 3 cột (mỗi cột \~33%), thanh hành động hàng loạt phía trên |
| Mã giảm giá | Lưới 2 cột; thẻ coupon chia \[giá trị nổi bật 35% / điều kiện + nút 65%\] |
| Đánh giá | Hai tab; mỗi mục \[ảnh 14% / nội dung 86%\] |
| Đổi mật khẩu | Form hẹp \~50% chiều rộng vùng nội dung, căn trái, cạnh bên là gợi ý bảo mật |
| Thông báo | Danh sách một cột, mỗi dòng \[icon 8% / nội dung 80% / thời gian 12%\] |

Trạng thái rỗng cho mọi mục: minh họa + một câu + nút hành động liên quan.

## 21. Kế hoạch ảnh sản phẩm số lượng lớn

### 21.1 Quy mô mục tiêu

| Nhóm | Loại sản phẩm (số lượng) | Tổng |
| --- | --- | --- |
| Giày | Sneaker 16, giày da/công sở 10, boots 8, sandal/dép 10, giày thể thao 8, cao gót/búp bê 8 | 60 |
| Túi | Tote 10, đeo chéo 10, balo 8, túi xách tay 8, clutch 6, ví/bóp 8 | 50 |
| Áo | Thun 20, polo 10, sơ mi 14, hoodie/sweater 14, áo len/cardigan 10, áo khoác 16, blazer/vest 8, áo kiểu nữ/crop 8 | 100 |
| Quần | Jeans 14, kaki/chinos 10, quần tây 8, jogger/thể thao 8, short 10 | 50 |
| Váy, đầm | Đầm maxi 10, đầm công sở 10, chân váy 10, jumpsuit/set 10 | 40 |
| Phụ kiện | Mũ 10, thắt lưng 8, kính 10, đồng hồ 8, trang sức 14, khăn 8, tất 6, cà vạt/nơ 6 | 70 |
| Đồ lót, đồ ngủ, đồ bơi | Các loại | 20 |
| **Tổng** |  | **≈ 390 sản phẩm** |

Mỗi sản phẩm trung bình 3 màu, mỗi màu 4–6 góc (mặt trước, sau, cạnh, chi tiết, người mẫu, lifestyle) ⇒ khoảng 4.500–5.500 ảnh. Chia giai đoạn:

- **Giai đoạn 1 (MVP):** \~120 sản phẩm tiêu biểu trải đều mọi nhóm, 2–3 màu, 4 góc ⇒ khoảng 1.000–1.400 ảnh; đủ dựng và kiểm thử toàn bộ giao diện.
- **Giai đoạn 2:** hoàn thiện đủ \~390 sản phẩm.

Ảnh ngoài sản phẩm: 12 banner hero, 20 bìa bộ sưu tập, 20 ô danh mục, 40 ảnh lookbook/outfit (kèm tọa độ hotspot), 12 logo thương hiệu, 10 ảnh trang About và Blog.

### 21.2 Phối đồ và phụ kiện

Mỗi loại sản phẩm có bộ ảnh outfit: sản phẩm chính phối cùng 2–4 món phù hợp (ví dụ sneaker + quần jogger + áo thun + balo; đầm + túi xách tay + giày cao gót + trang sức). Mỗi outfit lưu danh sách sản phẩm liên quan để dựng khối «Phối cùng» và hotspot.

### 21.3 Thông số ảnh (giữ dung lượng nhỏ)

- Khung 4:5, nền studio xám/kem nhạt đồng nhất, ánh sáng mềm, bóng đổ nhẹ, phong cách nhất quán trên toàn bộ ảnh.
- Xuất WebP (AVIF nếu có thể), ba kích thước: 400 / 800 / 1600 px chiều ngang.
- Ngân sách dung lượng: bản 400 ≤ 25 KB, bản 800 ≤ 120 KB, bản 1600 ≤ 300 KB.
- Đặt tên: `{nhom}/{slug-san-pham}/{slug-san-pham}__{mau}__{goc}.webp` với góc ∈ front, back, side, detail, model, lifestyle.
- Kèm file manifest CSV/JSON để nạp DB: slug, tên, nhóm, loại, thương hiệu, giá VND, mô tả, màu, size, tồn kho, danh sách ảnh theo màu, outfit liên quan.

### 21.4 Chỉ dẫn mẫu cho agent tạo ảnh

```
Tạo bộ ảnh sản phẩm thời trang cho cửa hàng online.
Nhóm: <giày | túi | áo | quần | váy đầm | phụ kiện>. Loại: <loại cụ thể>.
Mỗi sản phẩm: <N> màu, mỗi màu 4–6 góc: front, back, side, detail, model, lifestyle.
Phong cách: ảnh studio sạch, nền xám/kem nhạt đồng nhất, ánh sáng mềm, bóng đổ nhẹ, khung 4:5, chủ thể ở giữa, chừa lề đều.
Ảnh model: dáng tự nhiên, trang phục tối giản, không logo thương hiệu thật, không chữ.
Ảnh lifestyle/outfit: phối sản phẩm với 2–4 món phù hợp (phụ kiện, giày, túi, quần áo).
Đầu ra: WebP, 3 kích thước 400/800/1600, dung lượng nhỏ theo ngân sách; đặt tên theo quy ước; sinh kèm manifest CSV.
Đa dạng: thay đổi kiểu dáng, chất liệu, màu giữa các sản phẩm, tránh lặp lại.
```

## 22. API bổ sung (tổng hợp)

| Endpoint | Mục đích | Trang dùng |
| --- | --- | --- |
| GET /home | Gom dữ liệu trang chủ trong một lần gọi (banner, danh mục, bộ sưu tập, hàng mới, bán chạy) | Trang chủ |
| GET /menu | Cây danh mục cho mega menu | Header |
| GET /settings/public | Thông tin cửa hàng, thanh toán, chính sách | Footer, Liên hệ, Chính sách |
| GET /filters | Giá trị bộ lọc kèm số lượng | Danh sách, Tìm kiếm |
| GET /search/suggest | Gợi ý khi gõ | Header, Tìm kiếm |
| GET /products/:id/outfit, /related, /recommendations | Phối cùng, liên quan, gợi ý cá nhân | Chi tiết, Account, Giỏ |
| POST /stock-alerts | Báo khi có hàng | Chi tiết |
| POST /cart/merge, POST/DELETE /cart/coupon | Gộp giỏ, áp/gỡ mã | Giỏ, Thanh toán |
| GET /shipping/estimate, /shipping/methods, /payment/methods | Phí và phương thức | Giỏ, Thanh toán |
| POST /orders/track | Tra cứu khách vãng lai | Tra cứu đơn |
| POST /orders/:code/cancel, /return, /reorder; GET /orders/:code/invoice | Thao tác đơn | Account |
| GET /me/dashboard | Thống kê tổng quan Account trong một lần gọi | Account |
| GET/POST /me/coupons, GET /me/reviews, GET/PATCH /notifications | Coupon ví, đánh giá của tôi, thông báo | Account |
| POST /me/avatar, PUT /me/password | Ảnh đại diện, đổi mật khẩu | Account |
| POST /newsletter, POST /contact, GET /stores | Đăng ký tin, liên hệ, cửa hàng | Footer, Liên hệ, Cửa hàng |
| POST /admin/products/import | Nạp hàng loạt sản phẩm và ảnh từ manifest | Admin / seed |

Quy ước chung: Laravel API Resource để thống nhất định dạng, phân trang, giới hạn tần suất cho đăng nhập/tìm kiếm/liên hệ, khóa chống đặt trùng (idempotency key) khi tạo đơn, cache các endpoint đọc nhiều (home, menu, filters).

## 23. Còn thiếu gì trước khi chốt plan

Các mục nên quyết định hoặc xác nhận:

- **Thanh toán:** cổng nào ngoài COD và chuyển khoản (ví dụ cổng nội địa, ví điện tử); xử lý callback và hoàn tiền.
- **Vận chuyển:** có tích hợp API đơn vị vận chuyển để tính phí và lấy mã vận đơn tự động không, hay tính phí theo bảng cố định.
- **Khách vãng lai:** cho phép thanh toán không cần tài khoản hay bắt buộc đăng nhập.
- **Đăng nhập mạng xã hội:** có hay không, nhà cung cấp nào.
- **Ngôn ngữ và tiền tệ:** chỉ tiếng Việt/VND hay thêm tiếng Anh.
- **Chương trình thành viên:** hạng, điểm thưởng, sinh nhật (hiện sidebar Account đã chừa chỗ hạng thành viên).
- **Email/SMS giao dịch:** xác nhận đơn, đổi trạng thái, quên mật khẩu, báo có hàng; mẫu nội dung.
- **SEO:** nếu storefront là ứng dụng chạy phía trình duyệt, cần phương án prerender hoặc render phía máy chủ cho trang sản phẩm/danh mục; sitemap, robots, dữ liệu có cấu trúc.
- **Hiệu năng:** tách mã theo route, mục tiêu điểm Lighthouse, CDN cho ảnh, preload ảnh hero.
- **Truy cập (a11y):** tương phản, focus, nhãn cho icon, điều hướng bàn phím trong menu/drawer/modal.
- **Bảo mật:** CSRF, giới hạn tần suất, kiểm tra loại và dung lượng file tải lên, che thông tin nhạy cảm trong log.
- **Quy tắc nghiệp vụ:** thời hạn đổi trả, điều kiện hủy đơn, luật áp coupon (cộng dồn, tối thiểu, giới hạn lượt), giữ hàng trong giỏ bao lâu.
- **Dữ liệu bảng size:** nội dung số đo cho từng loại sản phẩm.
- **Cookie, quyền riêng tư và analytics:** banner đồng ý cookie, sự kiện theo dõi chuyển đổi.
- **Chế độ tối (dark mode):** có làm hay không (ảnh hưởng bảng màu mục 19).
- **Kiểm thử:** luồng chính cần test tự động: đăng ký/đăng nhập, thêm giỏ, áp mã, thanh toán, xem đơn.
- **Dữ liệu seed và môi trường:** nạp 120 sản phẩm MVP trước, cách đưa ảnh lên (lưu cục bộ hay dịch vụ lưu trữ), cấu hình môi trường dev/staging/production.
