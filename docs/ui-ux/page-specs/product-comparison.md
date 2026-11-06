# So sánh sản phẩm

## Mục tiêu

Giúp khách xem tối đa bốn sản phẩm đang công khai trong cùng một bảng trước khi quyết định.

## Luồng và trạng thái

- Khách chọn hoặc bỏ chọn sản phẩm bằng nút có nhãn rõ ràng trên thẻ sản phẩm hoặc trang chi tiết sản phẩm.
- Danh sách được giữ trong trình duyệt; nút so sánh xuất hiện trên trang danh sách khi đã chọn ít nhất một sản phẩm.
- Trang `/compare` tải lại thông tin mới nhất của từng sản phẩm từ API, không dựa vào giá lưu ở trình duyệt.
- Bảng so sánh có trạng thái rỗng, tải, và cảnh báo khi sản phẩm đã bị ẩn hoặc ngừng công khai.
- Khách có thể bỏ từng sản phẩm, xóa toàn bộ hoặc sao chép liên kết chia sẻ tối đa bốn slug.
- Liên kết chia sẻ mở cùng danh sách so sánh từ URL; trang mang `noindex` vì nội dung phụ thuộc lựa chọn của từng khách.

## Nội dung bảng

Ảnh/tên, giá hiện tại, giá niêm yết nếu có, thương hiệu, danh mục, chất liệu, phom dáng, màu, kích cỡ, tình trạng tồn kho, đánh giá và mô tả ngắn. Dữ liệu thiếu hiển thị dấu gạch hoặc “Chưa cập nhật”, không tự suy đoán.

## Responsive và truy cập

- Bảng giữ các cột sản phẩm có thể cuộn ngang trên màn hình hẹp; tên vùng cuộn được đọc bằng screen reader và nhận focus bàn phím.
- Mỗi nút bỏ sản phẩm có tên truy cập chứa tên sản phẩm.
- Các thao tác thêm/bỏ trong catalog công bố trạng thái bằng `aria-pressed`.
