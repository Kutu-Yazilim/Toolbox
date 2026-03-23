# Batch 2: Data Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Data Tools category with 5 tools: CSV Viewer/Editor, JSON Path Finder, Data Transformer, SQL Playground, and Chart Builder.

**Architecture:** New "data-tools" category added to toolRegistry and router. Each tool follows existing component/registry/router pattern. Two new dependencies: `sql.js` (WASM SQLite) and `recharts` (React charting).

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Monaco Editor (existing), sql.js (new), recharts (new).

**Spec:** `docs/superpowers/specs/2026-03-23-tool-expansion-design.md` — Batch 2 section.

---

## File Structure Overview

**New files:**
- `src/components/csvviewer/CsvViewer.tsx`
- `src/components/jsonpath/JsonPathFinder.tsx`
- `src/components/datatransform/DataTransformer.tsx`
- `src/components/sqlplayground/SqlPlayground.tsx`
- `src/components/chartbuilder/ChartBuilder.tsx`

**Modified shared files (every task):**
- `src/config/toolRegistry.ts` — add data-tools category + tool entries
- `src/router.tsx` — add data-tools route group + lazy imports

**New dependencies:**
- `sql.js` — Task 4 only
- `recharts` — Task 5 only

---

## Task 1: Data Tools Category Setup + CSV Viewer/Editor

**Files:**
- Create: `src/components/csvviewer/CsvViewer.tsx`
- Modify: `src/config/toolRegistry.ts` (add category + first tool)
- Modify: `src/router.tsx` (add route group)

- [ ] **Step 1: Add data-tools category to toolRegistry.ts**

Add `"data-tools"` to `CategoryId` type union.
Add `TableIcon` and `SearchIcon` and `WandIcon` and `DatabaseIcon` (already imported) imports.
Add to CATEGORIES array: `{ id: "data-tools", label: "Data Tools", path: "/data-tools", icon: TableIcon }`
Add tool entry:
```typescript
{
  id: "csv-viewer",
  label: "CSV Viewer",
  description: "View, edit, sort, and export CSV/TSV data in a spreadsheet-like interface",
  icon: FileSpreadsheetIcon,
  categoryId: "data-tools",
  path: "/data-tools/csv-viewer",
},
```

- [ ] **Step 2: Add data-tools route group to router.tsx**

Add lazy import for CsvViewer. Add route group after security, before catch-all:
```typescript
{
  path: "data-tools",
  element: <CategoryLayout />,
  errorElement: <RouteErrorBoundary />,
  children: [
    { index: true, element: <CategoryLandingPage /> },
    { path: "csv-viewer", element: lazy_(CsvViewer) },
  ],
},
```

- [ ] **Step 3: Create CsvViewer component**

Features:
- Drag-and-drop or paste CSV/TSV data (textarea input mode)
- Auto-detect delimiter (comma, tab, semicolon, pipe)
- Spreadsheet-like table: sortable columns (click header), inline cell editing (double-click)
- Add/remove rows and columns via toolbar buttons
- Export as CSV, JSON, or copy to clipboard
- Delimiter selector override in toolbar
- Row count display

- [ ] **Step 4: Build and commit**

```bash
npm run build
git commit -m "feat: add Data Tools category and CSV Viewer/Editor"
```

---

## Task 2: JSON Path Finder

**Files:**
- Create: `src/components/jsonpath/JsonPathFinder.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create JsonPathFinder component**

Features:
- Left panel: Monaco editor for JSON input (use existing @monaco-editor/react)
- Right panel: interactive tree view of parsed JSON
- Click any node in tree → shows its JSONPath (e.g. `$.users[0].name`) and jq path (e.g. `.users[0].name`)
- Query input at top of right panel: type JSONPath expression → show extracted results below
- Error handling for invalid JSON
- Copy path buttons (JSONPath and jq)
- Tree nodes expandable/collapsible, show type badges (string, number, boolean, array, object, null)

- [ ] **Step 2: Register and route**

Registry: id "json-path", label "JSON Path", icon SearchIcon, categoryId "data-tools", path "/data-tools/json-path"
Description: "Explore JSON structure, find paths, and query with JSONPath expressions"
Route: `{ path: "json-path", element: lazy_(JsonPathFinder) }`

- [ ] **Step 3: Build and commit**

```bash
npm run build
git commit -m "feat: add JSON Path Finder with tree view and JSONPath queries"
```

---

## Task 3: Data Transformer (highest complexity)

**Files:**
- Create: `src/components/datatransform/DataTransformer.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create DataTransformer component**

Features:
- Input: paste or upload JSON array / CSV data (auto-detect format)
- Visual pipeline: linear list of transformation steps (not drag-and-drop — keep it simple)
- Each step is a card with: step type dropdown, configuration fields, remove button
- Add Step button at bottom of pipeline
- Available transforms:
  - **Filter**: field selector + operator (equals, contains, gt, lt, exists) + value
  - **Sort**: field selector + direction (asc/desc)
  - **Map/Select**: checkboxes to include/exclude fields
  - **Rename**: old field name → new field name
  - **Deduplicate**: select field to deduplicate by
  - **Limit**: number input for max rows
- Live preview: output table showing result after all steps applied
- Export as JSON or CSV
- Step count and row count indicators

Implementation approach:
- Parse input data to array of objects
- Each transform step is a pure function: `(data: Record<string, unknown>[]) => Record<string, unknown>[]`
- Chain transforms in sequence
- Re-run pipeline on any change (input or step config)

- [ ] **Step 2: Register and route**

Registry: id "data-transformer", label "Data Transformer", icon WandIcon, categoryId "data-tools", path "/data-tools/data-transformer"
Description: "Transform JSON/CSV data with filter, sort, map, rename, and deduplicate operations"
Route: `{ path: "data-transformer", element: lazy_(DataTransformer) }`

- [ ] **Step 3: Build and commit**

```bash
npm run build
git commit -m "feat: add Data Transformer with visual pipeline builder"
```

---

## Task 4: SQL Playground

**Files:**
- Create: `src/components/sqlplayground/SqlPlayground.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`
- Modify: `package.json` (new dependency)

- [ ] **Step 1: Install sql.js**

```bash
npm install sql.js
```

Note: sql.js requires loading the WASM file. Use the CDN approach:
```typescript
import initSqlJs from "sql.js"
const SQL = await initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` })
```

- [ ] **Step 2: Create SqlPlayground component**

Features:
- File upload area: drag-and-drop CSV or JSON files → auto-creates SQLite table
- Table name derived from filename (sanitized)
- Support multiple tables (upload multiple files)
- Show loaded tables list with row counts and column info
- Monaco editor for SQL queries (language: sql)
- Run Query button (or Ctrl+Enter)
- Results as sortable table below editor
- Export query results as CSV or JSON
- Loading indicator while WASM initializes
- Error display for SQL errors
- Clear/reset button

- [ ] **Step 3: Register and route**

Registry: id "sql-playground", label "SQL Playground", icon DatabaseIcon, categoryId "data-tools", path "/data-tools/sql-playground"
Description: "Run SQL queries on uploaded CSV/JSON data with in-browser SQLite"
Route: `{ path: "sql-playground", element: lazy_(SqlPlayground) }`

- [ ] **Step 4: Build and commit**

```bash
npm run build
git commit -m "feat: add SQL Playground with in-browser SQLite via sql.js"
```

---

## Task 5: Chart Builder

**Files:**
- Create: `src/components/chartbuilder/ChartBuilder.tsx`
- Modify: `src/config/toolRegistry.ts`
- Modify: `src/router.tsx`
- Modify: `package.json` (new dependency)

- [ ] **Step 1: Install recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Create ChartBuilder component**

Features:
- Input: paste CSV or JSON data (textarea or Monaco editor)
- Auto-detect columns from data
- Chart type selector: Bar, Line, Pie, Scatter, Area (segmented buttons)
- Axis configuration:
  - X-axis: dropdown to select column
  - Y-axis: dropdown to select column(s) — support multiple series for line/bar/area
- Chart title input
- Color customization per series (color picker inputs)
- Live chart preview using recharts components
- Export as PNG (via html-to-image, already a dependency) or SVG
- Responsive chart container
- Legend and tooltip enabled by default

- [ ] **Step 3: Register and route**

Registry: id "chart-builder", label "Chart Builder", icon BarChart3Icon, categoryId "data-tools", path "/data-tools/chart-builder"
Description: "Visualize CSV/JSON data as bar, line, pie, scatter, and area charts"
Route: `{ path: "chart-builder", element: lazy_(ChartBuilder) }`

- [ ] **Step 4: Build and commit**

```bash
npm run build
git commit -m "feat: add Chart Builder with recharts (bar, line, pie, scatter, area)"
```

---

## Final Verification

- [ ] **Step 1: Full build check**

```bash
npm run build
```

- [ ] **Step 2: Verify all 5 tools appear in sidebar under Data Tools category**

Navigate to each:
- `/data-tools/csv-viewer`
- `/data-tools/json-path`
- `/data-tools/data-transformer`
- `/data-tools/sql-playground`
- `/data-tools/chart-builder`
