import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../storefront/src/features/appearance/appearance-options.ts', import.meta.url), 'utf8')
const authCss = await readFile(new URL('../../storefront/src/features/auth/StorefrontAuthLayout.css', import.meta.url), 'utf8')
const paletteLines = source.matchAll(/^\s*\{ id: '(P\d+)', name: '([^']+)', mood: '[^']*', light: \{([^}]*)\}, dark: \{([^}]*)\} \},?$/gm)

function field(mode, name) {
  return mode.match(new RegExp(`(?:^|,)\\s*${name}: '([^']+)'`))?.[1]
}

function parseColor(value) {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1]
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex
    return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16))
  }
  const rgba = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i)
  return rgba ? [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), Number(rgba[4])] : null
}

function backgroundSamples(value) {
  const gradientColors = [...value.matchAll(/#[\da-f]{3,6}\b/gi)].map((match) => parseColor(match[0])).filter(Boolean)
  if (gradientColors.length) return gradientColors
  const color = parseColor(value)
  return color ? [color] : []
}

function composite(foreground, background) {
  if (foreground.length === 3) return foreground
  const alpha = foreground[3]
  return foreground.slice(0, 3).map((channel, index) => Math.round(channel * alpha + background[index] * (1 - alpha)))
}

function luminance([red, green, blue]) {
  const channels = [red, green, blue].map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function ratio(foreground, background) {
  const left = luminance(foreground)
  const right = luminance(background)
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05)
}

function accessibleBorder(mode, backgrounds, surfaces) {
  const border = parseColor(field(mode, 'border') ?? '')
  const text = parseColor(field(mode, 'text') ?? '')
  if (!border || !text || text.length !== 3 || backgrounds.length === 0) return null
  const base = border.length === 3 ? border : composite(border, backgrounds[0])
  for (let step = 0; step <= 100; step++) {
    const amount = step / 100
    const candidate = base.map((channel, index) => Math.round(channel + (text[index] - channel) * amount))
    if ([...backgrounds, ...surfaces].every((background) => ratio(candidate, background) >= 3)) return candidate
  }
  return text
}

const failures = []
let paletteCount = 0
for (const [, id, name, light, dark] of paletteLines) {
  paletteCount++
  for (const [modeName, mode] of [['light', light], ['dark', dark]]) {
    const bg = backgroundSamples(field(mode, 'bg') ?? '')
    const surface = parseColor(field(mode, 'surface') ?? '')
    const text = parseColor(field(mode, 'text') ?? '')
    const muted = parseColor(field(mode, 'muted') ?? '')
    const primary = parseColor(field(mode, 'primary') ?? '')
    const hover = parseColor(field(mode, 'hover') ?? '')
    const onPrimary = parseColor(field(mode, 'onPrimary') ?? '')
    const surfaces = [...bg, ...(surface ? bg.map((background) => composite(surface, background)) : [])]
    const checks = [
      ['text', text, surfaces],
      ['muted', muted, surfaces],
      ['primary link', primary, surfaces],
      ['hover link', hover, surfaces],
      ['button text', onPrimary, [primary, hover].filter(Boolean)],
      ['control boundary', accessibleBorder(mode, bg, surfaces), surfaces, 3],
    ]
    for (const [label, foreground, backgrounds, minimum = 4.5] of checks) {
      if (!foreground || backgrounds.length === 0) {
        failures.push(`${id} ${modeName} ${label}: unable to resolve colors`)
        continue
      }
      const weakest = Math.min(...backgrounds.map((background) => ratio(foreground, background)))
      if (weakest < minimum) failures.push(`${id} ${name} ${modeName} ${label}: ${weakest.toFixed(2)}:1 (minimum ${minimum}:1)`)
    }
  }
}

const authPanelRule = authCss.match(/\.storefront-auth-brand-panel\s*\{([^}]*)\}/)?.[1] ?? ''
const authPanelBackground = authPanelRule.match(/background:\s*([^;]+);/)?.[1] ?? ''
const authPanelSamples = [...authPanelBackground.matchAll(/#[\da-f]{6}\b/gi)]
  .map((match) => parseColor(match[0]))
  .filter(Boolean)
const authPanelText = parseColor(authCss.match(/\.storefront-auth-panel-topline,\s*\.storefront-auth-panel-bottom\s*\{[^}]*color:\s*(#[\da-f]{3}|#[\da-f]{6})/i)?.[1] ?? '')
const authPanelAccent = parseColor(authCss.match(/\.storefront-auth-panel-topline > span:first-child span\s*\{[^}]*color:\s*(#[\da-f]{6})/i)?.[1] ?? '')

if (!authPanelSamples.length || !authPanelText || !authPanelAccent) {
  failures.push('Authentication brand panel: unable to resolve text or gradient colors')
} else {
  // The diagonal white pattern is rendered at 19% opacity over 13% white, so
  // checking a 2.5% white overlay is a conservative estimate of its brightest pixel.
  const panelBackgrounds = authPanelSamples.flatMap((background) => [
    background,
    composite([255, 255, 255, 0.025], background),
  ])
  for (const [label, foreground] of [['brand panel text', authPanelText], ['brand logo accent', authPanelAccent]]) {
    const weakest = Math.min(...panelBackgrounds.map((background) => ratio(foreground, background)))
    if (weakest < 4.5) failures.push(`Authentication ${label}: ${weakest.toFixed(2)}:1 (minimum 4.5:1)`)
    else console.log(`Authentication ${label} minimum contrast: ${weakest.toFixed(2)}:1.`)
  }
}

console.log(`Audited ${paletteCount} palettes in light and dark mode for text/link contrast (4.5:1) and the computed control-boundary color (3:1).`)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('All text/link pairs meet 4.5:1, and computed control boundaries meet 3:1.')
}
