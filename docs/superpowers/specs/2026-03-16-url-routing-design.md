# URL Routing & Sitemap Refactor

**Date:** 2026-03-16
**Scope:** Replace tabs-based SPA navigation with React Router v7 categorized URL routing

## Problem

The entire toolbox app is a single page with no URL routing. All 19 tools are accessed via a tabs system driven by `useState`. Users cannot:

- Deep link to a specific tool
- Share a URL to a specific tool or sub-feature
- Use browser back/forward navigation between tools
- Bookmark tools

## Goals

- Every tool accessible via a dedicated, human-readable URL
- Tools organized into semantic categories in the URL hierarchy
- Sub-features within tools have their own sub-URLs
- Lazy loading per tool so visiting `/` doesn't load all 19 tools
- Sidebar and mobile nav become URL-aware with active state from the router
- Category landing pages listing tools in each group

## Non-Goals

- Changing any tool's internal UI or logic (beyond removing tab state for tools with sub-routes)
- Server-side rendering
- Authentication or protected routes
- URL-based state persistence (query params for tool state)

## URL Tree

```
/                                    → Welcome/Home page

/dev-tools                           → Category landing page
  /json                              → JSON Formatter (redirects to /editor)
    /editor                          → Format/Minify/Validate
    /diff                            → Side-by-side diff
  /regex                             → Regex Playground
  /api                               → API Request Builder
  /jwt                               → JWT Tool (redirects to /decode)
    /decode                          → Decode JWT
    /forge                           → Forge JWT
  /markdown                          → Markdown Editor + Preview
  /db-model                          → DB Modelling (DBML + ER Diagram)
  /tree                              → Tree Generator

/converters                          → Category landing page
  /encoder                           → Encoder/Decoder (redirects to /base64)
    /base64                          → Base64 encode/decode
    /url                             → URL encode/decode
  /timestamp                         → Timestamp Converter
  /base64-to-file                    → Base64 to File converter

/generators                          → Category landing page
  /qr-code                           → QR Code Generator

/design                              → Category landing page
  /colors                            → Color Palette tool
  /board                             → Drawing Board
  /shapemaker                        → Shape Maker
  /mockup                            → Mockup Editor

/network                             → Category landing page
  /dns-lookup                        → DNS Lookup
  /whats-my-ip                       → What's My IP

/pdf                                 → PDF Tools Hub / Category landing
  /image-to-pdf                      → Image to PDF
  /merge                             → PDF Merge
  /split                             → PDF Split
  /reorder                           → PDF Reorder
  /compress                          → PDF Compress
  /watermark                         → PDF Watermark
  /docx-to-pdf                       → DOCX to PDF
  /pptx-to-pdf                       → PPTX to PDF
  /xlsx-to-pdf                       → XLSX to PDF
  /csv-to-pdf                        → CSV to PDF
  /html-to-pdf                       → HTML to PDF
  /markdown-to-pdf                   → Markdown to PDF

/fun                                 → Category landing page
  /wheel-of-fate                     → Wheel of Fate
  /coin-flip                         → Coin Flip

/*                                   → 404 Not Found page
```

## Routing Architecture

### Router Setup

React Router v7 with `createBrowserRouter` and `RouterProvider`. Route tree uses layout routes for shared UI.

```
RouterProvider
└── RootLayout (sidebar + mobile nav + theme provider)
    ├── "/" → WelcomePage
    ├── "/dev-tools" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   ├── "/json" → JsonLayout
    │   │   ├── index → redirect to /editor
    │   │   ├── "/editor" → lazy(JsonEditor)
    │   │   └── "/diff" → lazy(JsonDiff)
    │   ├── "/jwt" → JwtLayout
    │   │   ├── index → redirect to /decode
    │   │   ├── "/decode" → lazy(JwtDecode)
    │   │   └── "/forge" → lazy(JwtForge)
    │   ├── "/regex" → lazy(RegexPlayground)
    │   ├── "/api" → lazy(ApiRequestBuilder)
    │   ├── "/markdown" → lazy(MarkdownPreview)
    │   ├── "/db-model" → lazy(DbModelling)
    │   └── "/tree" → lazy(TreeCreator)
    ├── "/converters" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   ├── "/encoder" → EncoderLayout
    │   │   ├── index → redirect to /base64
    │   │   ├── "/base64" → lazy(Base64Encoder)
    │   │   └── "/url" → lazy(UrlEncoder)
    │   ├── "/timestamp" → lazy(TimestampConverter)
    │   └── "/base64-to-file" → lazy(Base64ToFile)
    ├── "/generators" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   └── "/qr-code" → lazy(QrGenerator)
    ├── "/design" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   ├── "/colors" → lazy(ColorPicker)
    │   ├── "/board" → lazy(BoardEditor)
    │   ├── "/shapemaker" → lazy(ShapeMaker)
    │   └── "/mockup" → lazy(MockupEditor)
    ├── "/network" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   ├── "/dns-lookup" → lazy(DnsLookup)
    │   └── "/whats-my-ip" → lazy(WhatsMyIp)
    ├── "/pdf" → CategoryLayout
    │   ├── index → CategoryLandingPage (PDF Tools Hub)
    │   ├── "/image-to-pdf" → lazy(ImageToPdf)
    │   ├── "/merge" → lazy(PdfMerge)
    │   ├── "/split" → lazy(PdfSplit)
    │   ├── "/reorder" → lazy(PdfReorder)
    │   ├── "/compress" → lazy(PdfCompress)
    │   ├── "/watermark" → lazy(PdfWatermark)
    │   ├── "/docx-to-pdf" → lazy(DocxToPdf)
    │   ├── "/pptx-to-pdf" → lazy(PptxToPdf)
    │   ├── "/xlsx-to-pdf" → lazy(XlsxToPdf)
    │   ├── "/csv-to-pdf" → lazy(CsvToPdf)
    │   ├── "/html-to-pdf" → lazy(HtmlToPdf)
    │   └── "/markdown-to-pdf" → lazy(MarkdownToPdf)
    ├── "/fun" → CategoryLayout
    │   ├── index → CategoryLandingPage
    │   ├── "/wheel-of-fate" → lazy(WheelOfFate)
    │   └── "/coin-flip" → lazy(CoinFlip)
    └── "*" → NotFoundPage
```

### Lazy Loading

Every tool component is wrapped with `React.lazy()` so only the active tool's bundle is loaded. A shared `Suspense` boundary in `RootLayout` shows a loading skeleton.

### 404 Handling

A catch-all `*` route renders a NotFound page with a link back to home and a search/suggestion for the closest matching tool.

## Sidebar & Navigation

### Sidebar Changes

- `NAV_ITEMS` flat array replaced by a nested structure grouped by category from the tool registry
- Each category is collapsible, expanded by default if it contains the active route
- Tool links use React Router's `<NavLink>` for automatic active class styling
- Category headers are clickable, navigating to the category landing page
- Collapse/expand state persisted in `localStorage`

### Mobile Nav

Same category grouping applied. Tools organized by category in the bottom sheet. Links use React Router's `<Link>`.

### Welcome Page

Tool grid cards become `<Link>` components instead of calling `onNavigate`. The `onNavigate` prop is removed entirely.

## Tool Registry

A centralized `toolRegistry.ts` replaces the current `NAV_ITEMS` array. It is the single source of truth consumed by:

- Sidebar navigation
- Mobile navigation
- Welcome page tool grid
- Category landing pages
- Breadcrumbs
- 404 page suggestions

Structure per tool entry:

```ts
{
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: CategoryId
  path: string           // full path e.g. "/dev-tools/json"
  subRoutes?: {
    path: string
    name: string
    defaultRoute?: boolean
  }[]
}
```

Categories defined as:

```ts
{
  id: CategoryId
  name: string
  path: string          // e.g. "/dev-tools"
  icon: LucideIcon
}
```

## Category Landing Pages

A reusable `CategoryLandingPage` component renders a grid of tool cards for the current category. It reads the category from the current URL and filters the tool registry.

The same `ToolGrid` component (extracted from current `WelcomePage`) powers both the home page (all tools) and category pages (filtered).

## Migration: What Changes Per Tool

### Simple tools (no internal sub-routes)

Tree, Regex, Markdown, Board, Colors, ShapeMaker, Mockup, QR, CoinFlip, WheelOfFate, Timestamp, Base64ToFile, ApiRequestBuilder, DbModelling.

**Change:** Remove from `Tabs` system, register as lazy route. No internal changes.

### Tools with sub-routes

**JsonFormatter:** Internal editor/diff mode state → two child route components (`JsonEditor`, `JsonDiff`) sharing a `JsonLayout` with tab navigation via `<NavLink>`.

**JwtTool:** Decode/forge tabs → two child route components (`JwtDecode`, `JwtForge`) sharing a `JwtLayout`.

**EncoderDecoder:** Base64/URL tabs → two child route components (`Base64Encoder`, `UrlEncoder`) sharing an `EncoderLayout`. JWT tab removed (dedicated tool exists at `/dev-tools/jwt`).

**DnsIpTool:** DNS/IP tabs → two separate route components (`DnsLookup`, `WhatsMyIp`) as sibling routes under `/network`.

**PdfTools:** Mode selector → each of the 12 PDF tools becomes its own route component under `/pdf`. The hub/selector becomes the category landing page.

## Files to Create

| File | Purpose |
|------|---------|
| `src/router.tsx` | Route definitions with lazy imports |
| `src/config/toolRegistry.ts` | Centralized tool metadata |
| `src/layouts/RootLayout.tsx` | Sidebar + Outlet + Suspense |
| `src/layouts/CategoryLayout.tsx` | Optional category wrapper with Outlet |
| `src/components/common/CategoryLandingPage.tsx` | Reusable category tool grid |
| `src/components/common/NotFoundPage.tsx` | 404 page |
| Sub-route components for JSON, JWT, Encoder, DNS/IP, PDF | Split from parent components |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Strip down to `RouterProvider` only |
| `src/components/layout/AppSidebar.tsx` | Category groups + `NavLink` |
| `src/components/layout/MobileNav.tsx` | Category groups + `Link` |
| `src/components/welcome/WelcomePage.tsx` | `Link` instead of `onNavigate` prop |
| `src/components/json/JsonFormatter.tsx` | Split into editor/diff child components |
| `src/components/jwt/JwtTool.tsx` | Split into decode/forge child components |
| `src/components/encoder/EncoderDecoder.tsx` | Split into base64/url child components, remove JWT tab |
| `src/components/dnsip/DnsIpTool.tsx` | Split into dns-lookup/whats-my-ip components |
| `src/components/pdf/PdfTools.tsx` | Split each PDF tool into its own route component |

## Dependencies

Add: `react-router` (v7)

No other new dependencies.

## Vite Configuration

Add `historyApiFallback` for dev server (Vite handles this by default). For production deployment, the hosting provider must be configured to serve `index.html` for all routes (SPA fallback).
