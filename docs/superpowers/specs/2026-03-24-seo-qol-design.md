# SEO, Landing Page & Quality of Life Design

## Overview

Rebrand the site as "ToolBox by Kutu Yazılım", redesign the landing page for discoverability, add SEO infrastructure, and implement quality-of-life features (command palette, favorites, theme toggle).

**Goals:**
1. Make every tool discoverable by search engines
2. Make the landing page a fast path to any of the 83+ tools
3. Make navigating between tools effortless (Cmd+K, favorites, recents)

---

## Part 1: SEO Infrastructure

### Per-tool page titles and meta
- Each tool page sets `<title>`: "{Tool Name} - ToolBox by Kutu Yazılım"
- Each tool page sets `<meta name="description">`: tool description from registry
- Default title (landing): "ToolBox by Kutu Yazılım — 83+ Free Online Tools"
- Default description: "Free online developer and creative tools. JSON formatter, UUID generator, image converter, and more. No sign-ups, runs in your browser."

Implementation: Use `react-helmet-async` or a simple `useEffect` that sets `document.title` and updates meta tags. Since this is a Vite SPA with React Router, use a route-aware hook.

### OpenGraph tags
- `og:title`: same as page title
- `og:description`: same as meta description
- `og:type`: "website"
- `og:url`: `https://toolbox.kutuyazilim.org/{path}`
- `og:image`: static OG image at `/og-image.png` (1200x630, dark bg with logo + "ToolBox by Kutu Yazılım" + "83+ Free Online Tools")
- `twitter:card`: "summary_large_image"

Implementation: Same hook that sets title also sets OG meta tags.

### robots.txt
```
User-agent: *
Allow: /
Sitemap: https://toolbox.kutuyazilim.org/sitemap.xml
```
Place in `public/robots.txt`.

### sitemap.xml
Generate from tool registry at build time. A Vite plugin or a simple build script that:
1. Imports tool registry
2. Generates XML with all tool URLs + landing page
3. Writes to `dist/sitemap.xml`

Simpler approach: static `public/sitemap.xml` manually listing all paths. Update when tools change.

Even simpler: generate at build time with a small script in `package.json`.

### Structured data (JSON-LD)
Add to index.html `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ToolBox by Kutu Yazılım",
  "url": "https://toolbox.kutuyazilim.org",
  "description": "83+ free online tools for developers and creatives",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0" }
}
```

---

## Part 2: Landing Page Redesign

### Hero section
- Company logo (LogoOnlyCircularSVG.svg, ~64px)
- "ToolBox" title (large, bold)
- Tagline: "83+ free tools. Zero sign-ups. Runs in your browser."
- Search input prominently centered below tagline (same search that powers the tool grid)
- Clean, minimal — no marketing fluff

### Tool grid
- Grid of tool cards below the hero
- Each card: tool icon (Lucide), tool name, one-line description
- Hover: subtle lift/border highlight
- Click: navigates to the tool
- Category filter tabs above grid: All, Dev Tools, Converters, Generators, Design, Network, PDF, Fun, Data Tools, Security, Image Tools
- "All" selected by default
- Search input filters by tool name + description (case-insensitive substring match)
- Show tool count per category in the tab (e.g., "Dev Tools (15)")
- Responsive: 4 columns on desktop, 2 on tablet, 1 on mobile

### Footer
- "ToolBox by Kutu Yazılım" text, small and subtle
- No other links needed

---

## Part 3: Command Palette (Cmd+K / Ctrl+K)

### Trigger
- Cmd+K (Mac) / Ctrl+K (Windows/Linux) — global keyboard shortcut
- Also accessible via a search icon in the sidebar header

### Modal
- Centered overlay modal with backdrop blur
- Search input at top, auto-focused
- Results list below

### Search
- Fuzzy match on tool name + description (simple: check if query words are all contained in name+description, case-insensitive)
- Show: tool icon, tool name, category badge, description truncated
- Max 10 results shown
- Keyboard navigation: Up/Down arrows to highlight, Enter to navigate, Escape to close

### Empty state (no query)
- Show recent tools (last 5 used, stored in localStorage key "recent-tools")
- Section header: "Recent"

### Navigation
- Selecting a result navigates to the tool via React Router
- Modal closes on navigation
- Modal closes on Escape or click outside

---

## Part 4: Favorites

### Star toggle
- Star icon (outline/filled) on each tool card in the landing page grid
- Star icon in the sidebar next to each tool name (visible on hover, always visible if favorited)
- Click toggles favorite status
- Stored in localStorage key "favorite-tools" as array of tool IDs

### Sidebar favorites section
- If any favorites exist, show a "Favorites" collapsible section at the top of the sidebar (above the first category)
- Lists favorited tools with their icons
- Collapsible (stored in localStorage alongside other sidebar category states)

### Landing page favorites
- "Favorites" tab in the category filter (only shown if favorites exist)
- Shows only favorited tools

---

## Part 5: Theme Toggle

### Placement
- Sun/Moon icon button in the sidebar, near the top (next to the collapse button or in the sidebar header)
- Uses existing `useTheme` hook from `src/hooks/useTheme.ts`

### Behavior
- Click toggles between dark and light mode
- Smooth transition (CSS transition on background-color)
- Icon: SunIcon for light mode (click to go dark), MoonIcon for dark mode (click to go light)

---

## Files Affected

| File | Changes |
|------|---------|
| `public/robots.txt` | Create |
| `public/sitemap.xml` | Create (or build script) |
| `index.html` | Add JSON-LD structured data, default OG tags |
| `src/components/welcome/WelcomePage.tsx` | Full rewrite — hero + tool grid |
| `src/components/layout/AppSidebar.tsx` | Add favorites section, theme toggle, Cmd+K trigger, star icons |
| `src/components/common/CommandPalette.tsx` | Create — modal with search |
| `src/App.tsx` or `src/layouts/RootLayout.tsx` | Mount CommandPalette, add global Cmd+K listener |
| `src/hooks/usePageMeta.ts` | Create — hook for setting title + meta tags per route |
| `src/hooks/useFavorites.ts` | Create — localStorage-backed favorites |
| `src/hooks/useRecentTools.ts` | Create — localStorage-backed recent tools |
| `src/config/toolRegistry.ts` | No changes — existing data is sufficient |

## Dependencies

- No new npm dependencies. All features use browser APIs (localStorage, document.title, meta tags).
- Consider `react-helmet-async` for cleaner meta tag management, but a simple useEffect hook is sufficient for an SPA.
