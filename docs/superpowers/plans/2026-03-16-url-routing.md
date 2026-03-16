# URL Routing & Sitemap Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tabs-based SPA navigation with React Router v7 categorized URL routing so every tool has a dedicated, deep-linkable URL.

**Architecture:** Install React Router v7, create a centralized tool registry, define lazy-loaded route tree with category layouts, then migrate sidebar/mobile nav to use `<NavLink>`/`<Link>`. Tools with internal tabs (JSON, JWT, Encoder, DNS/IP, PDF) get split into child route components.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Tailwind CSS, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-16-url-routing-design.md`

---

## Chunk 1: Foundation (Registry, Router, Layouts)

### Task 1: Install React Router

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install react-router**

Run: `npm install react-router`

- [ ] **Step 2: Verify installation**

Run: `npm ls react-router`
Expected: `react-router@7.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-router v7"
```

---

### Task 2: Create Tool Registry

**Files:**
- Create: `src/config/toolRegistry.ts`

The registry is the single source of truth for all tool metadata. It replaces `NAV_ITEMS` from `AppSidebar.tsx` and `TOOLS` from `WelcomePage.tsx`.

- [ ] **Step 1: Create the registry file**

```ts
// src/config/toolRegistry.ts
import {
  TreePine, Database, Palette, PenTool, Braces, RegexIcon,
  KeyRound, Clock, Send, FileText, CircleDot, ShieldCheck,
  QrCode, Coins, Shapes, Smartphone, FileOutput, Globe,
  FileType, Dices
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CategoryId =
  | "dev-tools"
  | "converters"
  | "generators"
  | "design"
  | "network"
  | "pdf"
  | "fun"

export interface Category {
  id: CategoryId
  name: string
  path: string
  icon: LucideIcon
}

export interface SubRoute {
  path: string
  name: string
  defaultRoute?: boolean
}

export interface ToolEntry {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: CategoryId
  path: string
  subRoutes?: SubRoute[]
}

export const CATEGORIES: Category[] = [
  { id: "dev-tools", name: "Dev Tools", path: "/dev-tools", icon: Braces },
  { id: "converters", name: "Converters", path: "/converters", icon: FileOutput },
  { id: "generators", name: "Generators", path: "/generators", icon: CircleDot },
  { id: "design", name: "Design", path: "/design", icon: Palette },
  { id: "network", name: "Network", path: "/network", icon: Globe },
  { id: "pdf", name: "PDF", path: "/pdf", icon: FileType },
  { id: "fun", name: "Fun", path: "/fun", icon: Dices },
]

export const TOOLS: ToolEntry[] = [
  // Dev Tools
  {
    id: "json",
    name: "JSON",
    description: "Format, validate, and diff JSON",
    icon: Braces,
    category: "dev-tools",
    path: "/dev-tools/json",
    subRoutes: [
      { path: "editor", name: "Editor", defaultRoute: true },
      { path: "diff", name: "Diff" },
    ],
  },
  {
    id: "regex",
    name: "Regex",
    description: "Test regular expressions with live matching",
    icon: RegexIcon,
    category: "dev-tools",
    path: "/dev-tools/regex",
  },
  {
    id: "api",
    name: "API",
    description: "Build and test REST API requests",
    icon: Send,
    category: "dev-tools",
    path: "/dev-tools/api",
  },
  {
    id: "jwt",
    name: "JWT",
    description: "Decode and forge JSON Web Tokens",
    icon: ShieldCheck,
    category: "dev-tools",
    path: "/dev-tools/jwt",
    subRoutes: [
      { path: "decode", name: "Decode", defaultRoute: true },
      { path: "forge", name: "Forge" },
    ],
  },
  {
    id: "markdown",
    name: "Markdown",
    description: "Edit markdown with live preview",
    icon: FileText,
    category: "dev-tools",
    path: "/dev-tools/markdown",
  },
  {
    id: "db-model",
    name: "DB Model",
    description: "Visual ER diagram designer with DBML",
    icon: Database,
    category: "dev-tools",
    path: "/dev-tools/db-model",
  },
  {
    id: "tree",
    name: "Tree",
    description: "Generate ASCII tree structures",
    icon: TreePine,
    category: "dev-tools",
    path: "/dev-tools/tree",
  },

  // Converters
  {
    id: "encoder",
    name: "Encoder",
    description: "Base64 and URL encode/decode",
    icon: KeyRound,
    category: "converters",
    path: "/converters/encoder",
    subRoutes: [
      { path: "base64", name: "Base64", defaultRoute: true },
      { path: "url", name: "URL" },
    ],
  },
  {
    id: "timestamp",
    name: "Timestamp",
    description: "Convert Unix timestamps to dates",
    icon: Clock,
    category: "converters",
    path: "/converters/timestamp",
  },
  {
    id: "base64-to-file",
    name: "Base64 to File",
    description: "Convert base64 strings to files",
    icon: FileOutput,
    category: "converters",
    path: "/converters/base64-to-file",
  },

  // Generators
  {
    id: "qr-code",
    name: "QR Code",
    description: "Generate styled QR codes",
    icon: QrCode,
    category: "generators",
    path: "/generators/qr-code",
  },

  // Design
  {
    id: "colors",
    name: "Colors",
    description: "Generate color palettes with harmony analysis",
    icon: Palette,
    category: "design",
    path: "/design/colors",
  },
  {
    id: "board",
    name: "Board",
    description: "Freeform canvas drawing board",
    icon: PenTool,
    category: "design",
    path: "/design/board",
  },
  {
    id: "shapemaker",
    name: "Shape Maker",
    description: "Design shapes and export Flutter code",
    icon: Shapes,
    category: "design",
    path: "/design/shapemaker",
  },
  {
    id: "mockup",
    name: "Mockup",
    description: "Device frame mockup generator",
    icon: Smartphone,
    category: "design",
    path: "/design/mockup",
  },

  // Network
  {
    id: "dns-lookup",
    name: "DNS Lookup",
    description: "Query DNS records for any domain",
    icon: Globe,
    category: "network",
    path: "/network/dns-lookup",
  },
  {
    id: "whats-my-ip",
    name: "What's My IP",
    description: "View your IP and geolocation",
    icon: Globe,
    category: "network",
    path: "/network/whats-my-ip",
  },

  // PDF
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert images to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/image-to-pdf",
  },
  {
    id: "merge",
    name: "PDF Merge",
    description: "Merge multiple PDFs into one",
    icon: FileType,
    category: "pdf",
    path: "/pdf/merge",
  },
  {
    id: "split",
    name: "PDF Split",
    description: "Split PDF into separate pages",
    icon: FileType,
    category: "pdf",
    path: "/pdf/split",
  },
  {
    id: "reorder",
    name: "PDF Reorder",
    description: "Reorder PDF pages",
    icon: FileType,
    category: "pdf",
    path: "/pdf/reorder",
  },
  {
    id: "compress",
    name: "PDF Compress",
    description: "Reduce PDF file size",
    icon: FileType,
    category: "pdf",
    path: "/pdf/compress",
  },
  {
    id: "watermark",
    name: "PDF Watermark",
    description: "Add watermarks to PDFs",
    icon: FileType,
    category: "pdf",
    path: "/pdf/watermark",
  },
  {
    id: "docx-to-pdf",
    name: "DOCX to PDF",
    description: "Convert Word documents to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/docx-to-pdf",
  },
  {
    id: "pptx-to-pdf",
    name: "PPTX to PDF",
    description: "Convert PowerPoint to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/pptx-to-pdf",
  },
  {
    id: "xlsx-to-pdf",
    name: "XLSX to PDF",
    description: "Convert Excel to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/xlsx-to-pdf",
  },
  {
    id: "csv-to-pdf",
    name: "CSV to PDF",
    description: "Convert CSV files to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/csv-to-pdf",
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert HTML to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/html-to-pdf",
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown to PDF",
    description: "Convert Markdown to PDF",
    icon: FileType,
    category: "pdf",
    path: "/pdf/markdown-to-pdf",
  },

  // Fun
  {
    id: "wheel-of-fate",
    name: "Wheel of Fate",
    description: "Spin to randomly pick from a list",
    icon: CircleDot,
    category: "fun",
    path: "/fun/wheel-of-fate",
  },
  {
    id: "coin-flip",
    name: "Coin Flip",
    description: "Flip a coin with 3D animation",
    icon: Coins,
    category: "fun",
    path: "/fun/coin-flip",
  },
]

export function getToolsByCategory(categoryId: CategoryId): ToolEntry[] {
  return TOOLS.filter((t) => t.category === categoryId)
}

export function getCategoryByPath(path: string): Category | undefined {
  return CATEGORIES.find((c) => path.startsWith(c.path))
}

export function getToolByPath(path: string): ToolEntry | undefined {
  return TOOLS.find((t) => path.startsWith(t.path))
}
```

Note: The exact icon imports must be verified against what `AppSidebar.tsx` currently uses. Cross-reference `NAV_ITEMS` icons during implementation.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/config/toolRegistry.ts
git commit -m "feat(routing): add centralized tool registry"
```

---

### Task 3: Create RootLayout

**Files:**
- Create: `src/layouts/RootLayout.tsx`
- Reference: `src/App.tsx` (current layout structure)

RootLayout replaces the outer shell of `App.tsx`. It renders the sidebar, mobile nav, and an `<Outlet>` where route content appears.

- [ ] **Step 1: Create the layout**

```tsx
// src/layouts/RootLayout.tsx
import { Suspense } from "react"
import { Outlet } from "react-router"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { useIsMobile } from "@/hooks/useIsMobile"

export function RootLayout() {
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {!isMobile && <AppSidebar />}
      <main className="flex-1 overflow-auto">
        {isMobile && <MobileNav />}
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
```

Note: The exact layout structure (flex, classNames, etc.) must match the current `App.tsx` layout. Cross-reference during implementation and adjust accordingly.

Note: Verify that `useIsMobile` hook exists at `@/hooks/useIsMobile`. If the current `App.tsx` uses CSS-based responsive design instead of a JS hook, use the same approach here. Also verify that `useTheme` (used in sidebar/mobile nav) works without a wrapping provider — it reads/writes directly to the DOM and `localStorage`, so it should work fine in the new layout.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (but unused — that's fine for now)

- [ ] **Step 3: Commit**

```bash
git add src/layouts/RootLayout.tsx
git commit -m "feat(routing): add RootLayout with Outlet and Suspense"
```

---

### Task 4: Create CategoryLayout

**Files:**
- Create: `src/layouts/CategoryLayout.tsx`

Simple passthrough layout that renders `<Outlet>`. Can be extended later for category-level UI (breadcrumbs, etc.).

- [ ] **Step 1: Create the layout**

```tsx
// src/layouts/CategoryLayout.tsx
import { Outlet } from "react-router"

export function CategoryLayout() {
  return <Outlet />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/CategoryLayout.tsx
git commit -m "feat(routing): add CategoryLayout"
```

---

### Task 5: Create RouteErrorBoundary and NotFoundPage

**Files:**
- Create: `src/components/common/RouteErrorBoundary.tsx`
- Create: `src/components/common/NotFoundPage.tsx`

- [ ] **Step 1: Create the error boundary component**

```tsx
// src/components/common/RouteErrorBoundary.tsx
import { useRouteError, Link } from "react-router"

export function RouteErrorBoundary() {
  const error = useRouteError()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground">
        {error instanceof Error ? error.message : "An unexpected error occurred"}
      </p>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Create the 404 page with tool suggestions**

```tsx
// src/components/common/NotFoundPage.tsx
import { Link, useLocation } from "react-router"
import { TOOLS } from "@/config/toolRegistry"

function getSuggestions(pathname: string): typeof TOOLS {
  const segments = pathname.split("/").filter(Boolean)
  const query = segments.join(" ").toLowerCase()
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.id.includes(query) ||
      segments.some((s) => t.path.includes(s))
  ).slice(0, 3)
}

export function NotFoundPage() {
  const { pathname } = useLocation()
  const suggestions = getSuggestions(pathname)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      {suggestions.length > 0 && (
        <div className="mt-4 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Did you mean?</p>
          <div className="flex flex-col gap-2">
            {suggestions.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="text-primary hover:underline"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/common/RouteErrorBoundary.tsx src/components/common/NotFoundPage.tsx
git commit -m "feat(routing): add RouteErrorBoundary and NotFoundPage with suggestions"
```

---

### Task 6: Create CategoryLandingPage

**Files:**
- Create: `src/components/common/CategoryLandingPage.tsx`
- Reference: `src/components/welcome/WelcomePage.tsx` (reuse card grid pattern)

- [ ] **Step 1: Create the component**

```tsx
// src/components/common/CategoryLandingPage.tsx
import { Link, useLocation } from "react-router"
import { CATEGORIES, getToolsByCategory } from "@/config/toolRegistry"
import type { CategoryId } from "@/config/toolRegistry"

export function CategoryLandingPage() {
  const { pathname } = useLocation()
  const category = CATEGORIES.find((c) => pathname.startsWith(c.path))

  if (!category) return null

  const tools = getToolsByCategory(category.id as CategoryId)

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">{category.name}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.subRoutes?.find((r) => r.defaultRoute)
              ? `${tool.path}/${tool.subRoutes.find((r) => r.defaultRoute)!.path}`
              : tool.path}
            className="group rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="mb-2 flex items-center gap-2">
              <tool.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <h2 className="font-semibold">{tool.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

Note: The card styling should match the current `WelcomePage` tool cards. Adjust during implementation.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/common/CategoryLandingPage.tsx
git commit -m "feat(routing): add CategoryLandingPage component"
```

---

## Chunk 2: Split Tools with Sub-Routes

### Task 7: Split JsonFormatter into Editor/Diff

**Files:**
- Create: `src/components/json/JsonEditor.tsx`
- Create: `src/components/json/JsonDiff.tsx`
- Create: `src/layouts/JsonLayout.tsx`
- Reference: `src/components/json/JsonFormatter.tsx` (source to extract from)

Read `JsonFormatter.tsx` carefully. It has two modes controlled by a `diffMode` state:
- Normal mode: single Monaco editor with format/minify/validate
- Diff mode: side-by-side DiffEditor

- [ ] **Step 1: Read JsonFormatter.tsx thoroughly**

Identify:
- Shared state/imports between editor and diff modes
- Which state belongs to editor only vs diff only
- The exact boundary where modes diverge

- [ ] **Step 2: Create JsonEditor.tsx**

Extract the normal (non-diff) mode into its own component. Move all editor-specific state (input, formatted output, validation, indent settings) here. Keep the same UI and behavior.

- [ ] **Step 3: Create JsonDiff.tsx**

Extract the diff mode into its own component. Move diff-specific state (left/right editor content) here.

- [ ] **Step 4: Create JsonLayout.tsx**

```tsx
// src/layouts/JsonLayout.tsx
import { NavLink, Outlet } from "react-router"

export function JsonLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border p-2">
        <NavLink
          to="editor"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          Editor
        </NavLink>
        <NavLink
          to="diff"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          Diff
        </NavLink>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

Note: Match the existing tab styling from `JsonFormatter.tsx`. The above is a starting point.

- [ ] **Step 5: Verify the app compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/json/JsonEditor.tsx src/components/json/JsonDiff.tsx src/layouts/JsonLayout.tsx
git commit -m "feat(routing): split JsonFormatter into Editor and Diff route components"
```

---

### Task 8: Split JwtTool into Decode/Forge

**Files:**
- Create: `src/components/jwt/JwtDecode.tsx`
- Create: `src/components/jwt/JwtForge.tsx`
- Create: `src/layouts/JwtLayout.tsx`
- Reference: `src/components/jwt/JwtTool.tsx` (source to extract from)

JwtTool has internal tabs: "decode" and "forge". Each renders a distinct sub-component pattern.

- [ ] **Step 1: Read JwtTool.tsx thoroughly**

Identify the decode vs forge sections and their state.

- [ ] **Step 2: Create JwtDecode.tsx**

Extract the decode tab content. Include: token input, parsed header/payload/signature display, expiry status.

- [ ] **Step 3: Create JwtForge.tsx**

Extract the forge tab content. Include: header/payload editors, algorithm selector, secret input, generated token output.

- [ ] **Step 4: Create JwtLayout.tsx**

Same pattern as `JsonLayout.tsx` — NavLink tabs for Decode/Forge + Outlet.

```tsx
// src/layouts/JwtLayout.tsx
import { NavLink, Outlet } from "react-router"

export function JwtLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border p-2">
        <NavLink
          to="decode"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          Decode
        </NavLink>
        <NavLink
          to="forge"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          Forge
        </NavLink>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify the app compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/jwt/JwtDecode.tsx src/components/jwt/JwtForge.tsx src/layouts/JwtLayout.tsx
git commit -m "feat(routing): split JwtTool into Decode and Forge route components"
```

---

### Task 9: Split EncoderDecoder into Base64/URL

**Files:**
- Create: `src/components/encoder/Base64Encoder.tsx`
- Create: `src/components/encoder/UrlEncoder.tsx`
- Create: `src/layouts/EncoderLayout.tsx`
- Reference: `src/components/encoder/EncoderDecoder.tsx` (source to extract from)

EncoderDecoder has 3 modes: "base64", "url", "jwt". The JWT mode is removed (dedicated tool at `/dev-tools/jwt`).

- [ ] **Step 1: Read EncoderDecoder.tsx thoroughly**

Identify the base64 and url sections. Note: URL mode has sub-modes (component vs URI encoding).

- [ ] **Step 2: Create Base64Encoder.tsx**

Extract base64 encode/decode functionality.

- [ ] **Step 3: Create UrlEncoder.tsx**

Extract URL encode/decode functionality, including the component/URI sub-mode toggle.

- [ ] **Step 4: Create EncoderLayout.tsx**

Same pattern — NavLink tabs for Base64/URL + Outlet.

```tsx
// src/layouts/EncoderLayout.tsx
import { NavLink, Outlet } from "react-router"

export function EncoderLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border p-2">
        <NavLink
          to="base64"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          Base64
        </NavLink>
        <NavLink
          to="url"
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          URL
        </NavLink>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify the app compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/encoder/Base64Encoder.tsx src/components/encoder/UrlEncoder.tsx src/layouts/EncoderLayout.tsx
git commit -m "feat(routing): split EncoderDecoder into Base64 and URL route components"
```

---

### Task 10: Create Router with All Routes

**Files:**
- Create: `src/router.tsx`

This is the main route definition file. All split components from Tasks 7-9 must exist before this task. Uses `createBrowserRouter` with lazy imports for tool components. Layout components (JsonLayout, JwtLayout, EncoderLayout) are imported eagerly since they are tiny (just nav + Outlet).

- [ ] **Step 1: Create the router file**

```tsx
// src/router.tsx
import { createBrowserRouter, Navigate } from "react-router"
import { lazy } from "react"
import { RootLayout } from "@/layouts/RootLayout"
import { CategoryLayout } from "@/layouts/CategoryLayout"
import { CategoryLandingPage } from "@/components/common/CategoryLandingPage"
import { NotFoundPage } from "@/components/common/NotFoundPage"
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary"

// Eagerly imported layouts (tiny — just nav + Outlet)
import { JsonLayout } from "@/layouts/JsonLayout"
import { JwtLayout } from "@/layouts/JwtLayout"
import { EncoderLayout } from "@/layouts/EncoderLayout"

// Lazy-loaded tool components
const WelcomePage = lazy(() => import("@/components/welcome/WelcomePage").then(m => ({ default: m.WelcomePage })))

// Dev Tools
const JsonEditor = lazy(() => import("@/components/json/JsonEditor").then(m => ({ default: m.JsonEditor })))
const JsonDiff = lazy(() => import("@/components/json/JsonDiff").then(m => ({ default: m.JsonDiff })))
const RegexPlayground = lazy(() => import("@/components/regex/RegexPlayground").then(m => ({ default: m.RegexPlayground })))
const ApiRequestBuilder = lazy(() => import("@/components/api/ApiRequestBuilder").then(m => ({ default: m.ApiRequestBuilder })))
const JwtDecode = lazy(() => import("@/components/jwt/JwtDecode").then(m => ({ default: m.JwtDecode })))
const JwtForge = lazy(() => import("@/components/jwt/JwtForge").then(m => ({ default: m.JwtForge })))
const MarkdownPreview = lazy(() => import("@/components/markdown/MarkdownPreview").then(m => ({ default: m.MarkdownPreview })))
const DbModelling = lazy(() => import("@/components/db/DbModelling").then(m => ({ default: m.DbModelling })))
const TreeCreator = lazy(() => import("@/components/tree/TreeCreator").then(m => ({ default: m.TreeCreator })))

// Converters
const Base64Encoder = lazy(() => import("@/components/encoder/Base64Encoder").then(m => ({ default: m.Base64Encoder })))
const UrlEncoder = lazy(() => import("@/components/encoder/UrlEncoder").then(m => ({ default: m.UrlEncoder })))
const TimestampConverter = lazy(() => import("@/components/timestamp/TimestampConverter").then(m => ({ default: m.TimestampConverter })))
const Base64ToFile = lazy(() => import("@/components/base64file/Base64ToFile").then(m => ({ default: m.Base64ToFile })))

// Generators
const QrGenerator = lazy(() => import("@/components/qr/QrGenerator").then(m => ({ default: m.QrGenerator })))

// Design
const ColorPicker = lazy(() => import("@/components/color/ColorPicker").then(m => ({ default: m.ColorPicker })))
const BoardEditor = lazy(() => import("@/components/board/BoardEditor").then(m => ({ default: m.BoardEditor })))
const ShapeMaker = lazy(() => import("@/components/shapemaker/ShapeMaker").then(m => ({ default: m.ShapeMaker })))
const MockupEditor = lazy(() => import("@/components/mockup/MockupEditor").then(m => ({ default: m.MockupEditor })))

// Network
const DnsLookup = lazy(() => import("@/components/dnsip/DnsLookup").then(m => ({ default: m.DnsLookup })))
const WhatsMyIp = lazy(() => import("@/components/dnsip/WhatsMyIp").then(m => ({ default: m.WhatsMyIp })))

// PDF
const ImageToPdf = lazy(() => import("@/components/pdf/ImageToPdf").then(m => ({ default: m.ImageToPdf })))
const PdfMerge = lazy(() => import("@/components/pdf/PdfMerge").then(m => ({ default: m.PdfMerge })))
const PdfSplit = lazy(() => import("@/components/pdf/PdfSplit").then(m => ({ default: m.PdfSplit })))
const PdfReorder = lazy(() => import("@/components/pdf/PdfReorder").then(m => ({ default: m.PdfReorder })))
const PdfCompress = lazy(() => import("@/components/pdf/PdfCompress").then(m => ({ default: m.PdfCompress })))
const PdfWatermark = lazy(() => import("@/components/pdf/PdfWatermark").then(m => ({ default: m.PdfWatermark })))
const DocxToPdf = lazy(() => import("@/components/pdf/DocxToPdf").then(m => ({ default: m.DocxToPdf })))
const PptxToPdf = lazy(() => import("@/components/pdf/PptxToPdf").then(m => ({ default: m.PptxToPdf })))
const XlsxToPdf = lazy(() => import("@/components/pdf/XlsxToPdf").then(m => ({ default: m.XlsxToPdf })))
const CsvToPdf = lazy(() => import("@/components/pdf/CsvToPdf").then(m => ({ default: m.CsvToPdf })))
const HtmlToPdf = lazy(() => import("@/components/pdf/HtmlToPdf").then(m => ({ default: m.HtmlToPdf })))
const MarkdownToPdf = lazy(() => import("@/components/pdf/MarkdownToPdf").then(m => ({ default: m.MarkdownToPdf })))

// Fun
const WheelOfFate = lazy(() => import("@/components/wheel/WheelOfFate").then(m => ({ default: m.WheelOfFate })))
const CoinFlip = lazy(() => import("@/components/coinflip/CoinFlip").then(m => ({ default: m.CoinFlip })))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <WelcomePage /> },

      // Dev Tools
      {
        path: "dev-tools",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          {
            path: "json",
            element: <JsonLayout />,
            children: [
              { index: true, element: <Navigate to="editor" replace /> },
              { path: "editor", element: <JsonEditor /> },
              { path: "diff", element: <JsonDiff /> },
            ],
          },
          { path: "regex", element: <RegexPlayground /> },
          { path: "api", element: <ApiRequestBuilder /> },
          {
            path: "jwt",
            element: <JwtLayout />,
            children: [
              { index: true, element: <Navigate to="decode" replace /> },
              { path: "decode", element: <JwtDecode /> },
              { path: "forge", element: <JwtForge /> },
            ],
          },
          { path: "markdown", element: <MarkdownPreview /> },
          { path: "db-model", element: <DbModelling /> },
          { path: "tree", element: <TreeCreator /> },
        ],
      },

      // Converters
      {
        path: "converters",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          {
            path: "encoder",
            element: <EncoderLayout />,
            children: [
              { index: true, element: <Navigate to="base64" replace /> },
              { path: "base64", element: <Base64Encoder /> },
              { path: "url", element: <UrlEncoder /> },
            ],
          },
          { path: "timestamp", element: <TimestampConverter /> },
          { path: "base64-to-file", element: <Base64ToFile /> },
        ],
      },

      // Generators
      {
        path: "generators",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "qr-code", element: <QrGenerator /> },
        ],
      },

      // Design
      {
        path: "design",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "colors", element: <ColorPicker /> },
          { path: "board", element: <BoardEditor /> },
          { path: "shapemaker", element: <ShapeMaker /> },
          { path: "mockup", element: <MockupEditor /> },
        ],
      },

      // Network
      {
        path: "network",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "dns-lookup", element: <DnsLookup /> },
          { path: "whats-my-ip", element: <WhatsMyIp /> },
        ],
      },

      // PDF
      {
        path: "pdf",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "image-to-pdf", element: <ImageToPdf /> },
          { path: "merge", element: <PdfMerge /> },
          { path: "split", element: <PdfSplit /> },
          { path: "reorder", element: <PdfReorder /> },
          { path: "compress", element: <PdfCompress /> },
          { path: "watermark", element: <PdfWatermark /> },
          { path: "docx-to-pdf", element: <DocxToPdf /> },
          { path: "pptx-to-pdf", element: <PptxToPdf /> },
          { path: "xlsx-to-pdf", element: <XlsxToPdf /> },
          { path: "csv-to-pdf", element: <CsvToPdf /> },
          { path: "html-to-pdf", element: <HtmlToPdf /> },
          { path: "markdown-to-pdf", element: <MarkdownToPdf /> },
        ],
      },

      // Fun
      {
        path: "fun",
        element: <CategoryLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <CategoryLandingPage /> },
          { path: "wheel-of-fate", element: <WheelOfFate /> },
          { path: "coin-flip", element: <CoinFlip /> },
        ],
      },

      // 404
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
```

Note: The lazy import `.then(m => ({ default: m.ComponentName }))` pattern is needed because components use named exports. If any component uses a default export, simplify to just `lazy(() => import("..."))`. Verify each component's export style during implementation.

- [ ] **Step 2: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors — all referenced components exist from previous tasks.

- [ ] **Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "feat(routing): add route definitions with lazy loading and error boundaries"
```

---

## Chunk 3: Wire Up Router & Migrate Navigation

### Task 11: Update App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

Replace the entire tabs-based App with RouterProvider.

- [ ] **Step 1: Rewrite App.tsx**

```tsx
// src/App.tsx
import { RouterProvider } from "react-router"
import { router } from "@/router"

export default function App() {
  return <RouterProvider router={router} />
}
```

Remove all tool component imports, `activeTab` state, `Tabs` wrapper, and `TabsContent` blocks.

- [ ] **Step 2: Verify main.tsx still works**

`main.tsx` should already render `<App />` — no changes needed unless it imports something from App that was removed.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routing): replace tabs system with RouterProvider in App.tsx"
```

---

### Task 12: Migrate AppSidebar to React Router

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

Replace `TabsList`/`TabsTrigger` with `NavLink` from React Router. Group tools by category with collapsible sections.

- [ ] **Step 1: Read current AppSidebar.tsx**

Understand the current structure: collapsed state, NAV_ITEMS loop, Home button, theme toggle.

- [ ] **Step 2: Rewrite to use router navigation**

Key changes:
- Remove `TabsList`, `TabsTrigger` imports from shadcn
- Import `NavLink` from `react-router`
- Import `CATEGORIES`, `getToolsByCategory` from `@/config/toolRegistry`
- Replace flat NAV_ITEMS list with category groups
- Each category header is collapsible + clickable (navigates to category landing)
- Each tool link uses `<NavLink>` with active class styling
- Add `localStorage` state for category collapse/expand (use key `"sidebar-categories"`, store as JSON object `{ [categoryId]: boolean }`, default all categories to expanded)
- Home button uses `<NavLink to="/">`
- Keep theme toggle and collapse button as-is

Note: The sidebar must no longer accept or use any `onTabChange`/`activeTab` props. It reads active state from the URL via `NavLink`.

- [ ] **Step 3: Verify sidebar renders correctly**

Run: `npm run dev`
Navigate to `/` — sidebar should show with categories and tools.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppSidebar.tsx
git commit -m "feat(routing): migrate AppSidebar to React Router NavLink with categories"
```

---

### Task 13: Migrate MobileNav to React Router

**Files:**
- Modify: `src/components/layout/MobileNav.tsx`

Replace tab-based navigation with `Link` from React Router.

- [ ] **Step 1: Read current MobileNav.tsx**

Understand the structure: fixed top bar, bottom sheet, tool grid.

- [ ] **Step 2: Rewrite to use router navigation**

Key changes:
- Remove `TabsTrigger` imports
- Import `Link`, `useLocation` from `react-router`
- Import `CATEGORIES`, `getToolsByCategory` from `@/config/toolRegistry`
- Group tools by category in the bottom sheet grid
- Each tool button becomes a `<Link>` that closes the sheet on click
- Active tool detection via `useLocation()` instead of tabs context

- [ ] **Step 3: Verify mobile nav works**

Open dev tools, toggle mobile viewport. Navigate between tools.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileNav.tsx
git commit -m "feat(routing): migrate MobileNav to React Router Link with categories"
```

---

### Task 14: Migrate WelcomePage to React Router

**Files:**
- Modify: `src/components/welcome/WelcomePage.tsx`

Replace `onNavigate` callback with `<Link>` components.

- [ ] **Step 1: Read current WelcomePage.tsx**

Note the `TOOLS` array and `onNavigate` prop pattern.

- [ ] **Step 2: Rewrite to use Link**

Key changes:
- Remove `onNavigate` prop from component signature
- Remove internal `TOOLS` array (use `TOOLS` and `CATEGORIES` from `@/config/toolRegistry`)
- Replace `<button onClick={() => onNavigate(value)}>` with `<Link to={tool.path}>`
- Group tools by category on the welcome page (or keep flat grid — match current design)

- [ ] **Step 3: Verify welcome page works**

Navigate to `/` — tool grid should render. Clicking a tool navigates to its URL.

- [ ] **Step 4: Commit**

```bash
git add src/components/welcome/WelcomePage.tsx
git commit -m "feat(routing): migrate WelcomePage to React Router Link"
```

---

## Chunk 4: PDF & DNS/IP Route Wiring

### Task 15: Wire PDF Tools as Individual Routes

**Files:**
- Modify: `src/components/pdf/PdfTools.tsx` (convert hub to landing page, or remove if CategoryLandingPage handles it)
- Reference: All PDF sub-tool components in `src/components/pdf/`

The 12 PDF sub-tools already exist as separate component files. They just need to work as standalone route components.

- [ ] **Step 1: Verify each PDF component exports correctly**

Check that each PDF component (`ImageToPdf`, `PdfMerge`, `PdfSplit`, etc.) has a named export matching what `router.tsx` expects. List any discrepancies.

Run: Check each file's export statement.

- [ ] **Step 2: Fix any export mismatches**

If a component uses `export default` instead of named export (or vice versa), update either the component or `router.tsx` to match.

- [ ] **Step 3: Check if PDF components have dependencies on PdfTools.tsx**

Some PDF tools may receive props from the hub (like a back button callback). Remove these dependencies so each tool works standalone.

- [ ] **Step 4: Update PdfTools.tsx or remove it**

If `CategoryLandingPage` handles the `/pdf` index route adequately, both `PdfTools.tsx` and `PdfToolsHub.tsx` hub logic can be removed. If the hub has unique content (custom descriptions, icons) beyond what the registry provides, preserve that content in a custom PDF landing page or migrate it into the registry.

- [ ] **Step 5: Verify PDF routes work**

Run: `npm run dev`
Navigate to `/pdf` — should show PDF tools landing.
Navigate to `/pdf/merge` — should show PDF Merge tool.
Test 2-3 other PDF sub-tools.

- [ ] **Step 6: Commit**

```bash
git add src/components/pdf/
git commit -m "feat(routing): wire PDF tools as individual lazy routes"
```

---

### Task 16: Wire DNS/IP as Individual Routes

**Files:**
- Reference: `src/components/dnsip/DnsLookup.tsx`
- Reference: `src/components/dnsip/WhatsMyIp.tsx`
- Remove: `src/components/dnsip/DnsIpTool.tsx` (tab wrapper no longer needed)

- [ ] **Step 1: Verify DnsLookup.tsx and WhatsMyIp.tsx export correctly**

Check named exports match what `router.tsx` expects.

- [ ] **Step 2: Fix any export mismatches**

- [ ] **Step 3: Remove DnsIpTool.tsx or mark as deprecated**

The tab wrapper is no longer needed since DNS and IP are separate routes.

- [ ] **Step 4: Verify routes work**

Navigate to `/network/dns-lookup` and `/network/whats-my-ip`.

- [ ] **Step 5: Commit**

```bash
git add src/components/dnsip/
git commit -m "feat(routing): wire DNS and IP as separate routes under /network"
```

---

## Chunk 5: Cleanup & Verification

### Task 17: Remove Dead Code

**Files:**
- Modify: Various files

- [ ] **Step 1: Remove old NAV_ITEMS from AppSidebar.tsx**

If `NAV_ITEMS` is still in the file but unused, delete it.

- [ ] **Step 2: Remove old TOOLS array from WelcomePage.tsx**

If the internal `TOOLS` array is still in the file but unused, delete it.

- [ ] **Step 3: Remove unused imports from App.tsx**

All tool component imports should have been removed in Task 11. Verify none remain.

- [ ] **Step 4: Remove TabsContent, Tabs imports**

Search the codebase for any remaining `TabsContent` or `Tabs` imports that are no longer used.

Run: Search for `TabsContent` and `TabsTrigger` across all files.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead tabs navigation code"
```

---

### Task 18: Full Smoke Test

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test home page**

Navigate to `/` — welcome page with tool grid loads.

- [ ] **Step 3: Test category pages**

Navigate to each category URL:
- `/dev-tools` — shows dev tools grid
- `/converters` — shows converters grid
- `/generators` — shows generators grid
- `/design` — shows design tools grid
- `/network` — shows network tools grid
- `/pdf` — shows PDF tools grid
- `/fun` — shows fun tools grid

- [ ] **Step 4: Test simple tools (one per category)**

- `/dev-tools/regex` — Regex Playground loads
- `/converters/timestamp` — Timestamp Converter loads
- `/generators/qr-code` — QR Generator loads
- `/design/colors` — Color Picker loads (test `#colors=` hash still works)
- `/network/dns-lookup` — DNS Lookup loads
- `/fun/coin-flip` — Coin Flip loads

- [ ] **Step 5: Test tools with sub-routes**

- `/dev-tools/json` → redirects to `/dev-tools/json/editor`
- `/dev-tools/json/editor` — JSON Editor loads
- `/dev-tools/json/diff` — JSON Diff loads
- `/dev-tools/jwt` → redirects to `/dev-tools/jwt/decode`
- `/dev-tools/jwt/decode` — JWT Decode loads
- `/dev-tools/jwt/forge` — JWT Forge loads
- `/converters/encoder` → redirects to `/converters/encoder/base64`
- `/converters/encoder/base64` — Base64 Encoder loads
- `/converters/encoder/url` — URL Encoder loads

- [ ] **Step 6: Test PDF tools**

- `/pdf/merge` — PDF Merge loads
- `/pdf/split` — PDF Split loads
- `/pdf/image-to-pdf` — Image to PDF loads

- [ ] **Step 7: Test navigation**

- Sidebar: click tools, verify URL changes and content loads
- Mobile nav: test on mobile viewport
- Browser back/forward: navigate between tools, use back button
- Direct URL: paste `/design/shapemaker` into browser — loads directly

- [ ] **Step 8: Test 404**

Navigate to `/nonexistent` — 404 page loads with home link.

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 10: Commit final state**

```bash
git add -A
git commit -m "feat(routing): complete URL routing refactor — all tools accessible via direct URLs"
```
