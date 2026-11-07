# Đặc tả chức năng và thành phần các trang Storefront – Website thời trang

Nov 6, 2026

> Khi triển khai, dùng bộ thư viện đã chốt ở [lib.md](lib.md) và architecture frontend. Tên URL trong tài liệu này là nhãn đặc tả; quy đổi `/shop` → `/products`, `/category/:slug` → `/categories/:slug`, `/product/:slug` → `/products/:slug`; `/wishlist` dùng danh sách khách trên trình duyệt, còn danh sách tài khoản yêu cầu đăng nhập tại `/account/wishlist`; và trang chính sách → `/pages/:slug` khi CMS có nội dung đã xuất bản. Route chuẩn được đăng ký tại `storefront/src/app/route-paths.ts`; đối chiếu phần đã làm/còn thiếu tại `specs/detailed-website-layout/implementation-status.md`.

## 0. Thành phần dùng chung (xuất hiện ở hầu hết các trang)

Storefront gồm khoảng 45 trang; các thành phần dưới đây được dựng một lần và dùng lại ở mọi trang, nên cần đặc tả trước.

### 0.1 Thanh thông báo (Announcement bar)

- Nội dung chạy xoay vòng: miễn phí vận chuyển từ X đồng, mã giảm giá, flash sale đang diễn ra
- Nút đóng (ghi nhớ trạng thái đã đóng bằng cookie/localStorage)
- Liên kết bấm vào dẫn đến trang khuyến mãi
- Đồng hồ đếm ngược (khi có chiến dịch)

### 0.2 Header

- Logo (bấm về trang chủ)
- Menu chính: Nữ, Nam, Trẻ em, Phụ kiện, Giày dép, Bộ sưu tập, Sale, Blog
- Mega menu: cột danh mục con, ảnh/banner quảng bá, liên kết nổi bật; trên mobile là menu trượt dạng accordion
- Ô tìm kiếm: biểu tượng mở rộng thành thanh tìm, gợi ý tự động theo từ khóa, từ khóa phổ biến, lịch sử tìm kiếm, sản phẩm gợi ý kèm ảnh và giá
- Biểu tượng tài khoản: chưa đăng nhập hiện Đăng nhập/Đăng ký; đã đăng nhập hiện menu Tài khoản, Đơn hàng, Đăng xuất
- Biểu tượng yêu thích kèm số lượng
- Biểu tượng giỏ hàng kèm số lượng, bấm mở Mini cart
- Bộ chọn ngôn ngữ và tiền tệ (VI/EN, VND/USD)
- Header dính (sticky) khi cuộn, thu gọn kích thước
- Nút menu hamburger trên mobile

### 0.3 Mini cart (giỏ hàng trượt)

- Danh sách sản phẩm: ảnh, tên, size, màu, đơn giá, số lượng
- Nút tăng/giảm số lượng, nút xóa
- Tạm tính, thanh tiến độ miễn phí vận chuyển (còn thiếu bao nhiêu)
- Gợi ý sản phẩm mua kèm
- Nút Xem giỏ hàng và Thanh toán
- Trạng thái giỏ trống kèm gợi ý sản phẩm

### 0.3b Breadcrumb

- Đường dẫn phân cấp (Trang chủ / Nữ / Áo / Áo khoác), mỗi cấp là liên kết
- Dữ liệu có cấu trúc (schema BreadcrumbList) cho SEO

### 0.4 Footer

- Cột Cửa hàng: danh mục chính, hàng mới, sale
- Cột Hỗ trợ: liên hệ, FAQ, hướng dẫn chọn size, theo dõi đơn hàng, đổi trả, vận chuyển
- Cột Về chúng tôi: giới thiệu, blog, hệ thống cửa hàng, tuyển dụng
- Thông tin liên hệ: địa chỉ, hotline, email, giờ làm việc
- Biểu tượng mạng xã hội (Facebook, Instagram, TikTok, YouTube, Zalo)
- Biểu mẫu đăng ký nhận bản tin (email, đồng ý điều khoản, thông báo thành công/lỗi)
- Biểu tượng phương thức thanh toán và đơn vị vận chuyển
- Dòng bản quyền, liên kết chính sách, huy hiệu Bộ Công Thương (nếu bán tại Việt Nam)

### 0.5 Thành phần tương tác toàn trang

- Popup khuyến mãi/đăng ký email (hiện sau X giây hoặc khi định rời trang, chỉ hiện một lần)
- Thanh đồng ý cookie (chấp nhận tất cả, từ chối, tùy chỉnh)
- Nút chat/Zalo/Messenger nổi
- Nút lên đầu trang
- Thông báo nhỏ (toast): đã thêm vào giỏ, đã thêm vào yêu thích, lỗi
- Chuyển đổi chế độ sáng/tối (tùy chọn)
- Quick view: cửa sổ xem nhanh sản phẩm (ảnh, chọn size/màu, thêm giỏ)
- Skeleton loading và hiệu ứng tải ảnh lười (lazy load)
- Thẻ sản phẩm (Product card), dùng ở mọi danh sách:
  - Ảnh chính, ảnh thứ hai khi rê chuột
  - Nhãn: Mới, Sale -X%, Hết hàng, Bán chạy
  - Tên, giá, giá gốc gạch ngang, các chấm màu, đánh giá sao
  - Nút yêu thích, nút xem nhanh, nút thêm nhanh (chọn size)

### 0.6 SEO và kỹ thuật dùng chung

- Thẻ title, meta description, Open Graph, canonical cho từng trang
- Dữ liệu có cấu trúc: Product, Breadcrumb, Organization, FAQ, Article
- Sitemap.xml, robots.txt, URL thân thiện
- Responsive (mobile, tablet, desktop), tương thích trình duyệt, đạt chuẩn truy cập (alt, focus, bàn phím)
- Tối ưu tốc độ: ảnh WebP, lazy load, cache

## 1. Nhóm khám phá sản phẩm

Nhóm này giúp khách tìm và lọc sản phẩm; mọi trang danh sách đều dùng chung Product card và bộ lọc.

### 1.1 Trang chủ (`/`)

**Thành phần**

- Thanh thông báo, header, mini cart (mục 0)
- Hero banner/slider: ảnh lớn, tiêu đề, mô tả ngắn, nút CTA (Mua ngay, Khám phá), chấm điều hướng, mũi tên, tự chạy và dừng khi rê chuột
- Dải ưu đãi: miễn phí vận chuyển, đổi trả 30 ngày, thanh toán an toàn, hỗ trợ 24/7
- Danh mục nổi bật: lưới 4–6 ô ảnh (Nữ, Nam, Phụ kiện...) bấm vào dẫn tới danh mục
- Hàng mới về: carousel sản phẩm, nút Xem tất cả
- Bộ sưu tập nổi bật: banner lớn kèm mô tả và CTA
- Bán chạy: tab chuyển nhóm (Nữ, Nam, Phụ kiện) hiển thị sản phẩm tương ứng
- Banner khuyến mãi có đồng hồ đếm ngược
- Lookbook/Phối đồ: ảnh có điểm gắn thẻ sản phẩm (hotspot)
- Đánh giá khách hàng: carousel ảnh, tên, số sao, nội dung
- Bài viết blog mới nhất (3 bài)
- Instagram feed hoặc ảnh khách hàng (UGC)
- Khối đăng ký nhận bản tin kèm ưu đãi lần đầu
- Sản phẩm đã xem gần đây (nếu có lịch sử)
- Footer

**Chức năng**

- Tự chạy slider, vuốt trên mobile
- Thêm nhanh vào giỏ/yêu thích từ thẻ sản phẩm
- Đăng ký email, hiển thị thông báo kết quả
- Cá nhân hóa gợi ý theo lịch sử xem (tùy chọn)

### 1.2 Tất cả sản phẩm (`/shop`)

**Thành phần**

- Breadcrumb, tiêu đề trang, tổng số sản phẩm tìm thấy
- Bộ lọc (thanh bên trên desktop, ngăn kéo trên mobile):
  - Danh mục và danh mục con (dạng cây)
  - Size (nút chọn nhiều)
  - Màu (ô màu chọn nhiều)
  - Khoảng giá (thanh trượt hai đầu hoặc ô nhập min–max)
  - Thương hiệu, chất liệu, kiểu dáng, dịp mặc
  - Đang giảm giá, còn hàng
  - Đánh giá từ X sao
- Các thẻ bộ lọc đang áp dụng (chip) kèm nút xóa từng cái và Xóa tất cả
- Sắp xếp: Mới nhất, Bán chạy, Giá thấp đến cao, Giá cao đến thấp, Đánh giá cao, Giảm giá nhiều
- Chuyển chế độ xem: lưới 2/3/4 cột hoặc danh sách
- Lưới Product card
- Phân trang, nút Xem thêm hoặc cuộn vô hạn
- Trạng thái không có kết quả (gợi ý bỏ bớt bộ lọc, sản phẩm đề xuất)
- Skeleton khi đang tải

**Chức năng**

- Lọc và sắp xếp không tải lại trang, cập nhật URL (query string) để chia sẻ được
- Giữ bộ lọc khi quay lại từ trang chi tiết
- Quick view, thêm yêu thích, thêm giỏ
- Hiển thị số lượng kết quả theo từng giá trị bộ lọc

### 1.3 Trang danh mục (`/category/:slug`)

**Phạm vi:** Nữ, Nam, Trẻ em, Phụ kiện, Giày dép, Túi xách; mỗi danh mục có danh mục con (áo thun, áo sơ mi, áo khoác, quần jean, váy, đầm, đồ thể thao...).

**Thành phần**

- Banner đầu trang kèm tiêu đề và mô tả danh mục (nội dung SEO)
- Breadcrumb
- Lưới danh mục con dạng ô ảnh tròn hoặc chip
- Bộ lọc, sắp xếp, lưới sản phẩm (như `/shop`, bộ lọc phù hợp danh mục: giày có size giày, áo có size áo)
- Khối sản phẩm nổi bật của danh mục
- Đoạn mô tả dài/hướng dẫn mua ở cuối trang (SEO)
- Liên kết danh mục liên quan

**Chức năng:** như `/shop`, thêm điều hướng nhanh giữa danh mục cha và con.

### 1.4 Danh sách bộ sưu tập (`/collections`)

- Lưới thẻ bộ sưu tập: ảnh bìa, tên, mô tả ngắn, số sản phẩm, nút Xem bộ sưu tập
- Lọc theo mùa/năm (Xuân Hè, Thu Đông)
- Bộ sưu tập mới nhất ghim ở đầu trang

### 1.5 Chi tiết bộ sưu tập (`/collections/:slug`)

- Banner/video bìa, tên, câu chuyện cảm hứng của bộ sưu tập
- Ảnh lookbook của bộ sưu tập
- Bộ lọc, sắp xếp, lưới sản phẩm thuộc bộ sưu tập
- Liên kết sang bộ sưu tập khác

### 1.6 Hàng mới về (`/new-arrivals`) và Bán chạy (`/best-sellers`)

- Banner ngắn, lọc theo danh mục, bộ lọc chung, sắp xếp
- Hàng mới: mặc định sắp theo ngày thêm; có thể lọc theo tuần/tháng
- Bán chạy: mặc định sắp theo lượng bán; có thể hiển thị thứ hạng (Top 1, 2, 3)
- Lưới Product card, phân trang

### 1.7 Khuyến mãi (`/sale`)

- Banner chiến dịch, đồng hồ đếm ngược flash sale
- Chip lọc nhanh theo mức giảm (Dưới 30%, 30–50%, Trên 50%)
- Bộ lọc, sắp xếp (Giảm giá nhiều nhất), lưới sản phẩm với nhãn phần trăm giảm
- Thanh tiến độ số lượng đã bán (hiệu ứng khan hàng, nếu dùng)
- Danh sách mã giảm giá có thể sao chép
- Trạng thái chiến dịch đã kết thúc

### 1.8 Tìm kiếm (`/search?q=`)

**Thành phần**

- Ô tìm kiếm lớn kèm từ khóa hiện tại, số kết quả
- Gợi ý chính tả ("Ý bạn là...?")
- Tab kết quả: Sản phẩm, Bài viết, Danh mục
- Bộ lọc, sắp xếp, lưới sản phẩm
- Trạng thái không có kết quả: gợi ý từ khóa, danh mục phổ biến, sản phẩm bán chạy

**Chức năng**

- Gợi ý tự động khi gõ (debounce), tìm theo tên, mã SKU, danh mục, màu
- Lưu lịch sử tìm kiếm, xóa lịch sử
- Từ khóa thịnh hành

## 2. Chi tiết sản phẩm (`/product/:slug`)

Đây là trang quyết định mua hàng, nên có nhiều thành phần và logic nhất trong storefront.

### 2.1 Khu vực hình ảnh

- Ảnh chính lớn, dải ảnh nhỏ (thumbnail) dọc hoặc ngang
- Zoom khi rê chuột (desktop), chạm hai ngón (mobile)
- Lightbox toàn màn hình, vuốt qua lại
- Video giới thiệu/người mẫu mặc thử
- Ảnh đổi theo màu được chọn
- Ảnh 360 độ hoặc ảnh chi tiết chất liệu (tùy chọn)

### 2.2 Thông tin chính

- Breadcrumb, tên sản phẩm, mã SKU, thương hiệu
- Số sao trung bình và số đánh giá (bấm cuộn xuống phần đánh giá)
- Giá hiện tại, giá gốc gạch ngang, nhãn phần trăm giảm, tiết kiệm bao nhiêu
- Mô tả ngắn, các điểm nổi bật (chất liệu, form dáng)
- Chọn màu: ô màu hoặc ảnh nhỏ, hiển thị tên màu khi chọn
- Chọn size: nút size, size hết hàng bị làm mờ gạch chéo, liên kết mở Bảng size
- Gợi ý size theo chiều cao/cân nặng (tùy chọn)
- Chọn số lượng (tăng/giảm, giới hạn theo tồn kho)
- Tình trạng kho: Còn hàng, Còn ít (chỉ còn X), Hết hàng
- Nút Thêm vào giỏ, nút Mua ngay, nút Yêu thích
- Với sản phẩm hết hàng: nút Báo khi có hàng (nhập email)
- Thông tin giao hàng: ước tính ngày nhận theo tỉnh/thành, phí ship
- Cam kết: đổi trả 30 ngày, hàng chính hãng, thanh toán an toàn
- Mã giảm giá khả dụng cho sản phẩm
- Nút chia sẻ: Facebook, Zalo, Messenger, sao chép liên kết
- Lượt xem, "X người đang xem", "đã bán Y" (tùy chọn)

### 2.3 Thông tin chi tiết (tab hoặc accordion)

- Mô tả sản phẩm đầy đủ
- Thông số: chất liệu, thành phần vải, xuất xứ, kiểu dáng, độ dày, mã mẫu
- Hướng dẫn bảo quản (giặt, ủi, phơi)
- Bảng size chi tiết (ngực, eo, mông, chiều dài; nam/nữ/trẻ em) kèm hình hướng dẫn đo
- Thông tin vận chuyển và đổi trả tóm tắt
- Thông tin người mẫu (chiều cao, cân nặng, size đang mặc)

### 2.4 Đánh giá và hỏi đáp

- Tổng quan điểm sao, biểu đồ phân bố 1–5 sao
- Lọc đánh giá: theo số sao, có ảnh, mua xác thực; sắp xếp mới nhất/hữu ích nhất
- Mỗi đánh giá: tên, ngày, sao, nội dung, ảnh khách chụp, size đã mua, mức độ vừa vặn (chật/vừa/rộng), nút Hữu ích, phản hồi từ cửa hàng
- Biểu mẫu viết đánh giá: chấm sao, tiêu đề, nội dung, tải ảnh, thông tin vừa vặn (yêu cầu đã mua hàng)
- Phân trang đánh giá
- Hỏi đáp: đặt câu hỏi, xem câu trả lời của cửa hàng

### 2.5 Sản phẩm liên quan

- Mua cùng (Complete the look): bộ phối đồ, thêm cả bộ vào giỏ
- Sản phẩm tương tự (cùng danh mục, giá gần nhau)
- Khách hàng cũng xem
- Đã xem gần đây

### 2.6 Chức năng và hành vi

- Chọn màu/size bắt buộc trước khi thêm giỏ, báo lỗi nếu thiếu
- Cập nhật giá, ảnh, tồn kho theo biến thể (màu + size)
- Thêm giỏ không tải lại trang, mở mini cart và hiện thông báo
- Mua ngay: bỏ qua giỏ, chuyển thẳng đến thanh toán
- Thanh mua hàng dính (sticky add-to-cart) khi cuộn xuống, đặc biệt trên mobile
- Lưu vào lịch sử đã xem
- Dữ liệu có cấu trúc Product (giá, tồn kho, đánh giá) cho SEO
- URL giữ biến thể (`?color=den&size=m`)

## 3. Nhóm mua hàng

Nhóm này chuyển khách từ giỏ hàng đến đơn hàng hoàn tất; mỗi bước phải ít ma sát nhất có thể.

### 3.1 Giỏ hàng (`/cart`)

**Thành phần**

- Bảng sản phẩm: ảnh, tên (liên kết về chi tiết), size, màu, đơn giá, số lượng, thành tiền, nút xóa
- Nút đổi size/màu ngay trong giỏ
- Nút chuyển sang yêu thích, nút Xóa toàn bộ giỏ
- Ô nhập mã giảm giá, nút Áp dụng, danh sách mã khả dụng
- Tóm tắt đơn: tạm tính, giảm giá, phí vận chuyển ước tính, tổng cộng
- Ước tính phí ship theo tỉnh/thành
- Thanh tiến độ miễn phí vận chuyển
- Ô ghi chú đơn hàng, tùy chọn gói quà
- Nút Tiếp tục mua sắm, nút Thanh toán
- Sản phẩm gợi ý mua kèm
- Trạng thái giỏ trống

**Chức năng**

- Cập nhật số lượng và tổng tiền tức thì, kiểm tra tồn kho
- Cảnh báo khi sản phẩm hết hàng hoặc đổi giá
- Giữ giỏ hàng qua phiên (localStorage/cookie) và đồng bộ khi đăng nhập
- Kiểm tra mã giảm giá hợp lệ, điều kiện, hạn dùng, báo lỗi rõ ràng
- Gửi email nhắc giỏ hàng bị bỏ quên (tùy chọn)

### 3.2 Thanh toán (`/checkout`)

**Bước 1: Thông tin liên hệ và giao hàng**

- Email hoặc số điện thoại, tùy chọn đăng nhập hoặc mua không cần tài khoản
- Họ tên, số điện thoại, tỉnh/thành, quận/huyện, phường/xã, địa chỉ chi tiết
- Chọn địa chỉ đã lưu (nếu đã đăng nhập)
- Ghi chú giao hàng
- Tùy chọn giao đến địa chỉ khác, xuất hóa đơn công ty (mã số thuế)
- Đồng ý nhận bản tin

**Bước 2: Phương thức vận chuyển**

- Tiêu chuẩn, nhanh, hỏa tốc, nhận tại cửa hàng; mỗi lựa chọn hiện phí và thời gian dự kiến

**Bước 3: Phương thức thanh toán**

- Thanh toán khi nhận hàng (COD)
- Thẻ ngân hàng nội địa/quốc tế (Visa, Mastercard)
- Chuyển khoản (hiện thông tin tài khoản hoặc mã QR)
- Ví điện tử (MoMo, ZaloPay, VNPay)
- Trả góp (nếu hỗ trợ)
- Địa chỉ thanh toán trùng địa chỉ giao hàng

**Khối tóm tắt đơn hàng (cột bên)**

- Danh sách sản phẩm thu gọn, số lượng
- Ô mã giảm giá, điểm thưởng/thẻ quà tặng
- Tạm tính, phí ship, giảm giá, thuế, tổng cộng

**Chức năng**

- Thanh tiến độ các bước, quay lại sửa bước trước
- Kiểm tra dữ liệu từng trường, báo lỗi ngay
- Tự điền địa chỉ theo gợi ý, danh sách tỉnh/huyện/xã phụ thuộc lẫn nhau
- Tính phí ship theo địa chỉ và trọng lượng
- Chấp nhận điều khoản trước khi đặt hàng
- Nút Đặt hàng, chống bấm đúp, chuyển sang cổng thanh toán khi cần
- Lưu địa chỉ vào tài khoản
- Kiểm tra tồn kho lần cuối
- Bảo mật: HTTPS, xác thực thanh toán, huy hiệu an toàn

### 3.3 Đặt hàng thành công (`/order-success`)

- Thông báo cảm ơn, mã đơn hàng, ngày đặt
- Tóm tắt sản phẩm, địa chỉ nhận, phương thức vận chuyển, phương thức thanh toán, tổng tiền
- Thời gian giao dự kiến
- Hướng dẫn thanh toán tiếp (nếu chuyển khoản): thông tin tài khoản, nội dung chuyển khoản, mã QR, hạn thanh toán
- Nút Theo dõi đơn hàng, Tiếp tục mua sắm, Tạo tài khoản (cho khách mua không đăng nhập)
- Email xác nhận gửi kèm (thông tin trên trang giống email)
- Gợi ý sản phẩm liên quan

### 3.4 Yêu thích (`/wishlist`)

- Lưới sản phẩm đã lưu kèm giá hiện tại và tình trạng còn hàng
- Nút bỏ yêu thích, nút Thêm vào giỏ (chọn size/màu nếu cần), Thêm tất cả vào giỏ
- Cảnh báo khi giá giảm hoặc sắp hết hàng
- Chia sẻ danh sách yêu thích (liên kết)
- Trạng thái trống kèm gợi ý
- Khách chưa đăng nhập lưu trên trình duyệt; đăng nhập thì đồng bộ vào tài khoản

### 3.5 Tra cứu đơn hàng (`/track-order`)

- Biểu mẫu: mã đơn hàng và email hoặc số điện thoại
- Kết quả: trạng thái dạng tiến trình (Đã đặt, Đã xác nhận, Đang chuẩn bị, Đang giao, Đã giao, Đã hủy/Hoàn trả)
- Lịch sử cập nhật theo thời gian, mã vận đơn kèm liên kết đơn vị vận chuyển
- Chi tiết sản phẩm và địa chỉ giao
- Báo lỗi khi không tìm thấy hoặc thông tin sai

## 4. Tài khoản khách hàng

Khu vực tài khoản giữ chân khách quay lại; các trang `/account/*` yêu cầu đăng nhập và có menu bên chung.

### 4.1 Đăng nhập (`/login`)

- Ô email/số điện thoại, ô mật khẩu có nút hiện/ẩn
- Ghi nhớ đăng nhập, liên kết Quên mật khẩu
- Nút Đăng nhập, đăng nhập nhanh bằng Google, Facebook, Apple
- Liên kết sang Đăng ký
- Báo lỗi: sai thông tin, tài khoản bị khóa, chưa xác thực email
- Chuyển về trang trước đó sau khi đăng nhập thành công
- Giới hạn số lần đăng nhập sai, captcha khi nghi ngờ
- Tùy chọn tiếp tục với tư cách khách

### 4.2 Đăng ký (`/register`)

- Họ tên, email, số điện thoại, mật khẩu, nhập lại mật khẩu, ngày sinh, giới tính (tùy chọn)
- Chỉ báo độ mạnh mật khẩu, kiểm tra từng trường
- Đồng ý điều khoản và chính sách bảo mật, đồng ý nhận bản tin
- Đăng ký nhanh bằng mạng xã hội
- Xác thực email (liên kết hoặc mã OTP), trang thông báo đã gửi email
- Báo lỗi: email đã tồn tại

### 4.3 Quên mật khẩu (`/forgot-password`) và đặt lại (`/reset-password`)

- Nhập email để nhận liên kết đặt lại; thông báo chung dù email có tồn tại hay không (tránh dò tài khoản)
- Trang đặt lại: mật khẩu mới, nhập lại, chỉ báo độ mạnh
- Liên kết có hạn dùng, báo lỗi khi hết hạn hoặc đã dùng
- Thông báo thành công và chuyển về Đăng nhập

### 4.4 Tổng quan tài khoản (`/account`)

- Lời chào, hạng thành viên, điểm thưởng
- Menu bên: Tổng quan, Hồ sơ, Đơn hàng, Địa chỉ, Yêu thích, Điểm thưởng/Voucher, Đăng xuất
- Đơn hàng gần nhất kèm trạng thái
- Lối tắt đến địa chỉ mặc định, voucher sắp hết hạn

### 4.5 Hồ sơ (`/account/profile`)

- Sửa họ tên, email, số điện thoại, ngày sinh, giới tính, ảnh đại diện
- Đổi mật khẩu (mật khẩu cũ, mới, nhập lại)
- Thiết lập nhận thông báo: email, SMS, khuyến mãi
- Liên kết/hủy liên kết tài khoản mạng xã hội
- Xóa tài khoản (kèm xác nhận)

### 4.6 Đơn hàng của tôi (`/account/orders`)

- Danh sách đơn: mã đơn, ngày, tổng tiền, trạng thái (nhãn màu), ảnh sản phẩm thu nhỏ
- Lọc theo trạng thái (Tất cả, Chờ xác nhận, Đang giao, Đã giao, Đã hủy, Hoàn trả), tìm theo mã đơn
- Phân trang
- Trạng thái trống kèm nút mua sắm

### 4.7 Chi tiết đơn hàng (`/account/orders/:id`)

- Mã đơn, ngày đặt, trạng thái, tiến trình theo dõi (timeline)
- Danh sách sản phẩm: ảnh, tên, size, màu, số lượng, giá
- Địa chỉ giao, phương thức vận chuyển và thanh toán, mã vận đơn
- Tóm tắt tiền: tạm tính, giảm giá, ship, tổng cộng
- Hành động theo trạng thái:
  - Hủy đơn (khi chưa giao)
  - Thanh toán lại (khi thanh toán lỗi)
  - Yêu cầu đổi/trả (khi đã giao, trong thời hạn): chọn sản phẩm, lý do, ảnh minh họa, hình thức hoàn tiền
  - Mua lại, viết đánh giá sản phẩm
- Tải hóa đơn (PDF), liên hệ hỗ trợ về đơn này

### 4.8 Sổ địa chỉ (`/account/addresses`)

- Danh sách địa chỉ, nhãn Nhà riêng/Văn phòng, đánh dấu mặc định
- Thêm, sửa, xóa địa chỉ bằng biểu mẫu (họ tên, số điện thoại, tỉnh/huyện/xã, địa chỉ chi tiết)
- Xác nhận trước khi xóa

### 4.9 Điểm thưởng và voucher (`/account/rewards`)

- Điểm hiện có, hạng thành viên, thanh tiến độ lên hạng, quyền lợi từng hạng
- Lịch sử cộng/trừ điểm
- Danh sách voucher: mã, điều kiện, hạn dùng, nút sao chép, trạng thái (còn dùng, đã dùng, hết hạn)
- Đổi điểm lấy voucher
- Giới thiệu bạn bè: mã giới thiệu, liên kết chia sẻ

### 4.10 Quy tắc chung của khu vực tài khoản

- Chuyển hướng về `/login` khi chưa đăng nhập, quay lại đúng trang sau khi đăng nhập
- Phiên đăng nhập có hạn, đăng xuất ở mọi thiết bị
- Mật khẩu băm, HTTPS, bảo vệ CSRF

## 5. Nội dung và thương hiệu

Các trang này xây dựng niềm tin và kéo lưu lượng tìm kiếm tự nhiên về website.

### 5.1 Giới thiệu (`/about`)

- Banner/video thương hiệu
- Câu chuyện hình thành, sứ mệnh, tầm nhìn, giá trị cốt lõi
- Mốc thời gian phát triển (timeline)
- Số liệu nổi bật (số khách hàng, cửa hàng, năm hoạt động)
- Cam kết chất lượng, bền vững, nguồn gốc vải
- Đội ngũ sáng lập/thiết kế (ảnh, tên, chức danh)
- Đối tác, báo chí nhắc đến (logo)
- Nút kêu gọi: Khám phá sản phẩm, Liên hệ

### 5.2 Blog (`/blog`)

- Bài nổi bật đầu trang
- Lọc theo chuyên mục: Xu hướng, Phối đồ, Hướng dẫn, Tin tức, Hậu trường
- Lưới bài viết: ảnh bìa, chuyên mục, tiêu đề, trích đoạn, ngày đăng, thời gian đọc
- Ô tìm kiếm bài viết, thẻ (tag)
- Phân trang
- Cột bên: bài đọc nhiều, đăng ký bản tin

### 5.3 Bài viết (`/blog/:slug`)

- Ảnh bìa, tiêu đề, tác giả, ngày đăng, chuyên mục, thời gian đọc
- Mục lục tự động, nội dung (văn bản, ảnh, trích dẫn, video)
- Thẻ sản phẩm gắn trong bài (mua ngay từ bài viết)
- Nút chia sẻ mạng xã hội
- Giới thiệu tác giả
- Bài viết liên quan, điều hướng bài trước/sau
- Bình luận (tùy chọn, có kiểm duyệt)
- Dữ liệu có cấu trúc Article cho SEO

### 5.4 Lookbook (`/lookbook`)

- Danh sách các bộ ảnh phối đồ theo mùa/chủ đề
- Trang chi tiết: ảnh lớn có điểm gắn thẻ sản phẩm (hotspot), bấm hiện tên, giá, nút xem chi tiết
- Nút Mua cả bộ (thêm các món vào giỏ)
- Lọc theo phong cách (công sở, dạo phố, dự tiệc)
- Chia sẻ, lưu yêu thích

### 5.5 Hệ thống cửa hàng (`/stores`)

- Bản đồ tương tác kèm ghim cửa hàng
- Lọc theo tỉnh/thành và xã/phường theo danh mục địa chỉ hiện hành
- Nút "Tìm cửa hàng gần tôi" (dùng vị trí)
- Danh sách: tên, địa chỉ, giờ mở cửa, số điện thoại, ảnh, nút Chỉ đường, Gọi điện
- Tình trạng đang mở/đã đóng
- Khả năng nhận hàng tại cửa hàng (nếu có)

### 5.6 Tuyển dụng (`/careers`)

- Giới thiệu văn hóa và phúc lợi
- Danh sách vị trí đang tuyển: tên, phòng ban, địa điểm, hình thức (toàn thời gian/bán thời gian)
- Lọc theo phòng ban, địa điểm
- Chi tiết vị trí: mô tả, yêu cầu, quyền lợi
- Biểu mẫu ứng tuyển: họ tên, email, số điện thoại, tải CV, thư giới thiệu
- Thông báo gửi thành công

## 6. Hỗ trợ khách hàng, chính sách và trang hệ thống

Nhóm này giảm số câu hỏi gửi đến chăm sóc khách hàng và đáp ứng yêu cầu pháp lý.

### 6.1 Liên hệ (`/contact`)

- Biểu mẫu: họ tên, email, số điện thoại, chủ đề (dropdown: đơn hàng, sản phẩm, đổi trả, hợp tác), nội dung, đính kèm ảnh, captcha
- Thông tin: hotline, email, địa chỉ trụ sở, giờ làm việc, liên kết Zalo/Messenger
- Bản đồ nhúng
- Thông báo gửi thành công, kiểm tra dữ liệu từng trường
- Liên kết nhanh sang FAQ và Theo dõi đơn hàng

### 6.2 Câu hỏi thường gặp (`/faq`)

- Ô tìm kiếm câu hỏi
- Nhóm: Đặt hàng, Thanh toán, Vận chuyển, Đổi trả, Size, Tài khoản, Khuyến mãi
- Danh sách accordion mở/đóng
- Nút "Câu trả lời này có hữu ích không?"
- Khối "Vẫn cần hỗ trợ?" dẫn đến Liên hệ
- Dữ liệu có cấu trúc FAQ cho SEO

### 6.3 Hướng dẫn chọn size (`/size-guide`)

- Tab Nữ, Nam, Trẻ em, Giày dép
- Bảng size theo số đo (ngực, eo, mông, chiều dài, chân) và quy đổi VN/US/EU/UK
- Hình minh họa cách tự đo
- Công cụ gợi ý size: nhập chiều cao, cân nặng, vóc dáng, trả về size đề nghị
- Chuyển đổi cm/inch

### 6.4 Hướng dẫn mua hàng (`/how-to-order`) và bảo quản (`/care-guide`)

- Mua hàng: các bước đánh số có ảnh (chọn sản phẩm, giỏ hàng, thanh toán, nhận hàng), cách dùng mã giảm giá, cách thanh toán
- Bảo quản: biểu tượng giặt, ủi, phơi, tẩy; hướng dẫn theo chất liệu (cotton, len, lụa, denim, da)

### 6.5 Thẻ quà tặng (`/gift-cards`)

- Chọn mệnh giá hoặc nhập số tiền, chọn mẫu thiết kế
- Thông tin người nhận (tên, email), lời nhắn, ngày gửi
- Thêm vào giỏ như sản phẩm
- Ô kiểm tra số dư thẻ
- Hướng dẫn sử dụng, hạn dùng

### 6.6 Trang chính sách (`/policies/*`)

Mỗi trang có chung bố cục: tiêu đề, ngày cập nhật, mục lục bên cạnh, nội dung chia mục, liên kết sang các chính sách khác.

| Trang | Đường dẫn | Nội dung chính |
| --- | --- | --- |
| Đổi trả và hoàn tiền | `/policies/returns` | Thời hạn đổi trả, điều kiện sản phẩm, quy trình, hình thức hoàn tiền, trường hợp không áp dụng |
| Vận chuyển | `/policies/shipping` | Phạm vi giao, phí, thời gian, đơn vị vận chuyển, kiểm tra hàng khi nhận |
| Thanh toán | `/policies/payment` | Phương thức chấp nhận, bảo mật giao dịch, hoàn tiền, xuất hóa đơn |
| Bảo mật | `/policies/privacy` | Dữ liệu thu thập, mục đích, chia sẻ, thời gian lưu, quyền của khách, liên hệ |
| Điều khoản sử dụng | `/policies/terms` | Quyền và nghĩa vụ, sở hữu trí tuệ, giới hạn trách nhiệm, giải quyết tranh chấp |
| Cookie | `/policies/cookies` | Loại cookie, mục đích, cách quản lý, bảng điều khiển đồng ý |

### 6.7 Trang hệ thống

| Trang | Thành phần |
| --- | --- |
| 404 Không tìm thấy | Thông báo thân thiện, ô tìm kiếm, nút về trang chủ, liên kết danh mục phổ biến, sản phẩm đề xuất |
| 500 Lỗi máy chủ | Thông báo lỗi, nút thử lại, liên hệ hỗ trợ |
| Bảo trì | Thông báo, thời gian dự kiến hoạt động lại, biểu mẫu đăng ký nhận tin |
| Quản lý bản tin | Thông báo đăng ký thành công ngay sau khi đồng ý; trang hủy đăng ký thu thập lý do và xác nhận qua liên kết email dùng một lần |
| Thanh toán thất bại/hủy | Lý do lỗi, nút thanh toán lại, đổi phương thức, giữ nguyên giỏ hàng |
| Hết hạn phiên | Thông báo, nút đăng nhập lại |

---

## 7. Tóm tắt số lượng trang

| Nhóm | Số trang |
| --- | --- |
| Thành phần dùng chung | không phải trang riêng |
| Khám phá sản phẩm (trang chủ, shop, danh mục, bộ sưu tập x2, hàng mới/bán chạy x2, sale, tìm kiếm) | 9 |
| Chi tiết sản phẩm | 1 |
| Mua hàng (giỏ, thanh toán, thành công, yêu thích, tra cứu) | 5 |
| Tài khoản (đăng nhập, đăng ký, quên/đặt lại x2, tổng quan, hồ sơ, đơn hàng x2, địa chỉ, điểm thưởng) | 10 |
| Nội dung thương hiệu (giới thiệu, blog x2, lookbook, cửa hàng, tuyển dụng) | 6 |
| Hỗ trợ (liên hệ, FAQ, size, hướng dẫn mua, bảo quản, quà tặng) | 6 |
| Chính sách | 6 |
| Trang hệ thống | 6 |
| **Tổng** | **49** |

Bản tối thiểu (MVP) chỉ cần: Trang chủ, Shop, Danh mục, Chi tiết sản phẩm, Giỏ hàng, Thanh toán, Đặt hàng thành công, Đăng nhập/Đăng ký, Đơn hàng của tôi, Liên hệ, Giới thiệu, 404.
