import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const node = process.execPath
const steps = [
  ['Render photo covers, banners, and campaign video', 'render-storefront-photo-media.mjs'],
  ['Render social sharing image', 'render-storefront-og.mjs'],
]

for (const [label, script] of steps) {
  process.stdout.write(`\n== ${label} ==\n`)
  await new Promise((resolvePromise, reject) => {
    const child = spawn(node, [`tools/assets/${script}`], {
      cwd: root,
      stdio: 'inherit',
      windowsHide: true,
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${script} exited with code ${code ?? 'unknown'}`))
    })
  })
}

process.stdout.write('\nStorefront demo graphics are ready.\n')
