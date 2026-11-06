import { useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowUp } from "lucide-react";
import { CategorySection } from "./CategorySection";
import { NewArrivals } from "./NewArrivals";
import { BestSellers } from "./BestSellers";
import { PromoBanner } from "./PromoBanner";
import { LookbookSection } from "./LookbookSection";
import { ServiceSection } from "./ServiceSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { SocialSection } from "./SocialSection";
import { BlazerNewsletter } from "./BlazerNewsletter";
import { BlazerFooter } from "./BlazerFooter";
export function BlazerSections() {
  const { scrollY, scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  const [showTop, setShowTop] = useState(false);
  useMotionValueEvent(scrollY, "change", (value) => setShowTop(value > 400));
  return (
    <div className="bg-background text-foreground [--font-display:'Cormorant_Garamond_Variable',serif] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4">
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-primary"
      />
      <CategorySection />
      <NewArrivals />
      <BestSellers />
      <PromoBanner />
      <LookbookSection />
      <ServiceSection />
      <TestimonialsSection />
      <SocialSection />
      <BlazerNewsletter />
      <BlazerFooter />
      {showTop && (
        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: reduced ? "instant" : "smooth",
            })
          }
          aria-label="Về đầu trang"
          className="fixed bottom-5 right-5 z-30 grid size-11 place-items-center rounded-full border bg-background text-foreground shadow-lg"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  );
}
