import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { EditorialSection } from "./EditorialSection";
import { photos } from "./blazer-demo";
import { cn } from "@/lib/utils";
const categories = [
  { name: "Áo", count: "240+" },
  { name: "Quần", count: "180+" },
  { name: "Váy & Đầm", count: "150+" },
  { name: "Áo khoác", count: "90+" },
  { name: "Giày", count: "120+" },
  { name: "Túi xách", count: "80+" },
  { name: "Phụ kiện", count: "200+" },
  { name: "Bộ sưu tập mới", count: "Thu Đông 2026" },
];
export function CategorySection() {
  return (
    <EditorialSection
      id="categories-title"
      eyebrow="01 / Chọn phong cách của bạn"
      title="Khám phá theo danh mục"
      subtitle="Tìm phong cách dành riêng cho bạn"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {categories.map((category, index) => (
          <Link
            to={`/search?q=${encodeURIComponent(category.name)}`}
            key={category.name}
            className={cn(
              "group relative min-h-52 overflow-hidden bg-muted md:min-h-64",
              index === 0 && "md:col-span-2 md:row-span-2",
              index === 7 && "col-span-2",
            )}
          >
            <img
              src={photos[index]}
              alt={category.name}
              loading="lazy"
              decoding="async"
              width="700"
              height="900"
              className="absolute size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-2 text-white">
              <div>
                <h3 className="font-['Cormorant_Garamond_Variable'] text-3xl md:text-4xl">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs tracking-wider">
                  {category.count}
                  {index < 7 ? " sản phẩm" : ""}
                </p>
              </div>
              <ArrowUpRight className="size-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </EditorialSection>
  );
}
