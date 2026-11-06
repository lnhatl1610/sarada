import { expect, test } from '@playwright/test'

const mutationsEnabled = process.env.E2E_ALLOW_MUTATIONS === 'true'
const customerEmail = process.env.E2E_CUSTOMER_EMAIL
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD

async function addAvailableShirtToCart(page: import('@playwright/test').Page) {
  await page.goto('/products/ao-so-mi-linen')
  await page.getByRole('button', { name: 'Chọn màu Natural' }).click()

  const size = page.locator('.select-label select')
  const availableSizes = await size.locator('option:not([disabled])').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
  )

  if (!availableSizes.length) throw new Error('E2E fixture ao-so-mi-linen has no available size.')

  await size.selectOption(availableSizes[0])
  await page.getByRole('button', { name: 'Thêm vào túi' }).click()
  await expect(page.getByRole('button', { name: /Mở túi hàng, 1 sản phẩm/ })).toBeVisible()
}

async function fillGuestCheckout(page: import('@playwright/test').Page) {
  await page.getByLabel('Họ tên').fill('Khách kiểm thử')
  await page.getByLabel('Số điện thoại').fill('0911111111')
  await page.getByLabel('Email').fill('e2e@fashion-store.local')
  await page.getByRole('combobox', { name: 'Tỉnh / thành' }).selectOption({ index: 1 })
  await expect(page.getByRole('combobox', { name: 'Xã / phường' })).toBeEnabled()
  await page.getByRole('combobox', { name: 'Xã / phường' }).selectOption({ index: 1 })
  await page.getByLabel('Địa chỉ cụ thể').fill('12 Đường Kiểm Thử')
}

test('guest can place a COD order and track it', async ({ page }) => {
  test.skip(!mutationsEnabled, 'Requires E2E_ALLOW_MUTATIONS=true and a disposable API database.')

  await addAvailableShirtToCart(page)
  await page.goto('/cart')
  await expect(page.locator('main').getByText('Áo sơ mi linen dáng rộng', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Tiến hành thanh toán' }).click()
  await fillGuestCheckout(page)

  const submit = page.getByRole('button', { name: /Đặt hàng/ })
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect(page.getByText('ĐẶT HÀNG THÀNH CÔNG', { exact: true })).toBeVisible()
  const orderCode = (await page.locator('main p strong').first().textContent())?.trim()
  expect(orderCode).toBeTruthy()

  await page.getByRole('link', { name: 'Theo dõi đơn hàng' }).click()
  await expect(page.getByLabel('Mã đơn')).toHaveValue(orderCode!)
  await page.getByLabel('Số điện thoại hoặc email').fill('0911111111')
  await page.getByRole('button', { name: 'Tra cứu đơn hàng' }).click()
  await expect(page.getByText(`ĐƠN ${orderCode!}`, { exact: true })).toBeVisible()
})

test('customer sign-in merges the existing guest cart', async ({ page }) => {
  test.skip(!mutationsEnabled || !customerEmail || !customerPassword, 'Requires an isolated DB and E2E customer credentials.')

  await addAvailableShirtToCart(page)
  await page.goto('/login?returnTo=%2Fcart')
  await page.getByLabel('Email').fill(customerEmail!)
  await page.locator('input[type="password"]').fill(customerPassword!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.locator('main').getByText('Áo sơ mi linen dáng rộng', { exact: true })).toBeVisible()
})

test('checkout retains its form when the order API reports a stock conflict', async ({ page }) => {
  test.skip(!mutationsEnabled, 'Requires E2E_ALLOW_MUTATIONS=true and a disposable API database.')

  await addAvailableShirtToCart(page)
  await page.goto('/checkout')
  await fillGuestCheckout(page)
  await page.route('**/api/v1/orders', (route) => route.fulfill({
    status: 422,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Một sản phẩm trong giỏ vừa hết hàng.',
      errors: { cart: ['Một sản phẩm trong giỏ vừa hết hàng.'] },
    }),
  }))

  await page.getByRole('button', { name: /Đặt hàng/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Một sản phẩm trong giỏ vừa hết hàng.' })).toBeVisible()
  await expect(page.getByLabel('Họ tên')).toHaveValue('Khách kiểm thử')
})
