# Dev Tools Batch 1: New Tool Additions

**Date:** 2026-03-16
**Scope:** Add 6 new developer utility tools to the kutu-tree toolbox

## Tools

1. YAML ↔ JSON Converter
2. SQL Formatter
3. Text Diff
4. JSON → Types Generator
5. Cron Expression Builder
6. HTTP Status Codes Reference

## Shared Patterns

All tools follow the established codebase conventions:

- **Editor:** Monaco Editor (`@monaco-editor/react`) for code input/output
- **Simple text:** Native `<textarea>` with Tailwind + monospace font
- **UI:** shadcn/ui Button (ghost variant, xs size) for toolbar actions
- **Icons:** Lucide React
- **Copy:** `navigator.clipboard.writeText()` with 2-second `CopyIcon → CheckIcon` feedback
- **Errors:** Absolute-positioned overlay at bottom of editor with `bg-destructive/15 backdrop-blur-sm`
- **Layout:** `h-full flex flex-col min-h-0`, two-panel splits use `gap-px bg-border` with `md:flex-row` responsive
- **Toolbar:** `h-9 flex items-center justify-between px-3 border-b border-border flex-shrink-0`
- **Mobile:** Stacked vertical on mobile, side-by-side on desktop via `useIsMobile` hook
- **Lazy loading:** `React.lazy()` in router, `Suspense` in `RootLayout`

Each tool gets:
- A component file in `src/components/<tool>/`
- A lazy import + route in `src/router.tsx`
- A registry entry in `src/config/toolRegistry.ts`

## Tool 1: YAML ↔ JSON Converter

**Route:** `/converters/yaml-json`
**Category:** Converters
**File:** `src/components/yaml/YamlJsonConverter.tsx`

### UI

Two side-by-side Monaco Editor panes — YAML (left) and JSON (right). Editing either side auto-converts to the other in real-time.

### Features

- Bidirectional live conversion — type YAML → see JSON, type JSON → see YAML
- Syntax highlighting for both languages (Monaco built-in)
- Inline error display when input is invalid
- Copy-to-clipboard button on each pane's toolbar
- Clear button per pane
- JSON indent toggle: 2 or 4 spaces

### Conversion Direction

Track which side the user is editing via `onChange` handlers. The edited side is the "source", the other is the "target". Avoid infinite loops by only updating the target when the source changes.

### Dependencies

- `yaml` (npm) — parse YAML to JS object and stringify JS object to YAML. Lightweight, no server needed.

### Error Handling

If YAML is invalid, show error below the YAML pane. JSON pane keeps last valid output. Vice versa for invalid JSON.

---

## Tool 2: SQL Formatter

**Route:** `/dev-tools/sql-formatter`
**Category:** Dev Tools
**File:** `src/components/sql/SqlFormatter.tsx`

### UI

Single Monaco Editor pane with a toolbar. User pastes SQL, clicks Format or Minify.

### Features

- **Format:** Prettify SQL with proper indentation and newlines
- **Minify:** Compress to single line
- **Syntax highlighting:** Monaco SQL language mode
- **Dialect selector:** Standard SQL, PostgreSQL, MySQL, SQLite, T-SQL, PL/SQL
- Copy-to-clipboard
- Clear button

### Dependencies

- `sql-formatter` (npm) — supports multiple SQL dialects, format and minify. Well-maintained, 4M+ weekly downloads.

### Behavior

- Format/Minify buttons in the toolbar
- Dialect dropdown in the toolbar (default: Standard SQL)
- Formatting applies in-place (replaces editor content)
- Indent size: 2 spaces (consistent with codebase)

---

## Tool 3: Text Diff

**Route:** `/dev-tools/text-diff`
**Category:** Dev Tools
**File:** `src/components/textdiff/TextDiff.tsx`

### UI

Two input textareas (Original / Modified) at top, diff output below. Toggle between side-by-side and inline (unified) view.

### Features

- **Side-by-side view:** Two panes with highlighted additions/deletions (using Monaco DiffEditor)
- **Inline/unified view:** Single pane with `+`/`-` lines (like `git diff`)
- Toggle button to switch between views
- Character-level diff highlighting within changed lines
- Line numbers

### Implementation

- **Side-by-side:** Use Monaco `DiffEditor` component (same as `JsonDiff.tsx`)
- **Inline view:** Use `diff` npm package to compute unified diff, render with custom styled `<pre>` block
- Default language: `plaintext` in Monaco

### Dependencies

- `diff` (npm) — for computing unified/inline diffs. Monaco handles side-by-side natively.

### Behavior

- User types/pastes into Original and Modified panes
- Diff updates live as user types
- Side-by-side is default on desktop, inline on mobile
- Responsive: on mobile, `renderSideBySide: false` in Monaco DiffEditor (same pattern as JsonDiff)

---

## Tool 4: JSON → Types Generator

**Route:** `/dev-tools/json-to-types`
**Category:** Dev Tools
**File:** `src/components/jsontypes/JsonToTypes.tsx`

### UI

Left pane: Monaco Editor (JSON input). Right pane: Monaco Editor (generated types output, read-only). Language selector in the right pane's toolbar.

### Target Languages

- TypeScript (interfaces)
- Dart (classes with `fromJson`/`toJson`)
- C# (classes with `JsonProperty` attributes)
- Python (dataclasses with type hints)
- Java (POJOs with getters/setters)

### Features

- Live conversion as JSON is typed
- Language selector dropdown in output toolbar
- Root type name input field (default: `Root`)
- Copy generated code to clipboard
- Syntax highlighting for output language (Monaco auto-detects from language mode)

### Type Inference Rules

- JSON `string` → `string` / `String` / `str` etc.
- JSON `number` → `number` / `double` / `int` (integer detection: if all values of a key are whole numbers, use `int`; otherwise `double`/`float`)
- JSON `boolean` → `boolean` / `bool` / `Boolean`
- JSON `null` → nullable/optional type
- JSON `array` → typed array based on element types; mixed types → union/dynamic
- JSON `object` → nested type/class
- Duplicate object shapes → reuse same type name

### Implementation

Custom code generators per language — no heavy external dependency needed. Each generator is a pure function: `(json: unknown, rootName: string) => string`.

### File Structure

- `src/components/jsontypes/JsonToTypes.tsx` — main component
- `src/utils/jsonToTypes.ts` — shared type inference logic
- `src/utils/jsonToTs.ts` — TypeScript generator
- `src/utils/jsonToDart.ts` — Dart generator
- `src/utils/jsonToCsharp.ts` — C# generator
- `src/utils/jsonToPython.ts` — Python generator
- `src/utils/jsonToJava.ts` — Java generator

---

## Tool 5: Cron Expression Builder

**Route:** `/dev-tools/cron`
**Category:** Dev Tools
**File:** `src/components/cron/CronBuilder.tsx`

### UI

Top section: 5 field inputs (minute, hour, day of month, month, day of week) with dropdowns/multi-selects. Below: the generated cron expression in a text field (also editable — bidirectional). Bottom: human-readable description + next 5 run times.

### Features

- **Visual builder:** Dropdowns/checkboxes for each field
  - Minute: 0-59, with "every N minutes" shortcut
  - Hour: 0-23, with "every N hours" shortcut
  - Day of month: 1-31
  - Month: Jan-Dec (1-12)
  - Day of week: Sun-Sat (0-6)
- **Raw expression input:** Text field showing the cron string, editable — changes update the visual builder
- **Human-readable description:** e.g., "Every 15 minutes, Monday through Friday"
- **Next runs:** Show next 5 execution times based on current time
- **Presets dropdown:** Common patterns (every minute, hourly, daily at midnight, weekly, monthly, etc.)
- Standard 5-field cron only (no seconds)

### Dependencies

- `cronstrue` (npm) — converts cron expression to human-readable string
- `cron-parser` (npm) — parses cron expressions and computes next run times

### Behavior

- Bidirectional: editing visual builder updates the expression string, editing the string updates the visual builder
- Invalid expressions show an error message instead of description/next runs
- Presets populate both the visual builder and the expression string

---

## Tool 6: HTTP Status Codes Reference

**Route:** `/dev-tools/http-status`
**Category:** Dev Tools
**File:** `src/components/httpstatus/HttpStatusCodes.tsx`

### UI

Search bar at top. Below: grouped sections (1xx, 2xx, 3xx, 4xx, 5xx) with collapsible cards for each status code.

### Features

- **Search/filter:** Filter by code number or description text
- **Category grouping:** 1xx Informational, 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error
- **Per-code card:** Status code, name, description, and example request/response
- **Color coding:** Each category has a distinct color (green for 2xx, yellow for 3xx, red for 4xx/5xx, blue for 1xx)
- Click to expand/collapse individual cards

### Data

Static data file `src/data/httpStatusCodes.ts` containing all standard HTTP status codes with:

```ts
type HttpStatusCode = {
  code: number
  name: string
  description: string
  category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx"
  example?: {
    request: string
    response: string
  }
}
```

Includes all standard codes: 100-103, 200-208, 226, 300-308, 400-431, 451, 500-511.

### Implementation

- No external dependencies — pure static data + React components
- Search is client-side filter on code + name + description
- Collapsible sections use shadcn/ui `Collapsible` or custom accordion
- Examples rendered in `<pre>` blocks with monospace font

---

## Routing

| Tool | Route | Category |
|------|-------|----------|
| YAML ↔ JSON | `/converters/yaml-json` | Converters |
| SQL Formatter | `/dev-tools/sql-formatter` | Dev Tools |
| Text Diff | `/dev-tools/text-diff` | Dev Tools |
| JSON → Types | `/dev-tools/json-to-types` | Dev Tools |
| Cron Builder | `/dev-tools/cron` | Dev Tools |
| HTTP Status Codes | `/dev-tools/http-status` | Dev Tools |

## New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `yaml` | YAML parse/stringify | ~100KB |
| `sql-formatter` | SQL formatting + minification | ~200KB |
| `diff` | Text diff computation | ~40KB |
| `cronstrue` | Cron to human-readable text | ~30KB |
| `cron-parser` | Parse cron + compute next runs | ~20KB |

No server-side dependencies. Everything runs client-side.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/yaml/YamlJsonConverter.tsx` | YAML ↔ JSON tool |
| `src/components/sql/SqlFormatter.tsx` | SQL Formatter tool |
| `src/components/textdiff/TextDiff.tsx` | Text Diff tool |
| `src/components/jsontypes/JsonToTypes.tsx` | JSON → Types tool |
| `src/utils/jsonToTypes.ts` | Shared type inference |
| `src/utils/jsonToTs.ts` | TypeScript generator |
| `src/utils/jsonToDart.ts` | Dart generator |
| `src/utils/jsonToCsharp.ts` | C# generator |
| `src/utils/jsonToPython.ts` | Python generator |
| `src/utils/jsonToJava.ts` | Java generator |
| `src/components/cron/CronBuilder.tsx` | Cron Builder tool |
| `src/components/httpstatus/HttpStatusCodes.tsx` | HTTP Status Codes tool |
| `src/data/httpStatusCodes.ts` | Static HTTP status code data |

## Files to Modify

| File | Change |
|------|--------|
| `src/router.tsx` | Add 6 lazy imports + routes |
| `src/config/toolRegistry.ts` | Add 6 tool entries |
| `package.json` | Add 5 new dependencies |
