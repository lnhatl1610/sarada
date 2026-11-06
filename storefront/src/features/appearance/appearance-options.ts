export type ThemeMode = 'system' | 'light' | 'dark'
export type AppearanceChoice = { styleId: string; paletteId: string; mode: ThemeMode }

export type Palette = {
  id: string
  name: string
  mood: string
  light: { bg: string; surface: string; border: string; text: string; muted: string; primary: string; hover: string; onPrimary: string; accent: string }
  dark: { bg: string; surface: string; border: string; text: string; muted: string; primary: string; hover: string; onPrimary: string; accent: string }
}

export type UiStyle = { id: string; name: string; description: string; radius: string; shadow: string; borderWidth: string; headingFont: string }

export const uiStyles: UiStyle[] = [
  { id: 'S01', name: 'Minimalism', description: 'Thoáng, ít màu, typography làm trọng tâm.', radius: '12px', shadow: 'none', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S02', name: 'Flat Design', description: 'Màu phẳng, khối rõ, ít hiệu ứng.', radius: '10px', shadow: 'none', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S03', name: 'Material Design 3', description: 'Surface theo cấp độ, bo tròn và có chiều sâu.', radius: '18px', shadow: '0 4px 18px rgba(15, 23, 42, .12)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S04', name: 'Glassmorphism', description: 'Bề mặt kính mờ, viền sáng và nền nhiều lớp.', radius: '20px', shadow: '0 12px 32px rgba(15, 23, 42, .14)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S05', name: 'Neumorphism', description: 'Bề mặt mềm cùng tông, có viền rõ cho control.', radius: '18px', shadow: '6px 6px 14px color-mix(in srgb, var(--ui-text) 12%, transparent), -6px -6px 14px color-mix(in srgb, var(--ui-surface) 88%, white)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S06', name: 'Claymorphism', description: 'Khối mềm, bo tròn và bóng nhẹ.', radius: '24px', shadow: 'inset 0 -4px 8px rgba(0, 0, 0, .07), 0 10px 22px rgba(0, 0, 0, .12)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S07', name: 'Skeuomorphism', description: 'Gợi chất liệu giấy và bề mặt thủ công.', radius: '5px', shadow: 'inset 0 1px 0 rgba(255, 255, 255, .65), 0 3px 8px rgba(0, 0, 0, .14)', borderWidth: '1px', headingFont: 'Georgia, serif' },
  { id: 'S08', name: 'Neo-Brutalism', description: 'Viền đậm, bóng cứng và màu nhấn nổi bật.', radius: '3px', shadow: '4px 4px 0 var(--ui-text)', borderWidth: '3px', headingFont: 'system-ui, sans-serif' },
  { id: 'S09', name: 'Dark UI', description: 'Bố cục dịu mắt, hỗ trợ chuyển sáng/tối.', radius: '10px', shadow: '0 5px 18px rgba(0, 0, 0, .22)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S10', name: 'Bento Grid', description: 'Thẻ theo cụm, góc bo lớn và khoảng cách thoáng.', radius: '20px', shadow: '0 3px 14px rgba(0, 0, 0, .08)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S11', name: 'Aurora / Mesh', description: 'Ánh màu loang nhẹ, dùng tiết chế ở vùng nền.', radius: '18px', shadow: '0 8px 28px color-mix(in srgb, var(--ui-primary) 18%, transparent)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S12', name: 'Swiss Typography', description: 'Lưới gọn, canh lề rõ, tương phản mạnh.', radius: '2px', shadow: 'none', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S13', name: 'Editorial / Magazine', description: 'Tiêu đề serif, ảnh lớn và chất tạp chí.', radius: '2px', shadow: 'none', borderWidth: '1px', headingFont: 'Georgia, serif' },
  { id: 'S14', name: 'Corporate / Enterprise', description: 'Bố cục rõ, viền nhẹ và dữ liệu dễ quét.', radius: '5px', shadow: '0 2px 8px rgba(15, 23, 42, .08)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
  { id: 'S15', name: 'Organic / Soft Shapes', description: 'Đường cong tự nhiên, màu đất và bề mặt ấm.', radius: '26px', shadow: '0 9px 24px rgba(52, 42, 28, .11)', borderWidth: '1px', headingFont: 'Georgia, serif' },
  { id: 'S16', name: 'Retro / Y2K', description: 'Viền nổi kiểu cổ điển, màu sáng và tương phản.', radius: '2px', shadow: 'inset 2px 2px rgba(255,255,255,.7), 3px 3px 0 var(--ui-border)', borderWidth: '2px', headingFont: 'system-ui, sans-serif' },
  { id: 'S17', name: 'Cyberpunk / Neon', description: 'Nền tối, nhấn neon có kiểm soát.', radius: '2px', shadow: '0 0 12px color-mix(in srgb, var(--ui-primary) 36%, transparent)', borderWidth: '1px', headingFont: 'system-ui, sans-serif' },
]

export const palettes: Palette[] = [
  { id: 'P01', name: 'Trust Blue', mood: 'Tin cậy, công nghệ', light: { bg: '#FFFFFF', surface: '#F8FAFC', border: '#E2E8F0', text: '#0F172A', muted: '#475569', primary: '#2563EB', hover: '#1D4ED8', onPrimary: '#FFFFFF', accent: '#F59E0B' }, dark: { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', hover: '#93C5FD', onPrimary: '#0F172A', accent: '#FBBF24' } },
  { id: 'P02', name: 'Forest Natural', mood: 'Tự nhiên, bền vững', light: { bg: '#FAFAF5', surface: '#F1F3EA', border: '#D9DDCB', text: '#1B2A21', muted: '#55645A', primary: '#2F6B4F', hover: '#245540', onPrimary: '#FFFFFF', accent: '#B7791F' }, dark: { bg: '#14201A', surface: '#1E2D25', border: '#2F4237', text: '#EAF0E6', muted: '#A3B3A8', primary: '#6FCF97', hover: '#9BE0B8', onPrimary: '#0E1A13', accent: '#E0A458' } },
  { id: 'P03', name: 'Sunset Warm', mood: 'Năng lượng, bán lẻ', light: { bg: '#FFFBF7', surface: '#FFF1E6', border: '#F2D9C4', text: '#2B1A12', muted: '#6B4F40', primary: '#C2410C', hover: '#9A3412', onPrimary: '#FFFFFF', accent: '#0F766E' }, dark: { bg: '#1C1411', surface: '#2A1D18', border: '#4A3329', text: '#FBEDE3', muted: '#C9A998', primary: '#FB923C', hover: '#FDBA74', onPrimary: '#1C1411', accent: '#2DD4BF' } },
  { id: 'P04', name: 'Royal Violet', mood: 'Sáng tạo, cao cấp', light: { bg: '#FDFCFF', surface: '#F4F1FB', border: '#E2DCF2', text: '#1A1530', muted: '#5B5478', primary: '#6D28D9', hover: '#5B21B6', onPrimary: '#FFFFFF', accent: '#DB2777' }, dark: { bg: '#120E1F', surface: '#1D1733', border: '#352B58', text: '#F0ECFA', muted: '#B0A8D0', primary: '#A78BFA', hover: '#C4B5FD', onPrimary: '#120E1F', accent: '#F472B6' } },
  { id: 'P05', name: 'Ocean Teal', mood: 'Sạch sẽ, chăm sóc', light: { bg: '#F7FDFD', surface: '#E8F6F6', border: '#C5E3E4', text: '#0B2A2D', muted: '#476669', primary: '#0F766E', hover: '#115E59', onPrimary: '#FFFFFF', accent: '#EA580C' }, dark: { bg: '#0B1A1C', surface: '#12292C', border: '#21474B', text: '#E6F6F6', muted: '#9CC3C6', primary: '#2DD4BF', hover: '#5EEAD4', onPrimary: '#0B1A1C', accent: '#FB923C' } },
  { id: 'P06', name: 'Mono Graphite', mood: 'Tối giản, biên tập', light: { bg: '#FFFFFF', surface: '#F5F5F5', border: '#E5E5E5', text: '#0A0A0A', muted: '#525252', primary: '#171717', hover: '#404040', onPrimary: '#FFFFFF', accent: '#DC2626' }, dark: { bg: '#0A0A0A', surface: '#171717', border: '#2E2E2E', text: '#FAFAFA', muted: '#A3A3A3', primary: '#FAFAFA', hover: '#D4D4D4', onPrimary: '#0A0A0A', accent: '#F87171' } },
  { id: 'P07', name: 'Cyber Dark', mood: 'Kỹ thuật, hiện đại', light: { bg: '#F6F8FB', surface: '#FFFFFF', border: '#D7DFEA', text: '#0B1120', muted: '#4B5A73', primary: '#0E7490', hover: '#155E75', onPrimary: '#FFFFFF', accent: '#7C3AED' }, dark: { bg: '#0B1120', surface: '#111A2E', border: '#22304D', text: '#E6EDF7', muted: '#93A4C3', primary: '#22D3EE', hover: '#67E8F9', onPrimary: '#0B1120', accent: '#A78BFA' } },
  { id: 'P08', name: 'Rose Soft', mood: 'Pastel, lifestyle', light: { bg: '#FFF8F9', surface: '#FFEDF0', border: '#F8D3DA', text: '#3A1822', muted: '#7A4A58', primary: '#BE185D', hover: '#9D174D', onPrimary: '#FFFFFF', accent: '#0D9488' }, dark: { bg: '#1F1216', surface: '#2D1A20', border: '#4F2D37', text: '#FCEAEE', muted: '#D8A9B6', primary: '#F472B6', hover: '#F9A8D4', onPrimary: '#1F1216', accent: '#5EEAD4' } },
  { id: 'P09', name: 'Sand & Clay', mood: 'Ấm, thủ công, boutique', light: { bg: '#FBF7F0', surface: '#F3EBDD', border: '#E3D6BF', text: '#2E2418', muted: '#6A5A45', primary: '#8C4A2F', hover: '#6F3A24', onPrimary: '#FFFFFF', accent: '#4D7C0F' }, dark: { bg: '#1B1612', surface: '#2A221B', border: '#4A3D2F', text: '#F3EADB', muted: '#BFAE94', primary: '#E3A584', hover: '#EFC1A6', onPrimary: '#1B1612', accent: '#A3E635' } },
  { id: 'P10', name: 'Indigo Finance', mood: 'Doanh nghiệp, ổn định', light: { bg: '#FFFFFF', surface: '#F3F5FD', border: '#DDE2F5', text: '#0C1024', muted: '#4A5280', primary: '#3730A3', hover: '#312E81', onPrimary: '#FFFFFF', accent: '#047857' }, dark: { bg: '#0C1024', surface: '#151B3B', border: '#2A3263', text: '#EEF0FF', muted: '#A6ADDB', primary: '#818CF8', hover: '#A5B4FC', onPrimary: '#0C1024', accent: '#34D399' } },
  { id: 'P11', name: 'Neumorphism Soft Gray', mood: 'Mềm, cùng tông', light: { bg: '#E6EBF2', surface: '#E6EBF2', border: '#C9D2E0', text: '#2D3748', muted: '#4A5568', primary: '#3B5BDB', hover: '#2F4AC0', onPrimary: '#FFFFFF', accent: '#C2410C' }, dark: { bg: '#22262E', surface: '#22262E', border: '#3A404C', text: '#E2E8F0', muted: '#A0AEC0', primary: '#8EA2FF', hover: '#B0BEFF', onPrimary: '#14161B', accent: '#FB923C' } },
  { id: 'P12', name: 'Glass Aurora', mood: 'Aurora, kính mờ', light: { bg: 'linear-gradient(130deg, #E0E7FF, #FCE7F3 55%, #FEF3C7)', surface: 'rgba(255,255,255,.78)', border: 'rgba(255,255,255,.88)', text: '#1E1B4B', muted: '#4C4A7A', primary: '#4F46E5', hover: '#4338CA', onPrimary: '#FFFFFF', accent: '#DB2777' }, dark: { bg: '#0B1020', surface: 'rgba(255,255,255,.08)', border: 'rgba(255,255,255,.18)', text: '#F8FAFC', muted: '#CBD5E1', primary: '#818CF8', hover: '#A5B4FC', onPrimary: '#0B1020', accent: '#F472B6' } },
  { id: 'P13', name: 'Neo-Brutal Pop', mood: 'Tươi, đậm, cá tính', light: { bg: '#FFF4D6', surface: '#FFFFFF', border: '#000000', text: '#000000', muted: '#333333', primary: '#B83A32', hover: '#96251D', onPrimary: '#FFFFFF', accent: '#4D96FF' }, dark: { bg: '#121212', surface: '#1E1E1E', border: '#FFFFFF', text: '#FFFFFF', muted: '#D0D0D0', primary: '#FF8A8A', hover: '#FF8A8A', onPrimary: '#000000', accent: '#7DB2FF' } },
  { id: 'P14', name: 'High Contrast Accessible', mood: 'Tương phản cao, dễ đọc', light: { bg: '#FFFFFF', surface: '#F2F2F2', border: '#1A1A1A', text: '#000000', muted: '#3D3D3D', primary: '#0033CC', hover: '#002299', onPrimary: '#FFFFFF', accent: '#8A2BE2' }, dark: { bg: '#000000', surface: '#121212', border: '#E5E5E5', text: '#FFFFFF', muted: '#CFCFCF', primary: '#7FA6FF', hover: '#A9C2FF', onPrimary: '#000000', accent: '#C792FF' } },
]

type Rgb = [number, number, number]
type Color = Rgb | [number, number, number, number]

function parseColor(value: string): Color | null {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1]
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex
    return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16)) as Rgb
  }
  const rgba = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i)
  return rgba ? [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), Number(rgba[4])] : null
}

function backgroundColors(value: string): Rgb[] {
  const gradientColors = [...value.matchAll(/#[\da-f]{3,6}\b/gi)].map((match) => parseColor(match[0])).filter((color): color is Rgb => color?.length === 3)
  if (gradientColors.length) return gradientColors
  const color = parseColor(value)
  return color ? [color.slice(0, 3) as Rgb] : []
}

function composite(color: Color, background: Rgb): Rgb {
  if (color.length === 3) return color
  const alpha = color[3]
  return color.slice(0, 3).map((channel, index) => Math.round(channel * alpha + background[index] * (1 - alpha))) as Rgb
}

function relativeLuminance([red, green, blue]: Rgb): number {
  const linear = [red, green, blue].map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05)
}

function toHex([red, green, blue]: Rgb): string {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

/** Produces an opaque input/control boundary color meeting WCAG 2.1 non-text contrast. */
export function accessibleControlBorder(palette: Palette['light']): string {
  const backgrounds = backgroundColors(palette.bg)
  const surface = parseColor(palette.surface)
  if (surface) backgrounds.push(...backgrounds.map((background) => composite(surface, background)))

  const border = parseColor(palette.border)
  const text = parseColor(palette.text)
  if (!border || !text || text.length !== 3 || backgrounds.length === 0) return palette.text

  const borderBase = border.length === 3 ? border : composite(border, backgrounds[0])
  for (let step = 0; step <= 100; step++) {
    const amount = step / 100
    const candidate = borderBase.map((channel, index) => Math.round(channel + (text[index] - channel) * amount)) as Rgb
    if (backgrounds.every((background) => contrastRatio(candidate, background) >= 3)) return toHex(candidate)
  }

  return palette.text
}

export const defaultAppearance = { styleId: 'S13', paletteId: 'P09', mode: 'system' as ThemeMode }
