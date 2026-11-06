# Storefront Appearance Picker

## Customer controls

- The storefront header exposes a keyboard-accessible appearance picker.
- Customers can choose any of the 17 UI styles and 14 palettes documented in `PLAN-ui-style-color-catalog.md`, plus system, light, or dark mode. System mode follows the operating system's current color-scheme preference and updates while the page is open.
- The selector includes a live sample, short descriptions, color swatches, reset-to-default, close, and Escape behavior.
- Choices are saved in browser local storage for that device and browser. They do not change the store-wide default or another customer's settings.

## Applied tokens and style treatments

- Palette roles map to CSS custom properties for background, surface, border, text, muted text, primary, hover, on-primary, and accent. Shared shadcn tokens receive matching values.
- Style choices set radius, shadow, border width, and heading font. Supported style treatments include glass surfaces with reduced-transparency fallback, hard-edged brutalist controls, serif editorial headings, and rounded clay/organic cards.
- Product imagery remains unchanged when users change palettes. Semantic status colors remain consistent across palettes and modes.
- Preserve keyboard focus visibility and Vietnamese glyph support. Color is not the only indicator for selection; selected palette buttons expose `aria-pressed` and a check mark.

## Acceptance criteria

- [x] Style, palette, and mode update the storefront immediately and persist across reloads.
- [x] System mode follows `prefers-color-scheme` and updates when the operating-system preference changes; explicit light/dark choices remain fixed.
- [x] Unknown or invalid stored choices fall back to the NÉT default: Editorial / Magazine, Sand & Clay, system mode.
- [x] Picker provides responsive layout, preview, accessible labels, and keyboard dismissal.
- [ ] Verify WCAG contrast and screenshots at 375px, 768px, and 1440px for every supported palette/style pair before a production-wide restyle.
