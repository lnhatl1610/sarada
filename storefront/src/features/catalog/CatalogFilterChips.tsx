import { formatVnd } from '../../lib/money'

type FilterOption = { name: string; slug: string }
type CatalogFilterChipsProps = {
  entries: [string, string][]
  categories: FilterOption[]
  brands: FilterOption[]
  onRemove: (key: string) => void
  onClear: () => void
}

const labels: Record<string, string> = {
  q: 'Từ khóa',
  category: 'Danh mục',
  brand: 'Thương hiệu',
  price_min: 'Giá từ',
  price_max: 'Đến giá',
  size: 'Kích cỡ',
  color: 'Màu sắc',
  material: 'Chất liệu',
  fit: 'Kiểu dáng / form',
  in_stock: 'Tình trạng',
  rating_min: 'Đánh giá từ',
  discount_min: 'Giảm giá từ',
  sort: 'Sắp xếp',
  new: 'Hàng mới',
  best_seller: 'Bán chạy',
  sale: 'Đang giảm giá',
  target_gender: 'Đối tượng',
}

const genderLabels: Record<string, string> = { men: 'Nam', women: 'Nữ', unisex: 'Không phân biệt giới tính', kids: 'Trẻ em' }

const sortLabels: Record<string, string> = {
  relevance: 'Liên quan',
  newest: 'Mới nhất',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  bestseller: 'Bán chạy',
  rating_desc: 'Đánh giá cao nhất',
  discount_desc: 'Giảm giá nhiều nhất',
}

function displayValue(key: string, value: string, categories: FilterOption[], brands: FilterOption[]) {
  if (key === 'category') return categories.find((option) => option.slug === value)?.name ?? value
  if (key === 'brand') return brands.find((option) => option.slug === value)?.name ?? value
  if (key === 'sort') return sortLabels[value] ?? value
  if (key === 'in_stock') return value === '1' || value === 'true' ? 'Còn hàng' : 'Hết hàng'
  if (key === 'rating_min') return `${value} sao trở lên`
  if (key === 'discount_min') return `${value}%`
  if (key === 'new' || key === 'best_seller' || key === 'sale') return value === '1' || value === 'true' ? 'Đang bật' : value
  if (key === 'target_gender') return genderLabels[value] ?? value
  if (key.startsWith('price_') && Number.isFinite(Number(value))) return formatVnd(Number(value))
  return value
}

export function CatalogFilterChips({ entries, categories, brands, onRemove, onClear }: CatalogFilterChipsProps) {
  if (!entries.length) return null

  return <div className="active-filters" role="group" aria-label="Bộ lọc đang áp dụng">
    {entries.map(([key, value]) => <button className="filter-chip" type="button" key={key} aria-label={`Xóa bộ lọc ${labels[key] ?? key}: ${displayValue(key, value, categories, brands)}`} onClick={() => onRemove(key)}>
      <span>{labels[key] ?? key}: {displayValue(key, value, categories, brands)}</span><span aria-hidden="true">×</span>
    </button>)}
    <button className="filter-clear-all" type="button" onClick={onClear}>Xóa tất cả</button>
  </div>
}
