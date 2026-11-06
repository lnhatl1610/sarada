import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const photoCategories = ['trang-phuc', 'hang-moi', 'ao', 'quan', 'vay', 'ao-khoac', 'phu-kien']
const photoCollections = ['hang-moi', 'thu-dong-2026']
const outputs = [
  ...photoCategories.map((slug) => `api/public/demo-media/covers/category-${slug}-photo-v1.webp`),
  'api/public/demo-media/covers/category-trang-phuc-photo-v2.webp',
  ...photoCollections.map((slug) => `api/public/demo-media/covers/collection-${slug}-photo-v1.webp`),
  'api/public/demo-media/banners/hero-editorial-desktop-photo-v1.webp',
  'api/public/demo-media/banners/hero-editorial-mobile-photo-v1.webp',
  'api/public/demo-media/banners/campaign-editorial-photo-v1.webp',
  'api/public/demo-media/video/brand-editorial-photo-v1.mp4',
  'tools/assets/source-photos/home-hero-desktop-v1.png',
  'tools/assets/source-photos/home-hero-mobile-v1.png',
  'tools/assets/source-photos/campaign-editorial-v1.png',
  'tools/assets/source-photos/category-trang-phuc-v2.png',
  'storefront/public/og-image.jpg',
]

async function fingerprint() {
  const results = new Map()

  for (const relativePath of outputs) {
    const content = await readFile(resolve(root, relativePath))
    results.set(relativePath, createHash('sha256').update(content).digest('hex'))
  }

  return results
}

const before = await fingerprint()
await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, ['tools/assets/render-storefront-assets.mjs'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  })

  child.once('error', reject)
  child.once('exit', (code) => {
    if (code === 0) resolvePromise()
    else reject(new Error(`Asset renderer exited with code ${code ?? 'unknown'}`))
  })
})
const after = await fingerprint()
const changed = outputs.filter((relativePath) => before.get(relativePath) !== after.get(relativePath))

if (changed.length > 0) {
  process.stderr.write(`Non-reproducible generated assets:\n${changed.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Verified ${outputs.length} generated assets have identical SHA-256 hashes after regeneration.\n`)
}
