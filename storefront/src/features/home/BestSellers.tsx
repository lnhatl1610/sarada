import { EditorialSection } from "./EditorialSection";
import { EditorialProductCard } from "./EditorialProductCard";
import { demoProducts } from "./blazer-demo";
export function BestSellers() {
  return (
    <EditorialSection
      id="best-title"
      eyebrow="03 / Những lựa chọn được yêu thích"
      title="Được yêu thích nhất"
      subtitle="Những item khách hàng chọn nhiều nhất tháng này"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        {demoProducts.map((product, i) => (
          <EditorialProductCard
            key={product.id}
            product={product}
            rank={i + 1}
            best
          />
        ))}
      </div>
    </EditorialSection>
  );
}
