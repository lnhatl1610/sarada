const args = process.argv.slice(2)
const apiBaseArgument = args.find((argument) => !argument.startsWith('--'))
const includeProductReviews = args.includes('--include-reviews') || process.env.STOREFRONT_AUDIT_INCLUDE_REVIEWS === '1'
const apiBaseUrl = (apiBaseArgument || process.env.STOREFRONT_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '')
const routes = [
  '/auth/registration-status',
  '/categories',
  '/banners',
  '/collections',
  '/products?per_page=48',
]
const mediaKeys = new Set([
  'image',
  'url',
  'src',
  'srcset',
  'banner',
  'video_url',
  'store_logo',
  'store_favicon',
  'seo_og_image',
])
const expectedContentTypes = new Map([
  ['.avif', ['image/avif']],
  ['.jpeg', ['image/jpeg']],
  ['.jpg', ['image/jpeg']],
  ['.mp4', ['video/mp4']],
  ['.png', ['image/png']],
  ['.svg', ['image/svg+xml']],
  ['.webm', ['video/webm']],
  ['.webp', ['image/webp']],
])
const mediaUrls = new Set()
const routeCounts = new Map()
const failures = []
let reachable = 0
let productSlugs = []
let approvedReviewCount = 0

function countCategories(categories) {
  return categories.reduce((count, category) => count + 1 + countCategories(category.children || []), 0)
}

function collectMedia(value, key = '') {
  if (Array.isArray(value)) {
    for (const item of value) collectMedia(item, key)
    return
  }

  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string' || !mediaKeys.has(key)) return

    for (const candidate of value.split(',')) {
      const url = candidate.trim().split(/\s+/u, 1)[0]
      if (/^https?:\/\//iu.test(url)) mediaUrls.add(url)
    }
    return
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    collectMedia(childValue, childKey)
  }
}

async function fetchJson(route) {
  const response = await fetch(`${apiBaseUrl}${route}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const json = await response.json()
  const data = json?.data
  if (data === undefined) throw new Error('Response is missing the data property')

  const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [data]
  if (route === '/products?per_page=48') productSlugs = rows.map((product) => product.slug).filter(Boolean)
  if (route.startsWith('/products/') && route.endsWith('/reviews')) approvedReviewCount += rows.length
  else routeCounts.set(route, route === '/categories' ? countCategories(rows) : rows.length)
  collectMedia(data)
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) failures.push(`${response.status} ${url}`)
    else {
      const pathname = new URL(url).pathname.toLowerCase()
      const extension = pathname.slice(pathname.lastIndexOf('.'))
      const expectedTypes = expectedContentTypes.get(extension)
      const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
      if (expectedTypes && !expectedTypes.includes(contentType)) {
        failures.push(`HTTP ${response.status} unexpected Content-Type ${contentType || '(missing)'} ${url}`)
      } else {
        reachable += 1
      }
    }
  } catch (error) {
    failures.push(`${error instanceof Error ? error.message : String(error)} ${url}`)
  }
}

await Promise.all(routes.map(async (route) => {
  try {
    await fetchJson(route)
  } catch (error) {
    failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`)
  }
}))

let nextReview = 0
if (includeProductReviews) {
  await Promise.all(Array.from({ length: Math.min(5, productSlugs.length) }, async () => {
    while (nextReview < productSlugs.length) {
      const slug = productSlugs[nextReview]
      nextReview += 1
      const route = `/products/${encodeURIComponent(slug)}/reviews`
      try {
        await fetchJson(route)
      } catch (error) {
        failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }))
}

const urls = [...mediaUrls]
let nextUrl = 0
await Promise.all(Array.from({ length: Math.min(8, urls.length) }, async () => {
  while (nextUrl < urls.length) {
    const url = urls[nextUrl]
    nextUrl += 1
    await checkUrl(url)
  }
}))

for (const [route, count] of routeCounts) console.log(`${route}: ${count} record(s)`)
console.log(`Approved product reviews: ${includeProductReviews ? approvedReviewCount : 'not checked (pass --include-reviews)'}`)
console.log(`API: ${apiBaseUrl}`)
console.log(`Unique media URLs: ${urls.length}`)
console.log(`Reachable: ${reachable}`)
console.log(`Failures: ${failures.length}`)
for (const failure of failures) console.error(`- ${failure}`)

if (failures.length > 0) process.exitCode = 1
