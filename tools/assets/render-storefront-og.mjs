import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const source = join(root, 'storefront/public/og-image.svg')
const destination = join(root, 'storefront/public/og-image.jpg')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'msedge',
  'google-chrome',
  'chromium',
].filter(Boolean)
const ffmpegCandidates = [
  process.env.FFMPEG_PATH,
  'C:/ffmpeg/bin/ffmpeg.exe',
  'ffmpeg',
].filter(Boolean)

function run(command, args, stdio = 'inherit') {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio, windowsHide: true })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with code ${code}`)))
  })
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await run(candidate, ['--version'], 'ignore')
      return candidate
    } catch {}
  }

  throw new Error('Chromium/Edge not found. Set CHROME_PATH to its executable.')
}

async function findFfmpeg() {
  for (const candidate of ffmpegCandidates) {
    try {
      await run(candidate, ['-version'], 'ignore')
      return candidate
    } catch {}
  }

  throw new Error('FFmpeg not found. Set FFMPEG_PATH to its executable.')
}

await (async () => {
  const chrome = await findChrome()
  const ffmpeg = await findFfmpeg()
  const temp = await mkdtemp(join(tmpdir(), 'fashion-og-'))
  const html = join(temp, 'render.html')
  const pngScreenshot = join(temp, 'source.png')
  const sourceUrl = pathToFileURL(source).href

  try {
    await writeFile(html, `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}img{display:block;width:1200px;height:630px;object-fit:contain}</style><img src="${sourceUrl}" alt="">`)
    await run(chrome, [
      '--headless', '--disable-gpu', '--hide-scrollbars', '--no-sandbox', '--no-first-run',
      '--no-default-browser-check', '--allow-file-access-from-files', '--force-device-scale-factor=1',
      `--user-data-dir=${join(temp, 'profile')}`, '--virtual-time-budget=1000', '--window-size=1200,630',
      `--screenshot=${pngScreenshot}`, pathToFileURL(html).href,
    ])

    const png = await readFile(pngScreenshot)
    if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Social preview renderer did not produce a PNG file.')
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    if (width !== 1200 || height !== 630) throw new Error(`Social preview must be 1200×630; got ${width}×${height}.`)

    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', pngScreenshot, '-frames:v', '1', '-q:v', '3', destination])
    const jpg = await readFile(destination)
    if (jpg[0] !== 0xff || jpg[1] !== 0xd8 || jpg.at(-2) !== 0xff || jpg.at(-1) !== 0xd9) {
      throw new Error('Social preview renderer did not produce a JPEG file.')
    }
    if (jpg.byteLength >= 150 * 1024) {
      throw new Error(`Social preview JPEG must be under 150 KiB; got ${jpg.byteLength} bytes.`)
    }

    process.stdout.write(`storefront/public/og-image.jpg: ${width}×${height}, ${jpg.byteLength} bytes\n`)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})()
