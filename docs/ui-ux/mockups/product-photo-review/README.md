# Ảnh AI demo sản phẩm

## Ảnh ứng viên chờ duyệt (2026-10-27)

Các ảnh trong nhóm review được tạo theo yêu cầu: ảnh studio flat-lay chân thực, chỉ có quần áo/vật phẩm, không có người mặc, mannequin hay minh họa. Đây là ảnh AI tạo mẫu, không xác nhận hình dáng, màu, chất liệu hoặc tồn kho của SKU thực tế. Chúng chỉ nằm trong thư mục review, chưa được đưa vào media đang phục vụ, chưa cập nhật seeder và chưa tải lên API.

Bảng so sánh ảnh hiện tại và ảnh ứng viên: [flatlay-candidate-review.html](flatlay-candidate-review.html).

- `ao-so-mi-linen-flatlay-review-20261027.png` — ứng viên cho `ao-so-mi-linen`.
- `ao-polo-cotton-pique-flatlay-review-20261027.png` — ứng viên cho `ao-polo-cotton-pique`.
- `ao-so-mi-linen-flatlay-generated-20261027.png` — ảnh chụp phong cách flat-lay mới cho `ao-so-mi-linen`, màu ngà.
- `ao-polo-cotton-pique-flatlay-navy-generated-20261027.png` — ảnh chụp phong cách flat-lay mới cho `ao-polo-cotton-pique`, xanh navy đúng với một màu biến thể trong dữ liệu demo.
- `ao-kieu-tay-phong-flatlay-photoreal-generated-20261027.png` — ảnh blouse tay phồng màu xanh sage tạo theo yêu cầu mới; chưa gán cho sản phẩm vì màu này không có trong biến thể `ao-kieu-tay-phong` hiện tại.

Chỉ chuyển ứng viên đã duyệt sang media demo/UAT sau khi xác nhận. Giữ nhãn công khai `Ảnh AI demo`; ảnh chụp đúng hàng thật vẫn cần cửa hàng cung cấp trước production merchandising.

Các ảnh trong `api/public/demo-media/products/` được tạo dạng ảnh flat-lay chân thực, không có người mặc và không phải hình minh họa. Đây là ảnh AI tạo mẫu cho demo/UAT, chưa được cửa hàng xác nhận là ảnh chụp đúng sản phẩm đang bán. Storefront hiển thị nhãn `Ảnh AI demo` và alt text nêu rõ giới hạn này.

Trước khi dùng catalog làm nội dung bán hàng thực tế, cửa hàng cần cung cấp ảnh chụp thật và tải lên qua Admin. Seeder giữ ảnh upload của cửa hàng và ưu tiên chúng hơn ảnh demo. Các biến thể kích thước `-360.webp`, `-640.webp`, `-photo.webp` lần lượt là 360×450, 640×800, 800×1000.

| Slug sản phẩm | File ảnh AI demo |
| --- | --- |
| `ao-so-mi-linen` | `ao-so-mi-linen-photo.webp` |
| `quan-suong-cotton` | `quan-suong-cotton-photo.webp` |
| `vay-midi-co-vuong` | `vay-midi-co-vuong-photo.webp` |
| `ao-khoac-blazer` | `ao-khoac-blazer-photo.webp` |
| `ao-khoac-blazer-copy` | Dùng chung ảnh demo `ao-khoac-blazer-photo.webp` |
| `ao-thun-cotton-co-tron` | `ao-thun-cotton-co-tron-photo.webp` |
| `ao-kieu-tay-phong` | `ao-kieu-tay-phong-photo.webp` |
| `quan-ong-dung-linen` | `quan-ong-dung-linen-photo.webp` |
| `chan-vay-chu-a-midi` | `chan-vay-chu-a-midi-photo.webp` |
| `ao-cardigan-det-kim` | `ao-cardigan-det-kim-photo.webp` |
| `tui-tote-canvas` | `tui-tote-canvas-photo.webp` |
| `ao-polo-cotton-pique` | `ao-polo-cotton-pique-photo.webp` |
| `ao-gile-linen` | `ao-gile-linen-v2-photo.webp` (current; prior version retained as `ao-gile-linen-photo.webp`) |
| `quan-short-linen` | `quan-short-linen-photo.webp` |
| `vay-quan-midi` | `vay-quan-midi-photo.webp` |
| `vay-so-mi-linen` | `vay-so-mi-linen-photo.webp` |
| `khan-lua-vuong` | `khan-lua-vuong-photo.webp` |
| `vi-mini-da-mem` | `vi-mini-da-mem-photo.webp` |
| `ao-khoac-trench-ngan` | `ao-khoac-trench-ngan-photo.webp` |

Để tạo lại các bản WebP từ ảnh nguồn được lưu trong thư mục Codex `generated_images`, chạy:

```powershell
python tools/assets/prepare-ai-demo-product-photos.py --source-dir C:/Users/ACER/.codex/generated_images/01a1654a-861f-7863-a8d8-ab41221c474b
```

To regenerate a single product set without touching the others, pass `--only ao-gile-linen-v2` (or another key from the converter's source map).
