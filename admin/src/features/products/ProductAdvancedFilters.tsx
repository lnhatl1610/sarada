import { useTranslation } from 'react-i18next'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'

type ProductFilterOption = { id: number; name: string; parent_name?: string | null; group_name?: string | null; value?: string }
type ProductFilterValues = {
  q: string
  status: string
  is_featured: string
  is_new: string
  stock_status: string
  sort: string
  category_ids: string
  brand_ids: string
  collection_ids: string
  target_gender: string
  min_price: string
  max_price: string
  has_sale: string
  has_image: string
  created_from: string
  created_to: string
}

type Props = {
  filters: ProductFilterValues
  options?: {
    categories: ProductFilterOption[]
    brands: ProductFilterOption[]
    collections: ProductFilterOption[]
    tags: ProductFilterOption[]
  }
  onApplyAdvanced: (values: Record<string, string>) => void
}

const defaults = {
  is_featured: '', is_new: '', stock_status: '', sort: '-updated_at', category_ids: '', brand_ids: '', collection_ids: '',
  target_gender: '', min_price: '', max_price: '', has_sale: '', has_image: '', created_from: '', created_to: '',
}

export function ProductAdvancedFilters({ filters, options, onApplyAdvanced }: Props) {
  const { t } = useTranslation()
  const categoryIds = filters.category_ids ? filters.category_ids.split(',') : []
  const brandIds = filters.brand_ids ? filters.brand_ids.split(',') : []
  const collectionIds = filters.collection_ids ? filters.collection_ids.split(',') : []
  const activeCount = [filters.is_featured, filters.is_new, filters.stock_status, filters.target_gender, filters.min_price, filters.max_price, filters.has_sale, filters.has_image, filters.created_from, filters.created_to].filter(Boolean).length + categoryIds.length + brandIds.length + collectionIds.length

  return <>
    <AdvancedFilterSheet filters={filters} defaults={defaults} activeCount={activeCount} onApply={onApplyAdvanced}>
      {(draft, setDraft) => <>
        <label>{t('Sản phẩm nổi bật')}<select value={draft.is_featured} onChange={(event) => setDraft('is_featured', event.target.value)}><option value="">{t('Tất cả')}</option><option value="1">{t('Đang nổi bật')}</option><option value="0">{t('Không nổi bật')}</option></select></label>
        <label>{t('Sản phẩm mới')}<select value={draft.is_new} onChange={(event) => setDraft('is_new', event.target.value)}><option value="">{t('Tất cả')}</option><option value="1">{t('Hàng mới')}</option><option value="0">{t('Không phải hàng mới')}</option></select></label>
        <label>{t('Tình trạng tồn kho')}<select value={draft.stock_status} onChange={(event) => setDraft('stock_status', event.target.value)}><option value="">{t('Tất cả')}</option><option value="in_stock">{t('Còn hàng')}</option><option value="low_stock">{t('Sắp hết')}</option><option value="out_of_stock">{t('Hết hàng')}</option></select></label>
        <label>{t('Sắp xếp')}<select value={draft.sort} onChange={(event) => setDraft('sort', event.target.value)}><option value="-updated_at">{t('Mới cập nhật')}</option><option value="created_at">{t('Mới tạo')}</option><option value="name">{t('Tên A–Z')}</option><option value="price">{t('Giá tăng dần')}</option><option value="-price">{t('Giá giảm dần')}</option></select></label>
        <label>{t('Danh mục')}<select multiple size={5} value={categoryIds} onChange={(event) => setDraft('category_ids', Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','))}>{options?.categories.map((item) => <option key={item.id} value={String(item.id)}>{item.parent_name ? `${item.parent_name} / ${item.name}` : item.name}</option>)}</select></label>
        <label>{t('Thương hiệu')}<select multiple size={5} value={brandIds} onChange={(event) => setDraft('brand_ids', Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','))}>{options?.brands.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></label>
        <label>{t('Bộ sưu tập')}<select multiple size={5} value={collectionIds} onChange={(event) => setDraft('collection_ids', Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','))}>{options?.collections.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></label>
        <label>{t('Đối tượng')}<select value={draft.target_gender} onChange={(event) => setDraft('target_gender', event.target.value)}><option value="">{t('Tất cả')}</option><option value="male">{t('Nam')}</option><option value="female">{t('Nữ')}</option><option value="unisex">{t('Unisex')}</option><option value="kids">{t('Trẻ em')}</option></select></label>
        <label>{t('Giá từ (VND)')}<input type="number" min="0" value={draft.min_price} onChange={(event) => setDraft('min_price', event.target.value)} /></label>
        <label>{t('Giá đến (VND)')}<input type="number" min="0" value={draft.max_price} onChange={(event) => setDraft('max_price', event.target.value)} /></label>
        <label>{t('Khuyến mãi')}<select value={draft.has_sale} onChange={(event) => setDraft('has_sale', event.target.value)}><option value="">{t('Tất cả')}</option><option value="1">{t('Đang giảm giá')}</option><option value="0">{t('Không giảm giá')}</option></select></label>
        <label>{t('Ảnh sản phẩm')}<select value={draft.has_image} onChange={(event) => setDraft('has_image', event.target.value)}><option value="">{t('Tất cả')}</option><option value="1">{t('Có ảnh')}</option><option value="0">{t('Chưa có ảnh')}</option></select></label>
        <label>{t('Tạo từ ngày')}<input type="date" value={draft.created_from} onChange={(event) => setDraft('created_from', event.target.value)} /></label>
        <label>{t('Tạo đến ngày')}<input type="date" value={draft.created_to} onChange={(event) => setDraft('created_to', event.target.value)} /></label>
      </>}
    </AdvancedFilterSheet>
    
    {filters.min_price && filters.max_price && Number(filters.min_price) > Number(filters.max_price) && <p className="reference-error" role="alert">{t('Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.')}</p>}
    {filters.created_from && filters.created_to && filters.created_from > filters.created_to && <p className="reference-error" role="alert">{t('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.')}</p>}
  </>
}
