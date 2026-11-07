import { ArrowDownRight, ArrowRight, Check, Plus, Shirt, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router'

type GuideKind = 'buying' | 'care'

const buyingSteps = [
  {
    title: 'Chọn sản phẩm và phiên bản',
    text: 'Mở trang sản phẩm, xem ảnh và thông tin chi tiết, rồi chọn màu và kích cỡ còn hàng phù hợp.',
    icon: Shirt,
    href: '/products',
    action: 'Khám phá sản phẩm',
  },
  {
    title: 'Thêm vào giỏ hàng',
    text: 'Chọn số lượng và thêm sản phẩm vào giỏ. Kiểm tra lại màu, kích cỡ và số lượng trước khi tiếp tục.',
    icon: ShoppingBag,
    href: '/cart',
    action: 'Xem giỏ hàng',
  },
  {
    title: 'Nhập thông tin giao hàng',
    text: 'Tại bước thanh toán, cung cấp người nhận, số điện thoại và địa chỉ. Phí vận chuyển được tính theo thông tin đơn hàng.',
    icon: ArrowRight,
  },
  {
    title: 'Chọn phương thức đang được hỗ trợ',
    text: 'Các phương thức thanh toán khả dụng sẽ hiện tại bước thanh toán theo cấu hình hiện tại của cửa hàng. Mã giảm giá có thể nhập tại trường mã ưu đãi nếu trường này được bật.',
    icon: Check,
  },
  {
    title: 'Theo dõi đơn hàng',
    text: 'Sau khi đặt hàng, lưu lại mã đơn để xem trạng thái và liên kết vận chuyển nếu có.',
    icon: ArrowDownRight,
    href: '/track-order',
    action: 'Theo dõi đơn hàng',
  },
]

const careGuides = [
  { material: 'Cotton', advice: 'Đọc ký hiệu trên nhãn trước khi giặt; phân loại màu sáng và tối. Chọn nhiệt độ, chế độ sấy và cách ủi theo đúng nhãn của sản phẩm.' },
  { material: 'Len', advice: 'Kiểm tra nhãn để biết sản phẩm có thể giặt hay cần giặt khô. Nếu được phép giặt, thao tác nhẹ và phơi phẳng khi nhãn hướng dẫn như vậy.' },
  { material: 'Lụa', advice: 'Ưu tiên hướng dẫn riêng trên nhãn. Tránh vò hoặc vắt mạnh; chỉ giặt tay hay giặt khô khi nhãn cho phép.' },
  { material: 'Denim', advice: 'Xem nhãn để chọn chế độ giặt. Có thể lộn trái và giặt riêng lần đầu để hạn chế lem màu; phơi theo hướng dẫn trên nhãn.' },
  { material: 'Da', advice: 'Không cho vào máy giặt. Làm sạch theo nhãn chăm sóc hoặc hướng dẫn riêng của sản phẩm; khi cần, hỏi đơn vị chăm sóc đồ da.' },
]

export function StoreGuidesPage({ kind }: { kind: GuideKind }) {
  const isBuyingGuide = kind === 'buying'

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 text-foreground sm:px-6 sm:py-16" aria-labelledby="store-guide-title">
      <nav className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4 text-sm" aria-label="Hướng dẫn cửa hàng">
        <Link className={isBuyingGuide ? 'font-semibold text-primary underline underline-offset-8' : 'text-muted-foreground hover:text-foreground'} to="/how-to-order" aria-current={isBuyingGuide ? 'page' : undefined}>Hướng dẫn mua hàng</Link>
        <Link className={!isBuyingGuide ? 'font-semibold text-primary underline underline-offset-8' : 'text-muted-foreground hover:text-foreground'} to="/care-guide" aria-current={!isBuyingGuide ? 'page' : undefined}>Chăm sóc trang phục</Link>
      </nav>

      <section className="max-w-3xl" aria-labelledby="store-guide-title">
        <h1 id="store-guide-title" className="text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          {isBuyingGuide ? 'Mua sắm theo cách đơn giản' : 'Giữ trang phục bền đẹp'}
        </h1>
        <p className="mt-5 max-w-[68ch] text-base leading-7 text-muted-foreground sm:text-lg">
          {isBuyingGuide
            ? 'Từ lúc chọn món đồ đến khi nhận hàng, các bước dưới đây giúp bạn kiểm tra thông tin và hoàn tất đơn hàng thuận tiện.'
            : 'Chất liệu và cách hoàn thiện mỗi sản phẩm có thể khác nhau. Hãy ưu tiên nhãn chăm sóc và hướng dẫn đi kèm sản phẩm.'}
        </p>
      </section>

      {isBuyingGuide ? (
        <ol className="mt-12 max-w-4xl divide-y divide-border border-y border-border">
          {buyingSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr] sm:gap-6 sm:py-9">
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground" aria-hidden="true"><Icon size={21} strokeWidth={1.7} /></span>
                <div>
                  <p className="text-sm font-medium text-primary">Bước {index + 1}</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{step.title}</h2>
                  <p className="mt-3 max-w-[68ch] leading-7 text-muted-foreground">{step.text}</p>
                  {step.href && step.action && <Link className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={step.href}>{step.action}<ArrowRight size={16} aria-hidden="true" /></Link>}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <section className="mt-12 max-w-4xl" aria-labelledby="care-materials-title">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="care-materials-title" className="text-2xl font-semibold tracking-[-0.02em]">Chăm sóc theo chất liệu</h2>
              <p className="mt-2 max-w-[68ch] leading-7 text-muted-foreground">Các gợi ý chỉ mang tính tham khảo. Ký hiệu trên nhãn của từng sản phẩm luôn được ưu tiên.</p>
            </div>
            <Shirt className="hidden text-primary sm:block" size={28} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="divide-y divide-border">
            {careGuides.map((guide) => (
              <details key={guide.material} className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {guide.material}<Plus className="text-primary transition-transform group-open:rotate-45" size={19} strokeWidth={1.7} aria-hidden="true" />
                </summary>
                <p className="max-w-[68ch] pb-2 pt-3 leading-7 text-muted-foreground">{guide.advice}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <aside className="mt-12 flex flex-col gap-4 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[60ch] text-muted-foreground">Cần hỗ trợ thêm? Trung tâm trợ giúp có câu trả lời thường gặp và cách liên hệ cửa hàng.</p>
        <Link className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/faq">Đến trung tâm trợ giúp<ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </main>
  )
}
