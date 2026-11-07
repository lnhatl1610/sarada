import { Heart, MessageCircle, Camera as Instagram } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EditorialSection } from "./EditorialSection";
import { photos } from "./blazer-demo";

export function SocialSection() {
  const reduced = useReducedMotion();
  return (
    <EditorialSection
      id="social-title"
      title="Theo dõi @sarada.fashion"
      subtitle="Chia sẻ outfit của bạn với #SaradaStyle để được lên trang chủ"
      className="overflow-hidden bg-muted/20"
    >
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {photos.slice(0, 6).map((photo, i) => (
          <a
            key={i}
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label={`Khám phá phong cách ${i + 1} trên Instagram`}
            className="group relative aspect-square overflow-hidden"
          >
            <img
              src={photo}
              alt={`Cảm hứng trang phục ${i + 1}`}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none"
            />
            <span className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
              <Heart className="size-4" />
              {128 + i * 32}
              <MessageCircle className="size-4" />
              {12 + i}
            </span>
          </a>
        ))}
      </div>
      <div className="mt-10 overflow-hidden border-y py-5" aria-hidden="true">
        <motion.div
          animate={reduced ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-10 whitespace-nowrap font-sans text-3xl italic text-muted-foreground"
        >
          {[0, 1].map((i) => (
            <span key={i}>
              #OOTD · #FashionVN · #MinimalStyle · #WinterCollection · #SaradaStyle
            </span>
          ))}
        </motion.div>
      </div>
      <div className="mt-7 text-center">
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border-b pb-2 text-xs uppercase tracking-widest"
        >
          <Instagram className="size-4" />
          Theo dõi trên Instagram
        </a>
      </div>
    </EditorialSection>
  );
}
