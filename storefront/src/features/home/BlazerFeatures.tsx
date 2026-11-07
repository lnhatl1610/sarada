import { Link } from 'react-router'
import { ArrowUpRight, Layers, Ruler, Shirt, Sparkles, Sun, Heart } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EditorialSection } from './EditorialSection'

const features = [
  { icon: Shirt, title: 'Một chiếc blazer. Nhiều phiên bản của bạn.', text: 'Từ buổi họp đầu ngày đến cuộc hẹn cuối tuần. Bắt đầu với phom dáng bạn yêu thích.', wide: true },
  { icon: Ruler, title: 'Tìm phom dáng phù hợp', text: 'Đối chiếu số đo và thông tin từng thiết kế trước khi chọn kích cỡ.' },
  { icon: Layers, title: 'Phối lớp thật tự nhiên', text: 'Áo thun, sơ mi và blazer: những lớp trang phục tạo nên chiều sâu.' },
  { icon: Sun, title: 'Từ công sở đến cuối tuần', text: 'Đổi một món phụ kiện để làm mới bộ trang phục quen thuộc.' },
  { icon: Heart, title: 'Lưu lại điều bạn thích', text: 'Tạo danh sách yêu thích để dễ dàng quay lại những thiết kế đã chọn.' },
  { icon: Sparkles, title: 'Ít hơn, nhưng đúng với bạn', text: 'Khám phá những gam màu dễ kết hợp và xây dựng tủ đồ theo phong cách riêng.', wide: true },
]

export function BlazerFeatures() {
  return <div id="features" className="scroll-mt-8">
    <EditorialSection id="blazer-features-title" eyebrow="THE EVERYDAY EDIT" title="Phong cách bắt đầu từ bạn" subtitle="Không cần một tủ đồ lớn. Chỉ cần những lựa chọn phù hợp.">
      <div className="[display:grid] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text, wide }) => <Card key={title} className={wide ? 'transition-transform motion-safe:hover:-translate-y-1 md:col-span-2' : 'transition-transform motion-safe:hover:-translate-y-1'}>
          <CardHeader className="gap-5 p-7">
            <Icon className="size-7 text-primary" strokeWidth={1.25} aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
            <CardDescription>{text}</CardDescription>
          </CardHeader>
        </Card>)}
      </div>
      <Link to="/products" className="mx-auto mt-8 flex w-fit items-center gap-2 border-b border-current pb-1 text-sm">Khám phá tủ đồ của bạn <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
    </EditorialSection>
  </div>
}
