import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { accessibleControlBorder, defaultAppearance, palettes, uiStyles } from './appearance-options'
import type { AppearanceChoice } from './appearance-options'

export function useStorefrontAppearance() {
  const [appearance, setAppearance] = useState<AppearanceChoice>(() => {
    try {
      const saved = JSON.parse(readBrowserStorage('fashion-store-appearance') ?? 'null') as Partial<AppearanceChoice> | null
      const hadGlassDefault = saved?.styleId === 'S04' && saved?.paletteId === 'P12'
      return {
        styleId: hadGlassDefault ? defaultAppearance.styleId : uiStyles.some((item) => item.id === saved?.styleId) ? saved!.styleId! : defaultAppearance.styleId,
        paletteId: hadGlassDefault ? defaultAppearance.paletteId : palettes.some((item) => item.id === saved?.paletteId) ? saved!.paletteId! : defaultAppearance.paletteId,
        mode: saved?.mode === 'dark' || saved?.mode === 'light' || saved?.mode === 'system' ? saved.mode : defaultAppearance.mode,
      }
    } catch {
      return defaultAppearance
    }
  })
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const closeAppearancePicker = useCallback(() => setAppearanceOpen(false), [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateMode = (event: MediaQueryListEvent) => setSystemMode(event.matches ? 'dark' : 'light')
    media.addEventListener('change', updateMode)
    return () => media.removeEventListener('change', updateMode)
  }, [])

  useEffect(() => {
    writeBrowserStorage('fashion-store-appearance', JSON.stringify(appearance))
  }, [appearance])

  const activePalette = palettes.find((item) => item.id === appearance.paletteId) ?? palettes.find((item) => item.id === defaultAppearance.paletteId) ?? palettes[0]
  const activeStyle = uiStyles.find((item) => item.id === appearance.styleId) ?? uiStyles[12]
  const resolvedMode = appearance.mode === 'system' ? systemMode : appearance.mode
  const paletteTokens = activePalette[resolvedMode]
  const controlBorder = accessibleControlBorder(paletteTokens)
  const appearanceTokens = {
    '--ink': paletteTokens.text,
    '--line': paletteTokens.border,
    '--paper': paletteTokens.surface,
    '--wine': paletteTokens.primary,
    '--ui-bg': paletteTokens.bg,
    '--ui-surface': paletteTokens.surface,
    '--ui-border': paletteTokens.border,
    '--ui-control-border': controlBorder,
    '--ui-text': paletteTokens.text,
    '--ui-muted': paletteTokens.muted,
    '--ui-primary': paletteTokens.primary,
    '--ui-primary-hover': paletteTokens.hover,
    '--ui-on-primary': paletteTokens.onPrimary,
    '--ui-accent': paletteTokens.accent,
    '--ui-radius': activeStyle.radius,
    '--ui-shadow': activeStyle.shadow,
    '--ui-border-width': activeStyle.borderWidth,
    '--ui-font-heading': activeStyle.headingFont,
    '--background': appearance.paletteId === 'P12' && resolvedMode === 'light' ? '#E0E7FF' : paletteTokens.bg,
    '--foreground': paletteTokens.text,
    '--card': paletteTokens.surface,
    '--card-foreground': paletteTokens.text,
    '--popover': paletteTokens.surface,
    '--popover-foreground': paletteTokens.text,
    '--primary': paletteTokens.primary,
    '--primary-foreground': paletteTokens.onPrimary,
    '--secondary': paletteTokens.surface,
    '--secondary-foreground': paletteTokens.text,
    '--muted': paletteTokens.muted,
    '--muted-foreground': paletteTokens.muted,
    '--accent': paletteTokens.accent,
    '--accent-foreground': paletteTokens.text,
    '--border': paletteTokens.border,
    '--input': controlBorder,
    '--ring': paletteTokens.primary,
    '--color-success': resolvedMode === 'dark' ? '#4ADE80' : '#15803D',
    '--color-warning': resolvedMode === 'dark' ? '#FBBF24' : '#B45309',
    '--color-error': resolvedMode === 'dark' ? '#F87171' : '#B91C1C',
    '--color-info': resolvedMode === 'dark' ? '#38BDF8' : '#0369A1',
  } as CSSProperties

  return { appearance, resolvedMode, setAppearance, appearanceOpen, setAppearanceOpen, closeAppearancePicker, appearanceTokens, themeColor: paletteTokens.bg }
}
