export type EditorialProduct = {
  id: number;
  name: string;
  price: number;
  image: string;
  second: string;
  group: string;
  oldPrice: number;
};
export const fashionPhoto = (id: string, width = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const photos = [
  fashionPhoto("photo-1539109136881-3be0616acf4b"),
  fashionPhoto("photo-1483985988355-763728e1935b"),
  fashionPhoto("photo-1483985988355-763728e1935b"),
  "/blazer-look-1-hd.webp",
  fashionPhoto("photo-1549298916-b41d501d3772"),
  fashionPhoto("photo-1553062407-98eeb64c6a62"),
  fashionPhoto("photo-1511499767150-a48a237f0083"),
  "/blazer-look-3-hd.webp",
];
const names = [
  "Áo sơ mi linen oversize",
  "Quần ống rộng cạp cao",
  "Đầm midi hoa nhí",
  "Áo khoác blazer dáng suông",
  "Giày sneaker tối giản",
  "Túi tote canvas",
  "Kính mát dáng oval",
  "Áo blazer thanh lịch",
];
export const demoProducts: EditorialProduct[] = names.map((name, id) => ({
  id,
  name,
  price: [490000, 590000, 790000, 1290000, 990000, 390000, 290000, 1190000][id],
  oldPrice: [612500, 737500, 987500, 1612500, 1237500, 487500, 362500, 1487500][
    id
  ],
  image: photos[id],
  second:
    id === 3 || id === 7
      ? "/blazer-look-2-hd.webp"
      : photos[(id + 1) % photos.length],
  group: id < 4 ? "Nữ" : id === 7 ? "Nam" : "Phụ kiện",
}));
export const vnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
