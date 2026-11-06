# Design Tokens

Use CSS custom properties so both apps can implement the same visual language while retaining separate bundles.

```css
:root {
  --background: #ffffff;
  --surface: #ffffff;
  --foreground: #171717;
  --muted: #737373;
  --border: #e5e5e5;
  --accent: #262626;
  --accent-foreground: #ffffff;
  --success: #28734b;
  --warning: #9a6415;
  --danger: #b42318;
  --radius-card: .25rem;
  --radius-control: .2rem;
  --shadow-card: none;
}
```

Typography: DM Sans with a system sans-serif fallback for both headings and body. Use restrained sizes and weights, concise labels, fine dividers, flat surfaces, and a 4px spacing rhythm. Both apps use a minimal neutral palette; product photography supplies most of the visual color. Verify token contrast before changing colors.

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
