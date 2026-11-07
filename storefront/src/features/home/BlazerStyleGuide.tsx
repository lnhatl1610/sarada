import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditorialSection } from './EditorialSection'

const looks = [
  { key: 'office', label: 'Công sở', title: 'Tự tin, theo cách của bạn.', text: 'Blazer xám cùng quần sáng màu tạo nên một tổng thể gọn gàng. Hoàn thiện bằng sơ mi hoặc áo thun đơn sắc.', image: '/blazer-look-1-hd.webp' },
  { key: 'weekend', label: 'Cuối tuần', title: 'Thoải mái mà vẫn chỉn chu.', text: 'Giữ chiếc blazer yêu thích, thêm áo thun và giày thể thao. Một cách phối đơn giản cho những ngày không vội.', image: '/blazer-look-2-hd.webp' },
  { key: 'evening', label: 'Cuộc hẹn', title: 'Một điểm nhấn là đủ.', text: 'Để phom dáng lên tiếng với bảng màu trung tính. Chọn thêm phụ kiện theo cá tính để hoàn thiện diện mạo.', image: '/blazer-look-3-hd.webp' },
]
const steps = [
  { title: 'Tìm cảm hứng', text: 'Chọn phong cách phù hợp với lịch trình của bạn.' },
  { title: 'Chọn thiết kế', text: 'Xem chất liệu, số đo và các lựa chọn trên trang sản phẩm.' },
  { title: 'Hoàn thiện diện mạo', text: 'Kết hợp cùng những món đồ sẵn có trong tủ.' },
]

export function BlazerStyleGuide() {
  const reduced = useReducedMotion()
  return <div id="how-it-works" className="scroll-mt-8 bg-muted/30">
    <EditorialSection id="blazer-guide-title" eyebrow="HOW TO STYLE" title="Mặc đẹp, đơn giản hơn">
      <ol className="mb-12 [display:grid] grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((step, index) => <li key={step.title} className="border-t border-dashed pt-6">
          <span className="mb-4 inline-flex size-10 items-center justify-center rounded-full border text-sm">0{index + 1}</span>
          <h3 className="mb-2 font-medium">{step.title}</h3><p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
        </li>)}
      </ol>
      <Tabs defaultValue="office">
        <TabsList className="mx-auto mb-5" aria-label="Gợi ý phối đồ">{looks.map(look => <TabsTrigger key={look.key} value={look.key}>{look.label}</TabsTrigger>)}</TabsList>
        {looks.map(look => <TabsContent key={look.key} value={look.key}>
          <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="[display:grid] grid-cols-1 overflow-hidden rounded-2xl border bg-background md:grid-cols-2">
            <img src={look.image} alt={`Gợi ý phối blazer xám cho ${look.label.toLowerCase()}`} width={1122} height={1402} loading="lazy" className="aspect-[4/3] w-full object-cover object-top md:max-h-[480px] md:aspect-auto" />
            <div className="flex flex-col items-start justify-center gap-6 p-8 md:p-14"><p className="text-xs uppercase tracking-widest text-muted-foreground">THE BLAZER EDIT / {look.label}</p><h3 className="text-3xl leading-tight md:text-4xl">{look.title}</h3><p className="max-w-md text-sm leading-7 text-muted-foreground">{look.text}</p><Link to="/search?q=blazer" className="inline-flex items-center gap-2 border-b pb-2 text-sm">Tìm blazer phù hợp <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
          </motion.div>
        </TabsContent>)}
      </Tabs>
    </EditorialSection>
  </div>
}
