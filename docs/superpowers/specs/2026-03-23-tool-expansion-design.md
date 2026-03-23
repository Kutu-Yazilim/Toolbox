# Kutu Tree — Tool Expansion Design

## Overview

Expand kutu-tree from 39 registry entries (7 categories) to 74 tools across 10 categories. The goal is to make kutu-tree a comprehensive toolbox for developers and creative professionals — "the only website you ever need."

**Target audiences:** Developers & technical users (primary), creative professionals (primary), general users (secondary).

**Architecture approach:** Flat expansion — each tool follows the existing component/registry/router pattern. No refactoring.

**Backend policy:** Client-side first. A small backend is acceptable for high-value tools that can't work without it (SSL checker, HTTP headers inspector). No backend exists yet — one will need to be created (e.g., Cloudflare Worker or small Node/Deno service).

**Implementation order:** Quick wins → Flagship new category (Data Tools) → Category completers.

---

## Architecture & Patterns

Every new tool follows the existing structure:

- **Component:** `src/components/<ToolName>/<ToolName>.tsx` (+ sub-components in same directory)
- **Utils:** `src/utils/<toolName>Utils.ts` when logic is non-trivial
- **Types:** `src/types/<toolName>.ts` when types are shared
- **Registry:** Entry in `src/config/toolRegistry.ts` with id, label, description, icon, path
- **Routing:** Lazy-loaded in `src/router.tsx` under its category layout

**New category layouts:**
- `src/layouts/DataToolsLayout.tsx`
- `src/layouts/SecurityLayout.tsx`
- `src/layouts/ImageToolsLayout.tsx`

**New dependencies (only when required):**
| Dependency | Tool | Size | Justification |
|---|---|---|---|
| `sql.js` | SQL Playground | ~1MB WASM | No client-side alternative for SQL on arbitrary data |
| `recharts` | Chart Builder | ~200KB | React-native charting library; fits the existing React architecture without imperative wrappers |
| `@faker-js/faker` | Fake Data Generator | ~500KB tree-shaken | Comprehensive locale-aware fake data |
| `asn1js` (or similar) | Certificate Decoder | ~50KB | ASN.1 parsing for X.509 certificates |

All other tools use browser-native APIs (Web Crypto, Canvas, File API) or existing dependencies (Monaco, html-to-image, qr-code-styling, Lucide).

---

## Batch 1: Quick Wins (~10 tools)

Simple, stateless tools that can each be built independently.

### Generators (deepening existing category)

**UUID Generator**
- Generate UUID v1, v4, v7
- Bulk generate 1–100 at once
- Format options: uppercase/lowercase, with/without hyphens
- Copy individual or all

**Lorem Ipsum Generator**
- Modes: paragraphs, sentences, words
- Configurable count
- Copy to clipboard

**Fake Data Generator**
- Generate names, emails, phone numbers, addresses, dates
- Custom JSON template builder — define a schema, generate N records
- Dependency: `@faker-js/faker` (tree-shaken, lazy-loaded)

**Hash Generator**
- Input text → MD5, SHA-1, SHA-256, SHA-512 output simultaneously
- File hash support via drag-and-drop
- Uses Web Crypto API (zero dependencies)

**Slug Generator**
- Text input → URL-friendly slug
- Configurable separator (- or _)
- Transliteration for non-Latin characters (Turkish, German, etc.)

### Converters (deepening existing category)

**Number Base Converter**
- Input in any base: binary, octal, decimal, hexadecimal
- Live conversion across all bases simultaneously
- Support for large numbers (BigInt)
- Bit-level visualization for binary

**Unit Converter**
- Categories: length, weight, temperature, data size, time, speed
- Searchable unit list
- Two-way conversion with swap button

**Color Format Converter**
- HEX, RGB, HSL, HSB, CMYK
- Live preview color swatch
- Copy each format individually

### Security (new category — first tool)

**Password Generator**
- Length slider (4–128)
- Character set toggles: uppercase, lowercase, numbers, symbols
- Exclude ambiguous characters option (0/O, l/1/I)
- Visual strength meter
- Bulk generate mode
- Passphrase mode: word-based passwords (e.g., "correct-horse-battery-staple")

### Dev Tools (deepening existing category)

**Chmod Calculator**
- Toggle read/write/execute for owner/group/other via checkboxes
- Live display of numeric (755) and symbolic (rwxr-xr-x) representation
- Common presets (644, 755, 777, etc.)

---

## Batch 2: Data Tools (New Flagship Category — 5 tools)

More complex tools, some sharing infrastructure. This batch establishes a new category.

**CSV Viewer/Editor**
- Drag-and-drop or paste CSV/TSV data
- Spreadsheet-like table UI: sortable columns, inline cell editing
- Add/remove rows and columns
- Auto-detect delimiter (comma, tab, semicolon, pipe)
- Export as CSV, JSON, or copy to clipboard

**JSON Path Finder**
- Paste JSON on the left panel, interactive tree view on the right
- Click any node → shows its JSONPath and jq-style path
- Query input: type a JSONPath expression → highlights matching nodes, shows extracted results
- Supports both JSONPath and jq-style syntax

**Data Transformer** *(highest complexity in this batch — plan accordingly)*
- Input: paste or upload JSON/CSV
- Visual pipeline builder: each transformation step is a configurable block
- Available transforms: filter rows, map fields, sort, group by, deduplicate, rename columns, add computed fields
- Live preview of output after each step
- Export result as JSON/CSV

**SQL Playground**
- Upload CSV or JSON → auto-creates in-memory SQLite table via `sql.js` (WASM)
- Monaco editor for SQL queries
- Results rendered as sortable table
- Multiple tables supported (upload multiple files)
- Export query results as CSV/JSON
- Dependency: `sql.js` (~1MB WASM, lazy-loaded)

**Chart Builder**
- Input: paste CSV/JSON data
- Chart types: bar, line, pie, scatter, area
- Configure axes, labels, colors, title
- Live preview
- Export as PNG/SVG
- Dependency: `recharts` (React-native, lazy-loaded)

---

## Batch 3: Category Completers

Deepen weaker existing categories and fill out the new ones.

### Design (deepening — 3 tools)

**Gradient Generator**
- Gradient types: linear, radial, conic
- Visual angle/position control
- Color stop editor with add/remove/drag
- Live preview
- Export as CSS code AND Flutter/Dart `LinearGradient`/`RadialGradient` code
- Preset gallery for quick starting points

**Box Shadow Generator**
- Multiple shadow layers
- Per-layer controls: X offset, Y offset, blur, spread, color, inset toggle
- Live preview on a sample card element
- Export as CSS and Flutter `BoxShadow`

**SVG Icon Editor**
- Browse bundled Lucide icon set (already a dependency)
- Customize: size, color, stroke width
- Export as SVG or PNG
- Copy as React component or Flutter widget code

### Network (deepening — 2 tools)

**SSL Certificate Checker**
- Input: domain name
- Output: certificate chain, issuer, expiry date, Subject Alternative Names, validity status
- Requires backend API call (TLS handshake not possible from browser)

**HTTP Headers Inspector**
- Input: URL
- Output: full response headers
- Highlights security headers (CORS, CSP, HSTS, X-Frame-Options)
- Flags missing recommended headers
- Requires backend API call (CORS restrictions)

### Dev Tools (deepening — 3 tools)

**.env Editor**
- Paste or upload .env files
- Table view: key/value columns with inline editing
- Compare two .env files side-by-side with diff highlighting
- Mask values by default (click to reveal)
- Export back to .env format

**Git Command Builder**
- Pick operation: commit, branch, merge, rebase, reset, stash, cherry-pick, etc.
- Configure flags via toggles and dropdowns
- Assembled command shown live
- Copy to clipboard
- Common recipes/presets section

**Code Screenshot**
- Paste code or pick language for syntax highlighting
- Monaco editor for input
- Themed preview: dark/light/custom gradient backgrounds
- Controls: padding, border-radius, font size, window chrome toggle
- Export as PNG or SVG
- Uses `html-to-image` (already a dependency)

### Security (completing new category — 4 tools)

**Encryption Tool**
- AES-256-GCM encrypt/decrypt text with a passphrase
- Uses Web Crypto API (zero dependencies)
- Clear disclaimer: educational/convenience use, not production security

**Certificate Decoder**
- Paste PEM or DER certificate
- Parsed output: subject, issuer, validity dates, extensions, fingerprint, key usage
- Client-side via ASN.1 parsing library
- Dependency: `asn1js` or similar (~50KB)

**TOTP Generator**
- Input: secret key (base32)
- Shows rotating 6-digit code with countdown timer
- QR code for importing into authenticator apps (uses existing `qr-code-styling`)
- Configurable: period (30s/60s), digits (6/8), algorithm (SHA-1/SHA-256)

**CSP Header Builder**
- Visual builder for Content-Security-Policy headers
- Toggle directives: default-src, script-src, style-src, img-src, etc.
- Add sources per directive (self, unsafe-inline, nonces, domains)
- Preview full header string
- Validate against common mistakes

### Image Tools (new category — 8 tools)

**Image Resizer**
- Upload image via drag-and-drop or file picker
- Set width/height with aspect ratio lock toggle
- Percentage or pixel mode
- Preview before/after
- Export via Canvas API

**Image Cropper**
- Upload image
- Drag-to-crop selection box
- Preset aspect ratios: 1:1, 16:9, 4:3, 3:2, free
- Preview and export

**Image Compressor**
- Upload image (JPEG/PNG/WebP)
- Quality slider with live file size estimate
- Before/after size comparison
- Export via Canvas API

**Format Converter**
- Upload image
- Pick target format: PNG, JPG, WebP, AVIF
- Convert client-side via Canvas API
- Download converted file

**Color Picker from Image**
- Upload image
- Hover/click to pick colors with magnifier
- Shows HEX/RGB/HSL for picked color
- Recent picks history with copy support

**Placeholder Image**
- Configure: width, height, background color, text, text color, font size
- Live preview
- Download as PNG or copy as data URI

**Image to Base64**
- Upload image
- Shows base64 string with data URI prefix
- Copy to clipboard
- Preview alongside the encoded string

**Favicon Generator**
- Upload source image (ideally square)
- Generates all standard sizes: 16x16, 32x32, 48x48, 180x180 (Apple touch), 192x192, 512x512
- Download as ZIP containing all sizes (uses existing `jszip` dependency)
- Provides ready-to-copy HTML `<link>` tags

---

## New Dependencies Summary

| Dependency | Tool | Lazy-loaded | Estimated Size |
|---|---|---|---|
| `@faker-js/faker` | Fake Data Generator | Yes | ~500KB (tree-shaken) |
| `sql.js` | SQL Playground | Yes (WASM) | ~1MB |
| `recharts` | Chart Builder | Yes | ~200KB |
| `asn1js` | Certificate Decoder | Yes | ~50KB |

All other tools use browser-native APIs or existing project dependencies.

---

## Tools Requiring Backend

Only 2 tools need server-side support:

1. **SSL Certificate Checker** — needs to perform TLS handshake
2. **HTTP Headers Inspector** — needs to make arbitrary HTTP requests (CORS)

A minimal backend (e.g., a small Node/Deno edge function or Cloudflare Worker) with two endpoints would suffice:
- `GET /api/ssl-check?domain=example.com`
- `GET /api/headers?url=https://example.com`

---

## Category Registry Updates

New categories to add to `toolRegistry.ts`:

```typescript
{ id: 'data-tools', label: 'Data Tools', icon: Database, path: '/data-tools' }
{ id: 'security', label: 'Security', icon: Shield, path: '/security' }
{ id: 'image-tools', label: 'Image Tools', icon: Image, path: '/image-tools' }
```

---

## Total Tool Count

| Category | Existing | New | Total |
|---|---|---|---|
| Dev Tools | 11 | 4 | 15 |
| Converters | 4 | 3 | 7 |
| Generators | 2 | 5 | 7 |
| Design | 5 | 3 | 8 |
| Network | 2 | 2 | 4 |
| PDF | 13 | 0 | 13 |
| Fun | 2 | 0 | 2 |
| Data Tools | 0 | 5 | 5 |
| Security | 0 | 5 | 5 |
| Image Tools | 0 | 8 | 8 |
| **Total** | **39** | **35** | **74** |

*Note: Some existing tools have sub-routes (JSON Editor/Diff, JWT Decode/Forge, etc.) bringing the effective tool count higher.*
