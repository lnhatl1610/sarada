import { useEffect, useRef, useState } from "react";
import { Truck, RefreshCcw, ShieldCheck, Headphones } from "lucide-react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { EditorialSection } from "./EditorialSection";
const services = [
  {
    icon: Truck,
    title: "Miễn phí vận chuyển",
    text: "Cho đơn hàng từ 500.000₫ trên toàn quốc, giao nhanh 2–4 ngày.",
  },
  {
    icon: RefreshCcw,
    title: "Đổi trả trong 7 ngày",
    text: "Đổi size, đổi mẫu dễ dàng, không cần lý do phức tạp.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán an toàn",
    text: "An tâm mua sắm, kiểm tra đơn hàng và thanh toán khi nhận.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    text: "Tư vấn size & phối đồ qua các kênh hỗ trợ của cửa hàng.",
  },
];
function Stat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible || reduced) return;
    const controls = animate(0, value, { duration: 1.5, onUpdate: setCount });
    return () => controls.stop();
  }, [visible, reduced, value]);
  return (
    <div ref={ref}>
      <p className="font-sans text-4xl md:text-5xl">
        {new Intl.NumberFormat("vi-VN", {
          maximumFractionDigits: value < 10 ? 1 : 0,
        }).format(reduced ? value : count)}
        {suffix}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
export function ServiceSection() {
  return (
    <EditorialSection
      id="service-title"
      title="Vì sao chọn chúng tôi"
      className="border-y bg-muted/30"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {services.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="group border bg-background p-5 transition-transform hover:-translate-y-1 motion-reduce:transform-none md:p-7"
          >
            <Icon className="mb-6 size-7 stroke-1 transition-transform group-hover:rotate-6 group-hover:scale-110" />
            <h3 className="mb-3 text-sm font-semibold">{title}</h3>
            <p className="text-xs leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-8 border-t pt-10 text-center lg:grid-cols-4">
        <Stat value={50000} suffix="+" label="khách hàng" />
        <Stat value={1200} suffix="+" label="mẫu thiết kế" />
        <Stat value={4.9} suffix="/5" label="đánh giá" />
        <Stat value={63} suffix="" label="tỉnh thành giao hàng" />
      </div>
    </EditorialSection>
  );
}
