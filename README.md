# ToolBox by Kutu Yazılım

**84 free online developer and creative tools — no sign-ups, no uploads for most tools, everything runs in your browser.**

🔗 **Live:** [toolbox.kutuyazilim.org](https://toolbox.kutuyazilim.org)

A Next.js 16 App Router application that ships 84 self-contained utilities — JSON formatting, regex testing, PDF manipulation, image editing, QR generation, DNS lookups, and more — as 192 statically prerendered pages. Each tool is a lazily loaded client component, so visiting the regex tester never downloads the PDF engine.

---

## Table of contents

- [Highlights](#highlights)
- [Tool catalog](#tool-catalog)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Adding a new tool](#adding-a-new-tool)
- [SEO](#seo)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Privacy and network access](#privacy-and-network-access)

---

## Highlights

| | |
|---|---|
| **84 tools** | Across 10 categories, all registered in a single source of truth |
| **Fully static** | Every route is prerendered at build time — no ISR, no route handlers, no server actions |
| **Client-side by default** | Tool components are `dynamic(..., { ssr: false })`, code-split per tool |
| **84 blog guides** | One long-form guide per tool, English and Turkish |
| **Bilingual** | English and Turkish UI, auto-detected from the browser and persisted |
| **PWA** | Web app manifest plus a network-first service worker that falls back to cache when offline |
| **Dark mode** | System-preference default, toggleable, persisted to `localStorage` |
| **SEO-first** | Per-page metadata, JSON-LD (`BreadcrumbList`, `SoftwareApplication`, `FAQPage`), generated sitemap and robots |

---

## Tool catalog

| Category | Count | Tools |
|---|---|---|
| **Dev Tools** | 15 | Tree, DB Model, JSON, Regex, API, Markdown, SQL Formatter, Text Diff, JSON to Types, Cron Builder, HTTP Status, Chmod Calculator, .env Editor, Git Builder, Code Screenshot |
| **PDF** | 13 | JPG/PNG to PDF, Merge, Split, Reorder, Compress, Watermark, DOCX/PPTX/XLSX/CSV/HTML/Markdown to PDF |
| **Fun** | 11 | Wheel of Fate, Coin Flip, Dice Roller, Random Number, Team Shuffler, Bracket, Random Picker, Magic 8-Ball, Rock Paper Scissors, Would You Rather, Decision Maker |
| **Design** | 8 | Colors, Board, Shape Maker, Mockup, Timeline, Gradient Generator, Box Shadow, Icon Editor |
| **Image Tools** | 8 | Resize, Crop, Compress, Format Convert, Color Picker, Placeholder, Image to Base64, Favicon Generator |
| **Converters** | 7 | Encoder, Timestamp, Base64 to File, YAML ↔ JSON, Number Base, Unit Converter, Color Format |
| **Generators** | 7 | QR Code, UUID, Lorem Ipsum, JWT, Fake Data, Hash Generator, Slug Generator |
| **Network** | 5 | DNS Lookup, What's My IP, SSL Checker, Headers Inspector, Speed Test |
| **Security** | 5 | Password Generator, Encryption, Cert Decoder, TOTP Generator, CSP Builder |
| **Data Tools** | 5 | CSV Viewer, JSON Path, Data Transformer, SQL Playground, Chart Builder |

Four tools expose sub-routes as tabs: `json` (editor / diff), `encoder` (base64 / url), `jwt` (decode / forge), and `timeline` (priority / date).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 (strict), React 19 |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Components | shadcn/ui (new-york) on Radix primitives, Lucide icons |
| Editors | Monaco (`@monaco-editor/react`) |
| Diagrams | `@xyflow/react` (ER diagrams), `@dbml/core` (DBML parsing) |
| PDF | `pdf-lib`, `pdfjs-dist`, `jspdf`, `mammoth` (DOCX) |
| Data | `sql.js` (in-browser SQLite), `xlsx`, `yaml`, `@faker-js/faker`, `recharts` |
| Storage | `idb` (IndexedDB), `localStorage`, `lz-string` for shareable URLs |
| Hosting | Cloudflare Workers via OpenNext, plus a self-hosted Node target |

---

## Getting started

**Requirements:** Node.js 20+ and npm.

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000) with Turbopack HMR.

To exercise the app exactly as Cloudflare will serve it — bundled into a Worker and run under `workerd`:

```bash
npm run preview
```

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server with Turbopack |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm start` | Serve the production build with Node |
| `npm run lint` | ESLint across the repo |
| `npm run preview` | Build with OpenNext and run the Worker locally under `workerd` |
| `npm run deploy` | Build with OpenNext and deploy to Cloudflare Workers |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` from the Wrangler bindings |

---

## Project structure

```
src/
├── app/                        # App Router — thin server pages, client shells
│   ├── [category]/             # /dev-tools, /pdf, …
│   │   └── [tool]/             # /dev-tools/json
│   │       └── [sub]/          # /dev-tools/json/diff
│   ├── blog/[slug]/            # 84 generated guides
│   ├── layout.tsx              # Fonts, global metadata, AppShell
│   ├── not-found.tsx
│   ├── robots.ts               # Generated robots.txt
│   └── sitemap.ts              # Generated sitemap.xml
├── components/
│   ├── layout/                 # AppShell, sidebar, mobile nav, tab layout
│   ├── common/                 # RelatedTools, ToolFaq, BlogGuideLink
│   ├── shared/                 # Shared tool chrome: toolbar, export, presets
│   ├── ui/                     # shadcn/ui primitives
│   └── <tool>/                 # One directory per tool
├── config/toolRegistry.ts      # ⭐ Single source of truth: categories + tools
├── data/
│   ├── blogPosts.ts            # 84 posts (EN + TR)
│   ├── toolFaqs.ts             # Per-tool FAQ entries → FAQPage JSON-LD
│   └── httpStatusCodes.ts
├── hooks/                      # useFavorites, useRecentTools, useTheme, …
├── i18n/                       # LocaleContext + en/tr locale files
├── services/                   # External API clients
├── utils/                      # Pure logic: pdfEngine, treeGenerator, jsonTo*, …
└── types/
```

The rule of thumb: **`utils/` holds pure functions, `components/` holds UI, and nothing in `app/` holds business logic.**

---

## Architecture

### The registry drives everything

`src/config/toolRegistry.ts` exports `CATEGORIES` and `TOOLS`. Routes, navigation, search, the sitemap, related-tool suggestions, and category landing pages are all derived from it. Adding an entry there is what makes a tool exist.

### Routing

Three dynamic segments cover every tool page:

```
/[category]              → category landing page
/[category]/[tool]       → the tool
/[category]/[tool]/[sub] → a tool's sub-tab
```

Each `page.tsx` is a server component that handles `generateStaticParams`, `generateMetadata`, and JSON-LD. It renders a sibling `client.tsx`, which maps a tool id to its component through `TOOL_COMPONENTS` — a record of `dynamic(() => import(...), { ssr: false })` entries. That split keeps SEO metadata static and server-rendered while the interactive tool stays entirely client-side and individually code-split.

### Rendering

All 192 pages are prerendered (`○ Static` / `● SSG`). There is no middleware, there are no route handlers, and there are no server actions — so the deployed Worker only ever serves prerendered HTML and static assets.

> **Known issue:** `generateStaticParams` is present but the dynamic segments never call `notFound()` for unknown params, and `dynamicParams` defaults to `true`. Unrecognized paths therefore render with a `200` instead of a `404` (a soft 404).

### State and persistence

No global state library. Local component state plus purpose-built hooks: `useLocalStorage`, `useFavorites`, `useRecentTools`, `useTheme`, `useShareableUrl` (lz-string-compressed state in the URL), `useKeyboardShortcuts`, `useIsMobile`.

---

## Adding a new tool

1. **Build the component** in `src/components/<tool>/<ToolName>.tsx`, with pure logic extracted to `src/utils/`.
2. **Register it** in `src/config/toolRegistry.ts` — `id`, `label`, `description`, `icon`, `categoryId`, `path`, and `keywords` for search and SEO.
3. **Wire the lazy import** into `TOOL_COMPONENTS` in `src/app/[category]/[tool]/client.tsx` (and the `[sub]` client if it has tabs):
   ```ts
   "my-tool": dynamic(
     () => import("@/components/mytool/MyTool").then((m) => ({ default: m.MyTool })),
     { ssr: false }
   ),
   ```
4. **Add FAQs** in `src/data/toolFaqs.ts` — they render on the page and emit `FAQPage` JSON-LD.
5. **Add a blog guide** in `src/data/blogPosts.ts` with a matching `toolId`, ideally with Turkish fields.
6. **Add translations** in `src/i18n/locales/en.ts` and `tr.ts`.

The sitemap, category page, search index, and related-tools rail pick the tool up automatically from step 2.

---

## SEO

- **Metadata** — per-tool and per-post titles, descriptions, keywords, canonicals, Open Graph, and Twitter cards generated in `generateMetadata`.
- **Structured data** — `BreadcrumbList` and `SoftwareApplication` on tool pages, `FAQPage` from `toolFaqs.ts`.
- **Sitemap and robots** — generated from the registry at build time by `src/app/sitemap.ts` and `src/app/robots.ts`.
- **Content** — 84 long-form guides cross-linked to their tools via `BlogGuideLink` and `RelatedTools`.

---

## Internationalization

English and Turkish, handled client-side by `LocaleContext`: it reads `localStorage`, falls back to `navigator.language`, and defaults to English. Blog posts carry optional `titleTr` / `descriptionTr` / `contentTr` / `keywordsTr` fields.

Note that the locale is applied on the client, so prerendered HTML and the metadata delivered to crawlers are English.

---

## Deployment

The project targets two environments.

### Cloudflare Workers (OpenNext)

Configured by [`wrangler.jsonc`](wrangler.jsonc) and [`open-next.config.ts`](open-next.config.ts). Deploy from your machine with:

```bash
npm run deploy
```

For Cloudflare's own Workers Builds (git-triggered), set these in **Workers → toolbox → Settings → Build**:

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

> **⚠️ The `name` in `wrangler.jsonc`, the `WORKER_SELF_REFERENCE` service binding, and the Worker name in the Cloudflare dashboard must all be the same string (`toolbox`).**
>
> If they diverge, the deploy fails at the very last step with:
> ```
> Service binding 'WORKER_SELF_REFERENCE' references Worker 'x' which was not found. [code: 10143]
> ```
> This is also why the Cloudflare config is committed rather than left to `wrangler`'s interactive setup: in a non-interactive CI build, `wrangler deploy` auto-runs `@opennextjs/cloudflare migrate`, which names the Worker after the `name` field in `package.json` (`kutu-tree`) and produces exactly that mismatch.

No R2 bucket or KV namespace is required — with every page prerendered there is nothing to revalidate, so no incremental cache backend is configured. If on-demand revalidation is ever added, wire one up in `open-next.config.ts` (see the [OpenNext caching docs](https://opennext.js.org/cloudflare/caching)).

### Self-hosted Node (GitHub Actions)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`: it builds, assembles `.next/standalone` with `static/` and `public/`, copies the bundle over SSH, and restarts it under pm2 as `toolbox` on port 3000.

Both targets share one `next.config.ts`. `output: "standalone"` serves the pm2 deployment, and OpenNext sets `NEXT_PRIVATE_STANDALONE=true` internally anyway, so no conditional configuration is needed.

---

## Privacy and network access

Most tools are entirely client-side — files, text, and images never leave the browser. PDF manipulation, image editing, hashing, encryption, and the SQL playground all run locally via WebAssembly or browser APIs.

The exceptions are the tools that fundamentally require a network round trip. These call **third-party public APIs directly from the browser**, with no proxy or logging of our own:

| Tool | Endpoint |
|---|---|
| DNS Lookup | Cloudflare, Google, Quad9, Mozilla, Wikimedia DoH resolvers |
| What's My IP | `ipapi.co` |
| Colors | `thecolorapi.com`, `api.color.pizza` |
| Speed Test | `speed.cloudflare.com` |

---

## License

Open source under the [MIT License](LICENSE). © 2026 Kutu Yazılım, see [kutuyazilim.org](https://kutuyazilim.org).
