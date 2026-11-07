import { useState } from "react";
import { Link } from "react-router";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { vnd, type EditorialProduct } from "./blazer-demo";
export function EditorialProductCard({
  product,
  rank,
  best = false,
}: {
  product: EditorialProduct;
  rank?: number;
  best?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  return (
    <article className="group min-w-0">
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        <Link to={`/search?q=${encodeURIComponent(product.name)}`}>
          <img
            src={product.image}
            alt={product.name}
            width="600"
            height="800"
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
          />
          <img
            src={product.second}
            alt=""
            width="600"
            height="800"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 motion-reduce:transition-none"
          />
        </Link>
        <div className="absolute left-3 top-3">
          <Badge variant={best ? "secondary" : "default"}>
            {best ? "-20%" : "New"}
          </Badge>
        </div>
        <button
          aria-label={`${liked ? "Bỏ yêu thích" : "Yêu thích"} ${product.name}`}
          aria-pressed={liked}
          onClick={() => {
            setLiked(!liked);
            toast(
              liked
                ? "Đã bỏ khỏi danh sách xem thử"
                : "Đã lưu yêu thích trong phiên xem thử",
            );
          }}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-background/95 text-foreground"
        >
          <Heart
            className={cn(
              "size-4 transition-transform active:scale-125",
              liked && "fill-current",
            )}
          />
        </button>
        {rank && rank <= 3 && (
          <span
            aria-label={`Hạng ${rank}`}
            className="pointer-events-none absolute bottom-12 left-3 font-sans text-7xl text-white [text-shadow:0_1px_8px_#0008]"
          >
            0{rank}
          </span>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="absolute inset-x-3 bottom-3 w-[calc(100%-1.5rem)] md:translate-y-16 md:group-hover:translate-y-0 md:group-focus-within:translate-y-0 transition-transform motion-reduce:transition-none"
            >
              Xem nhanh
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>
                Sản phẩm minh họa — chọn kích cỡ để xem thử. Mua hàng thật tại
                danh mục sản phẩm.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 sm:grid-cols-2">
              <img
                src={product.image}
                alt={product.name}
                width="600"
                height="800"
                className="aspect-3/4 w-full object-cover"
              />
              <div className="flex flex-col gap-5">
                <p className="text-2xl">{vnd(product.price)}</p>
                <fieldset>
                  <legend className="mb-2 text-sm">Kích cỡ</legend>
                  <div className="flex gap-2">
                    {["S", "M", "L", "XL"].map((value) => (
                      <label key={value} className="cursor-pointer">
                        <input
                          type="radio"
                          name={`size-${product.id}-${best}`}
                          value={value}
                          checked={size === value}
                          onChange={() => setSize(value)}
                          className="peer sr-only"
                        />
                        <span className="grid size-10 place-items-center border peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2">
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex flex-col gap-2 text-sm">
                  Số lượng
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                      )
                    }
                  />
                </label>
                <Button
                  onClick={() =>
                    toast(
                      `Xem thử: ${quantity} × ${product.name}, size ${size}. Chưa tạo giỏ hàng thật.`,
                    )
                  }
                >
                  <ShoppingBag data-icon="inline-start" />
                  Thử thêm vào giỏ
                </Button>
                <Link
                  className="text-sm underline underline-offset-4"
                  to={`/search?q=${encodeURIComponent(product.name)}`}
                >
                  Tìm sản phẩm trong cửa hàng
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-2 pt-4">
        {best && (
          <p className="flex items-center gap-1 text-xs">
            <Star className="size-3 fill-current" />
            4.8{" "}
            <span className="text-muted-foreground">(126) · Đã bán 1.2k</span>
          </p>
        )}
        <h3 className="text-sm font-medium">{product.name}</h3>
        <p className="text-sm font-semibold">
          {vnd(product.price)}{" "}
          {best && (
            <del className="ml-2 text-xs font-normal text-muted-foreground">
              {vnd(product.oldPrice)}
            </del>
          )}
        </p>
        <div className="flex items-center justify-between">
          <span aria-label="Màu: đen, be, xám" className="flex gap-1.5">
            <i className="size-3 rounded-full bg-stone-800" />
            <i className="size-3 rounded-full bg-stone-300" />
            <i className="size-3 rounded-full bg-stone-500" />
          </span>
          <span className="text-[10px] tracking-widest text-muted-foreground">
            S · M · L · XL
          </span>
        </div>
      </div>
    </article>
  );
}
