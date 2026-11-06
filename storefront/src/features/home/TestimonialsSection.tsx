import { useEffect, useState } from "react";
import { Quote, Star, BadgeCheck } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { EditorialSection } from "./EditorialSection";
import { cn } from "@/lib/utils";
const reviews = [
  {
    name: "Minh Anh",
    city: "Hà Nội",
    text: "Chất vải mềm và đứng form vừa đẹp. Mặc đi làm cả ngày vẫn rất thoải mái, mình sẽ quay lại chọn thêm màu khác.",
  },
  {
    name: "Thu Hà",
    city: "TP.HCM",
    text: "Đường may chỉn chu, màu sắc nhẹ nhàng như mình thích. Nhân viên tư vấn size rất tận tình.",
  },
  {
    name: "Ngọc Linh",
    city: "Đà Nẵng",
    text: "Áo blazer phối với quần jeans hay chân váy đều đẹp. Đóng gói cẩn thận và giao hàng nhanh.",
  },
  {
    name: "Hoàng Vy",
    city: "Cần Thơ",
    text: "Lần đầu mua online mà vừa vặn ngay. Mình thích những thiết kế đơn giản, có thể mặc được nhiều dịp.",
  },
  {
    name: "Quỳnh Chi",
    city: "Hải Phòng",
    text: "Đổi size dễ dàng, không phải chờ lâu. Chất liệu đẹp hơn mình mong đợi.",
  },
  {
    name: "Bảo Ngọc",
    city: "Huế",
    text: "Bộ đồ nhẹ nhàng nhưng vẫn rất thanh lịch. Bạn bè hỏi mình mua ở đâu suốt.",
  },
];
export function TestimonialsSection() {
  const reduced = useReducedMotion();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: true }),
  );
  useEffect(() => {
    if (!api) return;
    const select = () => setCurrent(api.selectedScrollSnap());
    api.on("select", select);
    return () => {
      api.off("select", select);
    };
  }, [api]);
  return (
    <EditorialSection
      id="reviews-title"
      eyebrow="05 / Những câu chuyện thật gần"
      title="Khách hàng nói gì về chúng tôi"
    >
      <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-8">
        <div className="text-center">
          <p className="font-['Cormorant_Garamond_Variable'] text-6xl">
            4.9<span className="text-xl"> / 5</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dựa trên 3.200 đánh giá mẫu
          </p>
        </div>
        <div className="flex w-32 flex-col gap-1.5">
          {[92, 6, 2, 0, 0].map((value, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span>{5 - i}</span>
              <div className="h-1.5 flex-1 bg-muted">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={reduced ? [] : [autoplay]}
      >
        <CarouselContent>
          {reviews.map((review) => (
            <CarouselItem
              key={review.name}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <article className="flex h-full flex-col gap-5 border bg-muted/20 p-7">
                <Quote className="size-8 stroke-1" />
                <div className="flex gap-1" aria-label="5 trên 5 sao">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-3 fill-current" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-7">“{review.text}”</p>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-muted text-xs">
                    {review.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{review.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t pt-4">
                  <img
                    src="/blazer-look-1-hd.webp"
                    alt="Blazer dáng suông"
                    loading="lazy"
                    width="32"
                    height="40"
                    className="h-10 w-8 object-cover"
                  />
                  <span className="text-xs">Đã mua: Blazer dáng suông</span>
                </div>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <BadgeCheck className="size-3" />
                  Đánh giá minh họa, chưa xác minh mua hàng
                </p>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-7 flex items-center justify-center gap-3">
          <CarouselPrevious
            className="static translate-y-0"
            aria-label="Đánh giá trước"
          />
          {reviews.map((review, i) => (
            <button
              key={review.name}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Đến đánh giá ${i + 1}`}
              aria-current={current === i ? "true" : undefined}
              className="grid size-6 place-items-center"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-muted-foreground/30",
                  current === i && "bg-foreground",
                )}
              />
            </button>
          ))}
          <CarouselNext
            className="static translate-y-0"
            aria-label="Đánh giá tiếp theo"
          />
        </div>
      </Carousel>
    </EditorialSection>
  );
}
