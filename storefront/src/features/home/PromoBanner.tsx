import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
export function PromoBanner() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const [end] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
  });
  const [now, setNow] = useState(Date.now);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const seconds = Math.max(0, Math.floor((end - now) / 1000));
  const values = [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  async function copy() {
    try {
      await navigator.clipboard.writeText("SALE50");
      setCopied(true);
      toast.success("Đã sao chép mã");
    } catch {
      toast.error("Không thể sao chép. Mã ưu đãi: SALE50");
    }
  }
  return (
    <section
      ref={ref}
      aria-labelledby="sale-title"
      className="relative isolate overflow-hidden bg-foreground px-5 py-20 text-background md:py-28"
    >
      <motion.img
        style={{ y: reduced ? 0 : y }}
        src="/blazer-look-2-hd.webp"
        alt=""
        loading="lazy"
        width="1122"
        height="1402"
        className="absolute -top-20 -z-20 h-[130%] w-full object-cover object-[center_35%]"
      />
      <div className="absolute inset-0 -z-10 bg-black/65" />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="border border-white/40 px-4 py-2 text-xs tracking-[0.3em]">
          FLASH SALE
        </span>
        <h2
          id="sale-title"
          className="font-sans text-5xl md:text-7xl"
        >
          Giảm đến 50%
          <br />
          <span className="italic">Săn deal cuối mùa</span>
        </h2>
        <p className="max-w-lg text-sm leading-6">
          Áp dụng cho hơn 300 sản phẩm. Miễn phí vận chuyển cho đơn từ 500.000₫.
        </p>
        <div
          role="timer"
          aria-label="Thời gian đến hết tháng"
          className="flex gap-3"
        >
          {values.map((value, i) => (
            <div
              key={i}
              className="w-16 border border-white/25 bg-white/10 p-3 backdrop-blur md:w-20"
            >
              <b className="block text-2xl tabular-nums">
                {String(value).padStart(2, "0")}
              </b>
              <small className="text-[10px] uppercase tracking-widest">
                {["Ngày", "Giờ", "Phút", "Giây"][i]}
              </small>
            </div>
          ))}
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {["Mua 2 giảm 10%", "Mua 3 giảm 20%", "Combo mix & match −30%"].map(
            (text) => (
              <p
                key={text}
                className="border border-white/25 px-3 py-4 text-xs"
              >
                {text}
              </p>
            ),
          )}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-4 border border-dashed border-white/60 px-6 py-3 text-sm tracking-widest"
          aria-label="Sao chép mã SALE50"
        >
          SALE50{" "}
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
        <div className="flex items-center gap-6">
          <Link
            to="/products"
            className="bg-background px-7 py-3 text-sm text-foreground"
          >
            Mua ngay ↗
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Xem điều kiện</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Điều kiện chương trình</DialogTitle>
                <DialogDescription>
                  Đây là nội dung khuyến mãi minh họa cho giao diện, chưa phải
                  ưu đãi đang áp dụng.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-7">
                Mức giảm, sản phẩm tham gia và thời hạn cần được cửa hàng xác
                nhận trước khi công bố. Không cộng dồn mã. Giá thanh toán thực
                tế được xác nhận tại giỏ hàng.
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
