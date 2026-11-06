import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const media = join(root, 'api/public/demo-media')
const sourcePhotos = join(root, 'tools/assets/source-photos')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'msedge',
  'google-chrome',
  'chromium',
].filter(Boolean)
const ffmpeg = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'C:/ffmpeg/bin/ffmpeg.exe' : 'ffmpeg')

const photoCovers = [
  ['category-trang-phuc-photo-v1.webp', 'products/ao-so-mi-linen-generated-v5-photo.webp'],
  ['category-hang-moi-photo-v1.webp', 'products/ao-polo-cotton-pique-generated-v5-photo.webp'],
  ['category-ao-photo-v1.webp', 'products/ao-so-mi-linen-generated-v5-photo.webp'],
  ['category-quan-photo-v1.webp', 'products/quan-suong-cotton-generated-v5-photo.webp'],
  ['category-vay-photo-v1.webp', 'products/vay-midi-co-vuong-generated-v5-photo.webp'],
  ['category-ao-khoac-photo-v1.webp', 'products/ao-khoac-denim-ngan-generated-v5-photo.webp'],
  ['category-phu-kien-photo-v1.webp', 'products/tui-tote-canvas-flatlay-v1-photo.webp'],
]
const standalonePhotoCovers = [
  ['category-trang-phuc-photo-v2.webp', 'category-trang-phuc-v2.png'],
]
const collectionCovers = [
  ['collection-hang-moi-photo-v1.webp', 'products/ao-kieu-tay-phong-generated-v5-photo.webp'],
  ['collection-thu-dong-2026-photo-v1.webp', 'products/ao-cardigan-det-kim-generated-v5-photo.webp'],
]
const banners = [
  ['home-hero-desktop-v1.png', 'hero-editorial-desktop-photo-v1.webp', 1600, 900],
  ['home-hero-mobile-v1.png', 'hero-editorial-mobile-photo-v1.webp', 720, 900],
  ['campaign-editorial-v1.png', 'campaign-editorial-photo-v1.webp', 1200, 675],
]

async function run(command, args) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with code ${code}`)))
  })
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await run(candidate, ['--version'])
      return candidate
    } catch {}
  }

  throw new Error('Chromium/Edge not found. Set CHROME_PATH to its executable.')
}

async function renderPhoto(chrome, source, destination, width, height) {
  const temp = await mkdtemp(join(tmpdir(), 'fashion-photo-media-'))
  const html = join(temp, 'render.html')
  const screenshot = join(temp, 'photo.png')
  const sourceUrl = pathToFileURL(source).href
  try {
    await writeFile(html, `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#f0ece4}img{display:block;width:${width}px;height:${height}px;object-fit:cover}</style><img src="${sourceUrl}" alt="">`)
    await run(chrome, [
      '--headless', '--disable-gpu', '--hide-scrollbars', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
      '--allow-file-access-from-files', `--user-data-dir=${join(temp, 'profile')}`, '--virtual-time-budget=1000',
      `--window-size=${width},${height}`, `--screenshot=${screenshot}`, pathToFileURL(html).href,
    ])
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', screenshot, '-frames:v', '1',
      '-vf', `scale=${width}:${height}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '56', '-compression_level', '6', destination,
    ])
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

const chrome = await findChrome()
await mkdir(join(media, 'covers'), { recursive: true })
await mkdir(join(media, 'banners'), { recursive: true })
await mkdir(join(media, 'video'), { recursive: true })

const coverOutputs = [
  ...photoCovers.map(([name, source]) => [join(media, 'covers', name), join(media, source), 800, 1000, 80_000]),
  ...standalonePhotoCovers.map(([name, source]) => [join(media, 'covers', name), join(sourcePhotos, source), 800, 1000, 80_000]),
  ...collectionCovers.map(([name, source]) => [join(media, 'covers', name), join(media, source), 800, 1000, 80_000]),
]
const bannerOutputs = banners.map(([source, name, width, height]) => [
  join(media, 'banners', name), join(sourcePhotos, source), width, height, 150 * 1024,
])

for (const [destination, source, width, height, limit] of [...coverOutputs, ...bannerOutputs]) {
  if (!(await readFile(source).catch(() => null))) throw new Error(`Missing photo source: ${relative(root, source)}`)
  await renderPhoto(chrome, source, destination, width, height)
  const size = (await readFile(destination)).byteLength
  if (size >= limit) throw new Error(`${relative(root, destination)} is ${size} bytes; limit is ${limit}.`)
  process.stdout.write(`${relative(root, destination)}: ${width}×${height}, ${size} bytes\n`)
}

const campaignImage = join(media, 'banners/campaign-editorial-photo-v1.webp')
const videoOutput = join(media, 'video/brand-editorial-photo-v1.mp4')
await run(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-framerate', '25', '-i', campaignImage, '-t', '5',
  '-vf', "scale=1280:720:flags=lanczos,zoompan=z='min(1+0.00032*on,1.04)':d=125:s=1280x720:fps=25,format=yuv420p",
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-movflags', '+faststart', '-an', videoOutput,
])
const videoSize = (await readFile(videoOutput)).byteLength
if (videoSize > 5 * 1024 * 1024) throw new Error(`Campaign video exceeds 5 MiB: ${videoSize} bytes.`)
process.stdout.write(`${relative(root, videoOutput)}: 1280×720, 5s, ${videoSize} bytes\n`)
