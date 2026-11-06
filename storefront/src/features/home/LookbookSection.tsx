import { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EditorialSection } from "./EditorialSection";
import { demoProducts, photos, vnd } from "./blazer-demo";
import { cn } from "@/lib/utils";
const looks = [
  {
    name: "Minimal Office",
    description: "Thanh lịch trong từng chuyển động.",
    image: "/blazer-look-1-hd.webp",
    product: 3,
  },
  {
    name: "Weekend Casual",
    description: "Một chút tự do cho ngày cuối tuần.",
    image: photos[0],
    product: 0,
  },
  {
    name: "Night Out",
    description: "Dấu ấn riêng khi thành phố lên đèn.",
    image: photos[1],
    product: 2,
  },
  {
    name: "Street Layer",
    description: "Nghệ thuật của những lớp trang phục.",
    image: "/blazer-look-3-hd.webp",
    product: 7,
  },
];
export function LookbookSection() {
  const [selected, setSelected] = useState(0);
  const reduced = useReducedMotion();
  const look = looks[selected];
  return (
    <EditorialSection
      id="lookbook-title"
      eyebrow="04 / Cảm hứng mỗi ngày"
      title="Lookbook Thu Đông 2026"
      subtitle="Phối đồ cùng stylist của chúng tôi"
    >
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div className="relative aspect-3/4 overflow-hidden bg-muted md:aspect-4/5">
          <AnimatePresence mode="wait">
            <motion.img
              key={look.image}
              src={look.image}
              alt={`Phối đồ ${look.name}`}
              loading="lazy"
              width="900"
              height="1125"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="size-full object-cover"
            />
          </AnimatePresence>
          {[0, 1].map((dot) => {
            const product = demoProducts[dot ? 1 : look.product];
            return (
              <Popover key={`${selected}-${dot}`}>
                <PopoverTrigger asChild>
                  <button
                    style={{
                      top: dot ? "68%" : "38%",
                      left: dot ? "56%" : "48%",
                    }}
                    aria-label={`Xem ${product.name}`}
                    className="absolute grid size-10 place-items-center rounded-full border border-white bg-white/80 text-black shadow-lg"
                  >
                    <Plus className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="flex gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      width="60"
                      height="80"
                      className="h-20 w-15 object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">{product.name}</h3>
                      <p className="text-xs">{vnd(product.price)}</p>
                      <Link
                        to={`/search?q=${encodeURIComponent(product.name)}`}
                        className="text-xs underline"
                      >
                        Xem sản phẩm ↗
                      </Link>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
          <span className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.25em] text-white [text-shadow:0_1px_4px_#000]">
            The art of everyday dressing
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="mb-6 font-['Cormorant_Garamond_Variable'] text-4xl italic">
            Ít hơn, nhưng khác biệt.
          </p>
          {looks.map((item, i) => (
            <button
              key={item.name}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className={cn(
                "flex items-center gap-4 border-b py-5 text-left transition-opacity",
                selected !== i && "opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={item.image}
                alt=""
                width="80"
                height="100"
                loading="lazy"
                className="h-24 w-18 object-cover"
              />
              <span className="min-w-0 flex-1 whitespace-normal">
                <small className="text-xs text-muted-foreground">
                  0{i + 1}
                </small>
                <strong className="block font-['Cormorant_Garamond_Variable'] text-3xl font-medium">
                  {item.name}
                </strong>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowUpRight className="size-5" />
            </button>
          ))}
          <Link
            to="/search?q=blazer"
            className="mt-7 text-xs uppercase tracking-widest underline underline-offset-8"
          >
            Xem toàn bộ lookbook ↗
          </Link>
        </div>
      </div>
      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3">
        {looks.map((item) => (
          <Link
            to={`/search?q=${encodeURIComponent(item.name)}`}
            key={item.name}
            className="group w-56 shrink-0 snap-start"
          >
            <img
              src={item.image}
              alt={item.name}
              width="224"
              height="280"
              loading="lazy"
              className="aspect-4/5 w-full object-cover"
            />
            <p className="mt-3 text-sm">{item.name} ↗</p>
          </Link>
        ))}
      </div>
    </EditorialSection>
  );
}
