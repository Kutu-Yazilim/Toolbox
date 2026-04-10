# Tool Overhaul Design Spec

**Date:** 2026-04-10
**Scope:** Full modernization of the 6 oldest tools — shared infrastructure + individual tool upgrades
**Approach:** Infrastructure first (Phase 1), then tool overhauls (Phase 2)

---

## Phase 1: Shared Infrastructure

Build reusable hooks and components that all 6 tools (and future tools) will use.

### 1.1 `useLocalStorage<T>` Hook

Drop-in replacement for `useState` that syncs with localStorage.

```ts
const [value, setValue] = useLocalStorage<TreeOptions>("kutu-tree-generator", defaultOptions)
```

- Generic typed hook with JSON serialization/deserialization
- Falls back to `defaultValue` on parse error or missing key
- SSR-safe: returns `defaultValue` during server render, hydrates from localStorage on mount
- All tools use namespaced keys prefixed with `kutu-` (e.g. `kutu-tree-generator`, `kutu-json-editor`)
- Writes to localStorage synchronously on every `setValue` call (no debounce — state is small enough that debounce adds complexity without benefit)
- Extracted from the inline pattern in `WheelOfFate` component

**Location:** `src/hooks/useLocalStorage.ts`

### 1.2 `useShareableUrl` Hook

Hash-based state encoding using `lz-string` compression for shareable URLs.

```ts
const { shareUrl, loadFromUrl, hasUrlState } = useShareableUrl<State>("tree", { input, options })
```

- Compresses full tool state (input + options) via `lz-string` → base64 → URL hash
- On mount, checks URL hash first. If present, restores state from hash (takes priority over localStorage)
- If no hash, falls back to localStorage
- `shareUrl()` generates the URL and copies to clipboard with toast feedback
- URL format: `https://kutu.tools/dev/tree#s=<compressed-state>`

**Location:** `src/hooks/useShareableUrl.ts`
**Dependency:** `lz-string` (add to package.json)

### 1.3 `useFileImport` Hook

Drag-and-drop + file picker for loading content into any tool.

```ts
const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
  accept: [".json", ".txt", ".dbml"],
  maxSize: 5 * 1024 * 1024, // 5MB
  onImport: (content: string, filename: string) => setInput(content),
})
```

- Returns props to spread on the drop target container (`onDragOver`, `onDrop`, etc.)
- `isDragging` boolean for visual drop indicator (border highlight)
- Validates file type and size before reading
- Reads as text by default, with option for binary (ArrayBuffer) for file-based Base64

**Location:** `src/hooks/useFileImport.ts`

### 1.4 `useKeyboardShortcuts` Hook + `ShortcutsSheet` Component

Register tool-specific keyboard shortcuts with a discoverable cheat sheet.

```ts
useKeyboardShortcuts([
  { key: "mod+s", label: "Format", action: handleFormat },
  { key: "mod+shift+c", label: "Copy output", action: handleCopy },
])
```

- `mod` resolves to `Cmd` on macOS, `Ctrl` on others
- Prevents default browser behavior for registered shortcuts
- `ShortcutsSheet` — a dialog triggered by `?` key showing all registered shortcuts for the current tool
- Common shortcuts (copy, download, share) are auto-registered by `ToolToolbar`

**Location:** `src/hooks/useKeyboardShortcuts.ts`, `src/components/shared/ShortcutsSheet.tsx`

### 1.5 `useAutoDetect` Hook

Sniffs pasted/imported content and identifies the format.

```ts
const detected = useAutoDetect(input)
// → { type: "json", confidence: 0.95 }
// → { type: "base64", confidence: 0.80 }
// → { type: "url-encoded", confidence: 0.70 }
```

- Detection strategies: JSON (try parse), Base64 (charset + padding check), URL-encoded (% patterns), DBML (keyword scan), timestamp (digit patterns), regex (slash-delimited)
- Returns `type` and `confidence` (0-1)
- Used by encoder tool for auto-mode and by tools to suggest format on paste

**Location:** `src/hooks/useAutoDetect.ts`

### 1.6 `ToolToolbar` Component

Standardized toolbar replacing per-tool toolbar boilerplate.

```tsx
<ToolToolbar
  title="JSON"
  status={{ type: "success", label: "Valid" }}
  actions={[
    { icon: WrapTextIcon, label: "Format", onClick: handleFormat, shortcut: "mod+s" },
    { icon: MinimizeIcon, label: "Minify", onClick: handleMinify },
  ]}
  presets={jsonPresets}
  onShare={() => shareUrl()}
  onExport={exportOptions}
/>
```

- Renders the `h-9 border-b` toolbar bar (preserving existing visual pattern)
- Built-in buttons: Copy, Download, Share, Shortcuts (`?`), Presets
- Tool passes its specific actions, status indicator, and export options
- Auto-registers keyboard shortcuts for all actions that have `shortcut` defined

**Location:** `src/components/shared/ToolToolbar.tsx`

### 1.7 `ExportMenu` Component

Dropdown menu for multi-format export.

```tsx
<ExportMenu options={[
  { label: "Copy to clipboard", action: handleCopy },
  { label: "Download .json", action: () => handleDownload("json") },
  { label: "Export as PNG", action: handleExportPng },
  { label: "Export as SVG", action: handleExportSvg },
]} />
```

- Renders as a dropdown triggered from `ToolToolbar`
- Each option has label, icon (optional), and action callback
- Grouped by type: clipboard, file download, image export

**Location:** `src/components/shared/ExportMenu.tsx`

### 1.8 `PresetsDrawer` Component

Slide-out drawer with categorized presets/templates.

```tsx
<PresetsDrawer
  presets={[
    { name: "Flutter Project", category: "Mobile", content: "..." },
    { name: "React App", category: "Frontend", content: "..." },
    { name: "REST API", category: "Backend", content: "..." },
  ]}
  onSelect={(preset) => setInput(preset.content)}
/>
```

- Triggered by Presets button in `ToolToolbar`
- Grouped by category with search/filter
- Each preset shows name, category badge, and a brief description
- On select: loads content into the tool and closes the drawer

**Location:** `src/components/shared/PresetsDrawer.tsx`

---

## Phase 2: Tool Overhauls

Each tool gets modernized using the shared infrastructure from Phase 1.

### 2.1 Tree Generator

**Current:** 154-line component with plain `<textarea>` input, text-only output, single example.

**Overhaul:**

- **Input:** Replace `<textarea>` with Monaco Editor with indent guides and line numbers
- **Output tabs:**
  - **Text tab:** Current ASCII/Unicode tree output (default)
  - **Visual tab:** Collapsible interactive tree view with folder/file icons
- **Presets:** 6+ templates — Flutter, React (CRA), Next.js, Node.js API, Python Package, Go Module
- **Export:** TXT (current), PNG (via html-to-image), SVG, Markdown (fenced code block)
- **File import:** Drag-drop `.txt` files or paste indented text
- **New options:** Icon mode toggle (show file/folder icons in output), comment support (lines starting with `//` or `#` are excluded from output)
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useFileImport`, `useKeyboardShortcuts`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/tree/TreeCreator.tsx` — rewrite with shared infra
- `src/components/tree/TreeOptions.tsx` — keep, extend with icon mode + comment toggle
- `src/components/tree/VisualTreeView.tsx` — new: collapsible interactive tree
- `src/utils/treeGenerator.ts` — keep, extend with Markdown output format
- `src/components/tree/treePresets.ts` — new: preset definitions

### 2.2 DB Model (DBML Editor)

**Current:** 263-line component with hardcoded `vs-dark` Monaco theme, DBML-only export, basic ER diagram.

**Overhaul:**

- **Monaco theme:** Theme-aware — follows system light/dark via `useTheme()`. Register custom DBML language for syntax highlighting (keywords: `Table`, `Ref`, `Enum`, column types, constraints)
- **SQL export:** Generate SQL DDL from parsed DBML for PostgreSQL, MySQL, SQLite dialects (using `@dbml/core` export capabilities)
- **SQL import:** Parse SQL DDL and convert to DBML for editing (reverse engineering)
- **ER diagram enhancements:**
  - Zoom controls (zoom in/out/fit buttons + mouse wheel)
  - Auto-layout algorithm (arrange tables to minimize edge crossings)
  - Table nodes show column types, PK/FK indicators, and constraint badges
- **Presets:** 4+ templates — E-commerce (users, products, orders, reviews), Blog (users, posts, comments, tags), SaaS (tenants, users, plans, subscriptions), Auth (users, roles, permissions, sessions)
- **Export:** DBML file, SQL (multi-dialect), PNG (existing, enhanced)
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useFileImport`, `useKeyboardShortcuts`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/db/DbModelling.tsx` — rewrite with shared infra + theme-aware Monaco
- `src/components/db/ErDiagram.tsx` — enhance with zoom/fit/layout controls
- `src/components/db/dbPresets.ts` — new: preset schema definitions
- `src/components/db/dbmlLanguage.ts` — new: Monaco language definition for DBML
- `src/utils/sqlExporter.ts` — new: DBML → SQL DDL conversion
- `src/utils/sqlImporter.ts` — new: SQL DDL → DBML conversion

### 2.3 JSON Editor

**Current:** 201-line component with single Monaco panel, format/minify only.

**Overhaul:**

- **Two-panel layout:** Monaco editor (left) + interactive tree view (right)
- **Tree view:** Collapsible nodes with type indicators (string, number, boolean, null, array, object). Click a node to highlight it in the editor and show its JSONPath in the status bar
- **JSONPath status bar:** Bottom bar showing `$.users[0].name` for the selected node, plus stats (depth, total keys, byte size)
- **Transforms:** Sort keys (alphabetical), remove null values, flatten nested objects, fix trailing commas (auto-repair)
- **Search/filter:** Search within JSON by key name or value. Filter view shows only matching paths
- **Presets:** Common JSON structures — API Response, package.json, tsconfig.json, OpenAPI stub
- **Export:** JSON (formatted), JSON (minified), YAML conversion, TypeScript interface generation
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useFileImport`, `useKeyboardShortcuts`, `useAutoDetect`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/json/JsonEditor.tsx` — rewrite with two-panel layout
- `src/components/json/JsonTreeView.tsx` — new: interactive collapsible tree
- `src/components/json/JsonStatusBar.tsx` — new: path + stats bar
- `src/components/json/jsonPresets.ts` — new: preset definitions
- `src/utils/jsonTransforms.ts` — new: sort keys, remove nulls, flatten, fix trailing commas

### 2.4 Regex Playground

**Current:** 309-line component with textarea overlay for highlighting, basic match list, presets dropdown.

**Overhaul:**

- **Pattern input:** Keep the `/pattern/flags` bar, add a replace input field below it (toggleable)
- **Test string:** Replace the textarea+overlay approach with Monaco Editor for proper scrolling and performance. Match highlighting via Monaco decorations
- **Results panel tabs:**
  - **Matches:** Current match list, enhanced with color-coded capture group values
  - **Groups:** Table view of all capture groups across matches (columns: match #, group name/index, value)
  - **Explain:** Human-readable regex breakdown — tokenizes the pattern and maps each token to plain English (e.g. `[a-zA-Z]` → "Any letter, upper or lowercase", `+` → "One or more of the preceding", `(?:...)` → "Non-capturing group"). Built as a recursive descent over the regex AST, not a third-party library
- **Replace mode:** Live preview of replacement with `$1`/`$2`/`$&` substitution. Show before/after
- **Code generation:** Generate regex usage snippets for JavaScript, Python, Go, Dart
- **Capture group colors:** Each group gets a distinct color in both the test string highlighting and the results panel
- **Presets:** Expand from 7 to 12+ patterns — add: JWT token, ISO date, semantic version, CSS selector, markdown link, HTML tag
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useFileImport`, `useKeyboardShortcuts`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/regex/RegexPlayground.tsx` — rewrite with Monaco + tabs
- `src/components/regex/RegexExplainer.tsx` — new: human-readable breakdown
- `src/components/regex/RegexCodeGen.tsx` — new: multi-language code snippets
- `src/components/regex/GroupsTable.tsx` — new: tabular capture group view
- `src/components/regex/regexPresets.ts` — new: expanded preset definitions

### 2.5 Base64 / Encoder-Decoder

**Current:** Two separate tools (Base64Encoder 114 lines, UrlEncoder). Manual encode/decode buttons, no auto-detection.

**Overhaul:**

- **Unified encoder:** Merge Base64 and URL encoder into a single tool with encoding mode tabs: Base64, URL, HTML Entity, JWT Decode
- **Auto-detect:** On paste, detect input format and suggest the right decode mode (via `useAutoDetect`)
- **Live encode toggle:** Option to encode/decode automatically as the user types (toggleable, default off)
- **Info panel (right sidebar):**
  - Input/output byte size and ratio
  - Encoding details (charset, padding characters)
  - Quick action buttons: URL-safe Base64, strip padding, hex view
- **File support:** Drag-drop files for binary Base64 encoding (images, PDFs, etc.)
- **Swap button:** Keep existing swap (input ↔ output) functionality
- **Monaco:** Replace textareas with Monaco for both input and output
- **Presets:** Common encode/decode scenarios — JWT token, Data URI, Basic Auth header, URL query string
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useFileImport`, `useKeyboardShortcuts`, `useAutoDetect`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/encoder/EncoderDecoder.tsx` — new: unified encoder component (replaces Base64Encoder + UrlEncoder)
- `src/components/encoder/EncoderInfoPanel.tsx` — new: size/ratio/encoding details
- `src/components/encoder/encoderPresets.ts` — new: preset definitions
- `src/utils/encoderUtils.ts` — extend with HTML entity, JWT decode, URL-safe Base64

### 2.6 Timestamp Converter

**Current:** 275-line component with text input, quick offset buttons, flat format list. Already the most polished of the six.

**Overhaul:**

- **Date picker:** Add a visual date/time picker alongside the text input (click calendar icon to open)
- **Duration calculator:** New panel — enter two timestamps (T1, T2) and see the duration between them in years, months, days, hours, minutes, seconds
- **Multi-timezone comparison:** Panel showing the selected timestamp across multiple timezones simultaneously. User can pin/unpin timezones. Highlight next-day indicators (e.g. `+1d`)
- **Expanded quick offsets:** Add "Start of day", "End of day", "Start of month", "End of month", "Start of year"
- **Additional output formats:** RFC 2822, custom format string (user-defined strftime-like pattern), cron-friendly format
- **Copy on click:** Click any format row to copy its value (replacing the hover-only copy button)
- **Presets:** Common timestamp scenarios — Y2K38 limit, Unix epoch, GPS epoch, Windows file time
- **Shared infra:** `useLocalStorage`, `useShareableUrl`, `useKeyboardShortcuts`, `ToolToolbar`, `ExportMenu`, `PresetsDrawer`

**Files:**
- `src/components/timestamp/TimestampConverter.tsx` — rewrite with shared infra + new panels
- `src/components/timestamp/DurationCalculator.tsx` — new: T1 → T2 diff panel
- `src/components/timestamp/TimezoneCompare.tsx` — new: multi-tz panel
- `src/components/timestamp/DatePickerPopover.tsx` — new: calendar date/time picker
- `src/components/timestamp/timestampPresets.ts` — new: preset definitions

---

## Data Flow

### State Priority on Load

```
URL hash → localStorage → default state
```

1. If URL has `#s=<compressed>`: decompress and use as state (shareable link opened)
2. Else if localStorage has `kutu-<tool>`: deserialize and use as state (returning user)
3. Else: use tool's default state (first visit)

### State Persistence

- Every state change writes to localStorage (debounced, 300ms)
- "Share" button compresses current state into URL hash and copies to clipboard
- No backend, no accounts — fully client-side

---

## File Structure (New/Changed)

```
src/
├── hooks/
│   ├── useLocalStorage.ts          (new)
│   ├── useShareableUrl.ts          (new)
│   ├── useFileImport.ts            (new)
│   ├── useKeyboardShortcuts.ts     (new)
│   └── useAutoDetect.ts            (new)
├── components/
│   ├── shared/
│   │   ├── ToolToolbar.tsx          (new)
│   │   ├── ExportMenu.tsx           (new)
│   │   ├── PresetsDrawer.tsx        (new)
│   │   └── ShortcutsSheet.tsx       (new)
│   ├── tree/
│   │   ├── TreeCreator.tsx          (rewrite)
│   │   ├── TreeOptions.tsx          (extend)
│   │   ├── VisualTreeView.tsx       (new)
│   │   └── treePresets.ts           (new)
│   ├── db/
│   │   ├── DbModelling.tsx          (rewrite)
│   │   ├── ErDiagram.tsx            (enhance)
│   │   ├── dbPresets.ts             (new)
│   │   └── dbmlLanguage.ts          (new)
│   ├── json/
│   │   ├── JsonEditor.tsx           (rewrite)
│   │   ├── JsonTreeView.tsx         (new)
│   │   ├── JsonStatusBar.tsx        (new)
│   │   └── jsonPresets.ts           (new)
│   ├── regex/
│   │   ├── RegexPlayground.tsx      (rewrite)
│   │   ├── RegexExplainer.tsx       (new)
│   │   ├── RegexCodeGen.tsx         (new)
│   │   ├── GroupsTable.tsx          (new)
│   │   └── regexPresets.ts          (new)
│   ├── encoder/
│   │   ├── EncoderDecoder.tsx       (new, replaces Base64Encoder + UrlEncoder)
│   │   ├── EncoderInfoPanel.tsx     (new)
│   │   └── encoderPresets.ts        (new)
│   └── timestamp/
│       ├── TimestampConverter.tsx    (rewrite)
│       ├── DurationCalculator.tsx   (new)
│       ├── TimezoneCompare.tsx      (new)
│       ├── DatePickerPopover.tsx     (new)
│       └── timestampPresets.ts      (new)
└── utils/
    ├── jsonTransforms.ts            (new)
    ├── sqlExporter.ts               (new)
    └── sqlImporter.ts               (new)
```

---

## Dependencies

**New packages to add:**
- `lz-string` — URL state compression for shareable links

**Existing packages leveraged:**
- `@monaco-editor/react` — already used, extend to Tree Generator and Regex test string
- `@dbml/core` — already used, leverage SQL export capabilities
- `html-to-image` — already used, leverage for PNG export in Tree and JSON tools
- `lucide-react` — already used for icons

---

## Testing Strategy

- **Shared hooks:** Unit tests for `useLocalStorage`, `useShareableUrl`, `useAutoDetect` (pure logic, no DOM)
- **Tool components:** Manual smoke testing per tool — verify localStorage persistence, share URL round-trip, file import, keyboard shortcuts, all export formats
- **Cross-browser:** Verify localStorage and URL hash behavior in Chrome, Firefox, Safari

---

## Migration Notes

- **Encoder merge:** The two separate tools (Base64Encoder, UrlEncoder) become one unified EncoderDecoder. Update `toolRegistry.ts` to point both the base64 and URL encoder entries to the new `EncoderDecoder` component. The URL encoder route should pass a prop or URL param to pre-select the URL tab. Old component files (`Base64Encoder.tsx`, `UrlEncoder.tsx`) are deleted after migration
- **No breaking URLs:** Existing tool routes (`/dev/tree`, `/dev/db-model`, etc.) remain unchanged
- **Incremental rollout:** Each tool can be deployed independently since they share infrastructure but don't depend on each other
