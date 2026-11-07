import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
export function EditorialSection({
  id,
  title,
  subtitle,
  eyebrow,
  children,
  className,
}: {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      aria-labelledby={id}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65 }}
      className={cn("px-5 py-16 md:px-10 md:py-24", className)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h2
            id={id}
            className="font-sans text-4xl font-medium md:text-6xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </motion.section>
  );
}
