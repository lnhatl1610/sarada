import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const categories = [
  { name: 'Áo', to: '/search?q=%C3%A1o' },
  { name: 'Quần', to: '/search?q=qu%E1%BA%A7n' },
  { name: 'Váy & Đầm', to: '/search?q=v%C3%A1y' },
  { name: 'Phụ kiện', to: '/search?q=ph%E1%BB%A5%20ki%E1%BB%87n' },
]

type DemoProduct = { name: string; price: string; oldPrice?: string; tag?: string; sale?: boolean; rating?: string; reviews?: number }
const newArrivals: DemoProduct[] = [
  { name: 'Áo sơ mi linen oversize', price: '490.000đ', tag: 'New' },
  { name: 'Quần ống rộng cạp cao', price: '550.000đ', tag: 'New' },
  { name: 'Áo khoác blazer basic', price: '890.000đ', tag: 'New' },
  { name: 'Váy midi xếp ly', price: '690.000đ', tag: 'New' },
]
const bestSellers: DemoProduct[] = [
  { name: 'Áo thun cotton premium', price: '245.000đ', oldPrice: '350.000đ', tag: '-30%', sale: true, rating: '★★★★★', reviews: 128 },
  { name: 'Quần jean slim-fit', price: '620.000đ', rating: '★★★★☆', reviews: 94 },
  { name: 'Túi tote da mini', price: '720.000đ', oldPrice: '900.000đ', tag: '-20%', sale: true, rating: '★★★★★', reviews: 211 },
  { name: 'Giày sneaker trắng', price: '990.000đ', rating: '★★★★★', reviews: 76 },
]
const lookbook = ['Office Chic', 'Weekend Casual', 'Street Style', 'Date Night', 'Minimalist']
const services = [
  { icon: '🚚', title: 'Giao hàng COD', text: 'Kiểm tra hàng, thanh toán khi nhận' },
  { icon: '🔄', title: 'Đổi trả dễ dàng', text: 'Đổi size, đổi mẫu theo chính sách' },
  { icon: '🔒', title: 'Thanh toán an toàn', text: 'Giá và tổng tiền tính tại máy chủ' },
  { icon: '💬', title: 'Hỗ trợ khách hàng', text: 'Liên hệ qua trang Liên hệ' },
]
const testimonials = [
  { text: 'Chất vải mát, form chuẩn, giao hàng nhanh. Mình đã mua lần thứ ba rồi!', name: 'Minh Anh', city: 'Đà Nẵng', stars: '★★★★★' },
  { text: 'Thiết kế đẹp, đúng như hình. Nhân viên tư vấn size rất nhiệt tình.', name: 'Quốc Bảo', city: 'Hà Nội', stars: '★★★★★' },
  { text: 'Đóng gói cẩn thận, đổi size nhanh gọn. Sẽ ủng hộ dài dài.', name: 'Thu Hà', city: 'TP. Hồ Chí Minh', stars: '★★★★☆' },
]

/** Image-free card used until real fashion photography is available. */
function Placeholder({ label, dark, className }: { label: string; dark?: boolean; className?: string }) {
  return <div aria-hidden="true" style={{ fontFamily: "'Cormorant Garamond Variable', serif" }} className={cn('grid size-full place-items-center bg-linear-to-br text-4xl transition-transform duration-500 motion-reduce:transition-none', dark ? 'from-foreground/80 to-foreground text-background/60' : 'from-muted to-secondary text-muted-foreground', className)}>{label.charAt(0)}</div>
}

function SectionTitle({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return <div className="mb-10 text-center"><h2 id={id} className="text-3xl font-semibold uppercase tracking-widest">{title}</h2><p className="mt-2 text-muted-foreground">{subtitle}</p></div>
}

function Section({ labelledBy, className, children }: { labelledBy: string; className?: string; children: React.ReactNode }) {
  return <section aria-labelledby={labelledBy} className={cn('py-12 md:py-18', className)}><div className="mx-auto w-[min(1200px,92%)]">{children}</div></section>
}

function ProductGrid({ products }: { products: DemoProduct[] }) {
  return <div className="grid grid-cols-2 gap-4 md:gap-7 lg:grid-cols-4">
    {products.map((product) => <article key={product.name} className="group">
      <Link to={`/search?q=${encodeURIComponent(product.name)}`}>
        <div className="relative aspect-3/4 overflow-hidden bg-muted">
          {product.tag && <span className={cn('absolute left-3 top-3 z-10 px-2.5 py-1 text-xs uppercase tracking-wider text-white', product.sale ? 'bg-destructive' : 'bg-foreground')}>{product.tag}</span>}
          <Placeholder label={product.name} className="group-hover:scale-105" />
        </div>
        <div className="px-1 pb-5 pt-3.5">
          {product.rating && <div className="text-sm text-amber-500">{product.rating} <small className="text-muted-foreground">({product.reviews})</small></div>}
          <h3 className="text-[15px] font-medium">{product.name}</h3>
          <div className="mt-1 font-semibold">{product.oldPrice ? <><span className="text-destructive">{product.price}</span><del className="ml-2 text-sm font-normal text-muted-foreground">{product.oldPrice}</del></> : product.price}</div>
        </div>
      </Link>
    </article>)}
  </div>
}

function useCountdown() {
  const [end] = useState(() => Date.now() + 3 * 24 * 60 * 60 * 1000)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const diff = Math.max(0, end - now)
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    ['Ngày', pad(Math.floor(diff / 86400000))],
    ['Giờ', pad(Math.floor((diff % 86400000) / 3600000))],
    ['Phút', pad(Math.floor((diff % 3600000) / 60000))],
    ['Giây', pad(Math.floor((diff % 60000) / 1000))],
  ]
}

export function BlazerSections() {
  const countdown = useCountdown()
  const [subscribed, setSubscribed] = useState(false)
  const subscribe = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubscribed(true) }
  return <div className="bg-background text-foreground">
    <Section labelledBy="bs-categories">
      <SectionTitle id="bs-categories" title="Danh mục nổi bật" subtitle="Tìm nhanh món đồ bạn yêu thích" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {categories.map((category, index) => <Link key={category.name} to={category.to} className="group relative block aspect-3/4 overflow-hidden">
          <Placeholder label={category.name} dark={index % 2 === 1} className="group-hover:scale-105" />
          <span className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
          <h3 className="absolute bottom-5 left-5 z-10 text-xl tracking-wide text-white">{category.name}</h3>
        </Link>)}
      </div>
    </Section>

    <Section labelledBy="bs-new" className="bg-muted/40">
      <SectionTitle id="bs-new" title="Hàng mới về" subtitle="Những thiết kế vừa lên kệ tuần này" />
      <ProductGrid products={newArrivals} />
    </Section>

    <Section labelledBy="bs-best">
      <SectionTitle id="bs-best" title="Bán chạy nhất" subtitle="Được yêu thích bởi nhiều khách hàng" />
      <ProductGrid products={bestSellers} />
    </Section>

    <section aria-labelledby="bs-sale" className="bg-linear-to-r from-foreground to-foreground/80 py-0 text-background">
      <div className="mx-auto flex min-h-105 w-[min(1200px,92%)] flex-col items-center justify-center gap-3.5 text-center">
        <small className="uppercase tracking-[0.25em]">Flash Sale cuối tuần</small>
        <h2 id="bs-sale" className="text-4xl tracking-[0.15em] md:text-5xl">GIẢM ĐẾN 50%</h2>
        <div role="timer" aria-label="Thời gian còn lại của flash sale" className="my-1.5 flex gap-3 md:gap-4">
          {countdown.map(([label, value]) => <div key={label} className="min-w-15 bg-white/15 px-2.5 py-2 md:min-w-18 md:px-4 md:py-2.5"><b className="block text-2xl">{value}</b><span className="text-[11px] uppercase tracking-wider">{label}</span></div>)}
        </div>
        <Link to="/products" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'uppercase tracking-wider')}>Mua ngay</Link>
      </div>
    </section>

    <Section labelledBy="bs-lookbook">
      <SectionTitle id="bs-lookbook" title="Lookbook" subtitle="Gợi ý phối đồ cho mùa mới" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-[1.2fr_1fr_1fr] lg:grid-rows-[280px_280px] lg:gap-4.5">
        {lookbook.map((name, index) => <Link key={name} to="/search?q=blazer" className={cn('group relative block h-56 overflow-hidden lg:h-auto', index === 0 && 'col-span-2 h-80 lg:col-span-1 lg:row-span-2 lg:h-auto')}>
          <Placeholder label={name} dark={index % 3 === 1} className="group-hover:scale-105" />
          <span className="absolute bottom-4 left-4 z-10 bg-background px-3.5 py-1.5 text-[13px] uppercase tracking-wider">{name}</span>
        </Link>)}
      </div>
    </Section>

    <section aria-label="Dịch vụ" className="border-y py-12">
      <div className="mx-auto grid w-[min(1200px,92%)] grid-cols-2 gap-6 text-center lg:grid-cols-4">
        {services.map((service) => <div key={service.title}><div className="text-3xl" aria-hidden="true">{service.icon}</div><h4 className="mb-1 mt-2 text-[15px] font-semibold uppercase tracking-wider">{service.title}</h4><p className="text-sm text-muted-foreground">{service.text}</p></div>)}
      </div>
    </section>

    <Section labelledBy="bs-reviews" className="bg-muted/40">
      <SectionTitle id="bs-reviews" title="Khách hàng nói gì" subtitle="Cảm nhận từ khách hàng của chúng tôi" />
      <div className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((item) => <Card key={item.name} className="py-7"><CardContent>
          <div className="text-sm text-amber-500" aria-label={item.stars}>{item.stars}</div>
          <p className="my-3 mb-5 italic text-foreground/80">“{item.text}”</p>
          <div className="flex items-center gap-3"><div className="size-12 shrink-0 overflow-hidden rounded-full"><Placeholder label={item.name} dark className="text-lg" /></div><div><b className="block text-sm">{item.name}</b><small className="text-muted-foreground">{item.city}</small></div></div>
        </CardContent></Card>)}
      </div>
    </Section>

    <Section labelledBy="bs-insta">
      <SectionTitle id="bs-insta" title="@sarada.fashion" subtitle="Chia sẻ phong cách của bạn với #SaradaStyle" />
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((index) => <Link key={index} to="/products" aria-label={`Ảnh phong cách ${index}`} className="group block aspect-square overflow-hidden"><Placeholder label="S" dark={index % 2 === 0} className="group-hover:scale-110" /></Link>)}
      </div>
    </Section>

    <section aria-labelledby="bs-news" className="bg-foreground py-12 text-center text-background md:py-18">
      <div className="mx-auto w-[min(1200px,92%)]">
        <h2 id="bs-news" className="text-3xl uppercase tracking-widest">Đăng ký nhận tin</h2>
        <p className="mb-6 mt-2 text-background/70">Nhận cập nhật bộ sưu tập mới và ưu đãi từ cửa hàng.</p>
        <form onSubmit={subscribe} className="mx-auto flex max-w-lg gap-2">
          <Input type="email" required placeholder="Nhập email của bạn" aria-label="Email nhận tin" className="h-11 border-0 bg-background text-foreground" />
          <Button type="submit" size="lg" className="h-11 uppercase tracking-wider">Đăng ký</Button>
        </form>
        {subscribed && <p role="status" className="mt-3.5 text-amber-300">Cảm ơn bạn đã đăng ký!</p>}
      </div>
    </section>
  </div>
}
