import { expect, test } from '@playwright/test'

test('homepage and product rails load API content', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mặc điều bạn tin — chiến dịch thu đông' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sản phẩm mới' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Áo sơ mi linen dáng rộng/ }).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Sản phẩm mới' }).getByRole('link', { name: /Xem tất cả/ }))
    .toHaveAttribute('href', '/products?sort=newest&new=1')
  await expect(page.getByRole('region', { name: 'Sản phẩm bán chạy' }).getByRole('link', { name: /Xem tất cả/ }))
    .toHaveAttribute('href', '/products?sort=bestseller&best_seller=1')
})

test('catalog sort changes are reflected in the URL', async ({ page }) => {
  await page.goto('/products?sort=price_asc')

  await expect(page.getByRole('heading', { name: 'Sản phẩm', exact: true })).toBeVisible()
  const sort = page.locator('.catalog-filters select[name="sort"]')
  await expect(sort).toHaveValue('price_asc')
  await sort.selectOption('price_desc')
  await page.locator('.catalog-filters').getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page).toHaveURL(/sort=price_desc/)
  await expect(sort).toHaveValue('price_desc')
  await expect(page.getByText(/thiết kế được tuyển chọn/)).toBeVisible()
})

test('home merchandising links preserve their filters when catalog sorting changes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('region', { name: 'Sản phẩm mới' }).getByRole('link', { name: /Xem tất cả/ }).click()
  await expect(page).toHaveURL(/sort=newest&new=1/)

  const sort = page.locator('.catalog-filters select[name="sort"]')
  await sort.selectOption('bestseller')
  await page.locator('.catalog-filters').getByRole('button', { name: 'Áp dụng bộ lọc' }).click()
  await expect(page).toHaveURL(/sort=bestseller&new=1/)
  await expect(page.getByRole('group', { name: 'Bộ lọc đang áp dụng' }).getByRole('button', { name: 'Xóa bộ lọc Hàng mới: Đang bật' })).toBeVisible()
})

test('product page discloses generated demo photography', async ({ page }) => {
  await page.goto('/products/ao-so-mi-linen')

  await expect(page.getByRole('heading', { name: 'Áo sơ mi linen dáng rộng' })).toBeVisible()
  await expect(page.getByText('Ảnh dựng', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('img', { name: /Ảnh AI demo.*không phải ảnh chụp đã xác nhận/ })).toBeVisible()
})

test('order lookup form exposes separate labeled fields', async ({ page }) => {
  await page.goto('/track-order')

  await expect(page.getByLabel('Mã đơn')).toBeVisible()
  await expect(page.getByLabel('Số điện thoại hoặc email')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tra cứu đơn hàng' })).toBeVisible()
})

test('mobile homepage stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))

  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
})
