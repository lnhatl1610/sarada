import { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EditorialSection } from "./EditorialSection";
import { EditorialProductCard } from "./EditorialProductCard";
import { demoProducts } from "./blazer-demo";
export function NewArrivals() {
  const [tab, setTab] = useState("Tất cả");
  const reduced = useReducedMotion();
  return (
    <EditorialSection
      id="new-title"
      eyebrow="02 / The latest edit"
      title="Hàng mới về"
      subtitle="Cập nhật mỗi tuần — số lượng có hạn"
      className="bg-muted/30"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mx-auto mb-8">
          {["Tất cả", "Nữ", "Nam", "Phụ kiện"].map((value) => (
            <TabsTrigger value={value} key={value}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                  {demoProducts
                    .filter((p) => tab === "Tất cả" || p.group === tab)
                    .map((product) => (
                      <CarouselItem
                        key={product.id}
                        className="basis-[77%] md:basis-1/2 lg:basis-1/4"
                      >
                        <EditorialProductCard product={product} />
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="mt-7 flex justify-center gap-3">
                  <CarouselPrevious
                    className="static translate-y-0"
                    aria-label="Sản phẩm trước"
                  />
                  <CarouselNext
                    className="static translate-y-0"
                    aria-label="Sản phẩm tiếp theo"
                  />
                </div>
              </Carousel>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
      <div className="mt-7 text-center">
        <Link
          to="/products"
          className="inline-block border-b pb-2 text-xs uppercase tracking-widest"
        >
          Xem tất cả sản phẩm mới ↗
        </Link>
      </div>
    </EditorialSection>
  );
}
