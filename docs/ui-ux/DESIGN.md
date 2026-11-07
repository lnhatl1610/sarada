# Design Tokens

Admin and Storefront keep separate semantic tokens and themes. Use the values below for the Storefront; its source of truth is `storefront/src/index.css`. Do not copy palette values from `plan1.md` into the running interface.

```css
:root {
  --radius: .65rem;
  --background: #f9f8f5;
  --foreground: #252522;
  --card: #ffffff;
  --card-foreground: #252522;
  --popover: #ffffff;
  --popover-foreground: #252522;
  --primary: #7f2638;
  --primary-foreground: #ffffff;
  --secondary: #eeeae5;
  --secondary-foreground: #252522;
  --muted: #efede8;
  --muted-foreground: #716e68;
  --accent: #f1e8e9;
  --accent-foreground: #682031;
  --destructive: #b42318;
  --border: #e5e0da;
  --input: #e5e0da;
  --ring: #7f2638;
}
```

Storefront uses a warm off-white canvas, charcoal text, burgundy primary actions, white surfaces, and quiet warm borders. Its single self-hosted typeface is Inter Variable, defined in `storefront/src/index.css`; headings use size, weight, and spacing for hierarchy rather than a separate display face. Code and code-like values may use a monospace face. Keep Admin's configurable monochrome/accent theme independent. Verify token contrast before changing colors.

The customer appearance picker defaults to the `Sarada Editorial` palette (`P15`) in `storefront/src/features/appearance/appearance-options.ts`; its light-mode values match the tokens above. Retired stored palette IDs fall back to this default.

`storefront/src/StorefrontEditorial.css` maps its light-mode defaults to this same palette; its dark-mode values and semantic success, warning, and error colors remain mode/status-specific.

## Admin theme

Admin uses comfortable density by default, 3px control radius, 4px card radius, a 260px expanded sidebar (72px when collapsed), and a 1440px content maximum. The sidebar follows the selected theme in monochrome: white background with dark text in light mode, charcoal background with light text in dark mode. The active item uses a subtle neutral surface; the selected accent remains available for primary actions and statuses.

The admin shell uses scoped CSS variables so feature styles can share semantic values without changing the storefront theme:

| Token | Light | Dark |
|---|---|---|
| Background | `#FAFAFA` | `#111111` |
| Surface | `#FFFFFF` | `#171717` |
| Foreground | `#171717` | `#F5F5F5` |
| Muted foreground | `#737373` | `#A3A3A3` |
| Control border | `#D4D4D4` | `#525252` |
| Decorative border | `#E5E5E5` | `#303030` |
| Primary | `#262626` | `#F5F5F5` |
| Sidebar | `#FFFFFF` | `#171717` |
| Sidebar text | `#262626` | `#F5F5F5` |
| Sidebar active item | `#F0F0F0` background, `#171717` text | `#303030` background, `#FFFFFF` text |

The theme toggle is available in the admin topbar. On first use, the shell follows `prefers-color-scheme`; a manual choice is saved in local storage. Storefront appearance remains independent. At tablet widths, the sidebar becomes a drawer; at desktop widths, it can collapse and remembers that preference.

Admin exposes light, dark, and system-following modes, plus six accent colors through the account appearance page. These settings are independent of storefront appearance.
