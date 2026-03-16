# Dev Tools Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new developer utility tools: YAML↔JSON, SQL Formatter, Text Diff, JSON→Types, Cron Builder, HTTP Status Codes.

**Architecture:** Each tool is an independent lazy-loaded React component following the established pattern — Monaco Editor for code input/output, shadcn/ui buttons for toolbar actions, standard toolbar/layout conventions. Each tool gets a registry entry and a route.

**Tech Stack:** React 19, Monaco Editor, React Router v7, Tailwind CSS 4, shadcn/ui, plus `yaml`, `sql-formatter`, `cronstrue`, `cron-parser` npm packages.

**Verification:** No test framework exists. Use `npm run build` to verify each task compiles. Manual testing via `npm run dev`.

---

## Chunk 1: Foundation + First 3 Tools

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new packages**

```bash
npm install yaml sql-formatter cronstrue cron-parser
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add yaml, sql-formatter, cronstrue, cron-parser dependencies"
```

---

### Task 2: YAML ↔ JSON Converter

**Files:**
- Create: `src/components/yaml/YamlJsonConverter.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

**Reference files:** Read `src/components/json/JsonEditor.tsx` for Monaco Editor patterns, toolbar layout, copy/error patterns.

- [ ] **Step 1: Create YamlJsonConverter component**

Create `src/components/yaml/YamlJsonConverter.tsx`:

```tsx
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon, Trash2Icon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

type SourceSide = "yaml" | "json"

export function YamlJsonConverter() {
  const [yamlValue, setYamlValue] = useState("")
  const [jsonValue, setJsonValue] = useState("")
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copiedYaml, setCopiedYaml] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [indent, setIndent] = useState<2 | 4>(2)
  const sourceRef = useRef<SourceSide | null>(null)

  const handleYamlChange = useCallback(
    (value: string | undefined) => {
      const newValue = value ?? ""
      setYamlValue(newValue)
      sourceRef.current = "yaml"

      if (!newValue.trim()) {
        setJsonValue("")
        setYamlError(null)
        setJsonError(null)
        return
      }

      try {
        const parsed = parseYaml(newValue)
        const json = JSON.stringify(parsed, null, indent)
        setJsonValue(json)
        setYamlError(null)
        setJsonError(null)
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML")
      }
    },
    [indent],
  )

  const handleJsonChange = useCallback((value: string | undefined) => {
    const newValue = value ?? ""
    setJsonValue(newValue)
    sourceRef.current = "json"

    if (!newValue.trim()) {
      setYamlValue("")
      setYamlError(null)
      setJsonError(null)
      return
    }

    try {
      const parsed = JSON.parse(newValue)
      const yaml = stringifyYaml(parsed)
      setYamlValue(yaml)
      setJsonError(null)
      setYamlError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }, [])

  const handleCopy = async (text: string, side: "yaml" | "json") => {
    await navigator.clipboard.writeText(text)
    if (side === "yaml") {
      setCopiedYaml(true)
      setTimeout(() => setCopiedYaml(false), 2000)
    } else {
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    }
  }

  const handleClear = () => {
    setYamlValue("")
    setJsonValue("")
    setYamlError(null)
    setJsonError(null)
  }

  const cycleIndent = () => {
    setIndent((prev) => {
      const next = prev === 2 ? 4 : 2
      // Re-format JSON side if it's valid
      if (jsonValue.trim()) {
        try {
          const parsed = JSON.parse(jsonValue)
          setJsonValue(JSON.stringify(parsed, null, next))
        } catch {
          // keep as-is
        }
      }
      return next
    })
  }

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    padding: { top: 8 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          YAML ↔ JSON
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={cycleIndent}
            title={`JSON indent: ${indent} spaces`}
            className="font-mono text-[10px] w-8"
          >
            {indent}sp
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleClear} title="Clear both">
            <Trash2Icon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Editor panels */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-px bg-border">
        {/* YAML pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              YAML
            </span>
            <div className="flex items-center gap-1">
              {yamlError && (
                <span className="text-destructive text-[10px] flex items-center gap-0.5">
                  <AlertCircleIcon className="h-2.5 w-2.5" />
                  Error
                </span>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleCopy(yamlValue, "yaml")}
                title="Copy YAML"
              >
                {copiedYaml ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              value={yamlValue}
              onChange={handleYamlChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {yamlError && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {yamlError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* JSON pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              JSON
            </span>
            <div className="flex items-center gap-1">
              {jsonError && (
                <span className="text-destructive text-[10px] flex items-center gap-0.5">
                  <AlertCircleIcon className="h-2.5 w-2.5" />
                  Error
                </span>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleCopy(jsonValue, "json")}
                title="Copy JSON"
              >
                {copiedJson ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonValue}
              onChange={handleJsonChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {jsonError && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {jsonError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to router**

In `src/router.tsx`, add the lazy import near the top (after the existing Converter imports):

```tsx
const YamlJsonConverter = React.lazy(() =>
  import("@/components/yaml/YamlJsonConverter").then((m) => ({
    default: m.YamlJsonConverter,
  })),
)
```

Add the route inside the `converters` children array:

```tsx
{ path: "yaml-json", element: lazy_(YamlJsonConverter) },
```

- [ ] **Step 3: Add to tool registry**

In `src/config/toolRegistry.ts`, add to the `TOOLS` array in the Converters section:

```tsx
{
  id: "yaml-json",
  label: "YAML ↔ JSON",
  description: "Convert between YAML and JSON formats in real-time",
  icon: FileTextIcon,
  categoryId: "converters",
  path: "/converters/yaml-json",
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/yaml/YamlJsonConverter.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add YAML ↔ JSON converter tool"
```

---

### Task 3: SQL Formatter

**Files:**
- Create: `src/components/sql/SqlFormatter.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

**Reference files:** Read `src/components/json/JsonEditor.tsx` for single-editor tool pattern.

- [ ] **Step 1: Create SqlFormatter component**

Create `src/components/sql/SqlFormatter.tsx`:

```tsx
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  CopyIcon,
  CheckIcon,
  WrapTextIcon,
  MinimizeIcon,
  Trash2Icon,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { format as formatSql } from "sql-formatter"
import type { SqlLanguage } from "sql-formatter"

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "T-SQL" },
  { value: "plsql", label: "PL/SQL" },
]

const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 10;`

export function SqlFormatter() {
  const [sql, setSql] = useState(EXAMPLE_SQL)
  const [dialect, setDialect] = useState<SqlLanguage>("sql")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleChange = useCallback((value: string | undefined) => {
    setSql(value ?? "")
    setError(null)
  }, [])

  const handleFormat = useCallback(() => {
    try {
      const formatted = formatSql(sql, {
        language: dialect,
        tabWidth: 2,
        useTabs: false,
        keywordCase: "upper",
      })
      setSql(formatted)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Format failed")
    }
  }, [sql, dialect])

  const handleMinify = useCallback(() => {
    try {
      const minified = formatSql(sql, {
        language: dialect,
        tabWidth: 0,
        useTabs: false,
        keywordCase: "preserve",
      })
      // sql-formatter doesn't have a true minify, so collapse whitespace
      setSql(minified.replace(/\s+/g, " ").trim())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minify failed")
    }
  }, [sql, dialect])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            SQL
          </span>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlLanguage)}
            className="h-6 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleFormat}
            disabled={!sql.trim()}
            title="Format"
          >
            <WrapTextIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleMinify}
            disabled={!sql.trim()}
            title="Minify"
          >
            <MinimizeIcon className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy">
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setSql("")
              setError(null)
            }}
            title="Clear"
          >
            <Trash2Icon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 8 },
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
        {error && (
          <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive font-mono leading-relaxed break-words">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to router**

In `src/router.tsx`, add lazy import:

```tsx
const SqlFormatter = React.lazy(() =>
  import("@/components/sql/SqlFormatter").then((m) => ({
    default: m.SqlFormatter,
  })),
)
```

Add route inside `dev-tools` children:

```tsx
{ path: "sql-formatter", element: lazy_(SqlFormatter) },
```

- [ ] **Step 3: Add to tool registry**

In `src/config/toolRegistry.ts`, add to Dev Tools section. Import `DatabaseIcon` (already imported):

```tsx
{
  id: "sql-formatter",
  label: "SQL Formatter",
  description: "Format, prettify, and minify SQL queries with dialect support",
  icon: DatabaseIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/sql-formatter",
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/sql/SqlFormatter.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add SQL Formatter tool"
```

---

### Task 4: Text Diff

**Files:**
- Create: `src/components/textdiff/TextDiff.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

**Reference files:** Read `src/components/json/JsonDiff.tsx` for DiffEditor usage pattern.

- [ ] **Step 1: Create TextDiff component**

Create `src/components/textdiff/TextDiff.tsx`:

```tsx
import { useState } from "react"
import { DiffEditor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ColumnsIcon, RowsIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

export function TextDiff() {
  const isMobile = useIsMobile()
  const [original, setOriginal] = useState("")
  const [modified, setModified] = useState("")
  const [sideBySide, setSideBySide] = useState(!isMobile)

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Text Diff
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSideBySide(true)}
            title="Side by side"
            className={sideBySide ? "bg-accent" : ""}
          >
            <ColumnsIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSideBySide(false)}
            title="Inline"
            className={!sideBySide ? "bg-accent" : ""}
          >
            <RowsIcon className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <span className="text-[10px] text-muted-foreground">Edit both sides to compare</span>
        </div>
      </div>

      {/* Diff editor */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          language="plaintext"
          original={original}
          modified={modified}
          theme="vs-dark"
          onMount={(_editor) => {
            const modifiedEditor = _editor.getModifiedEditor()
            const originalEditor = _editor.getOriginalEditor()
            modifiedEditor.onDidChangeModelContent(() => {
              setModified(modifiedEditor.getValue())
            })
            originalEditor.onDidChangeModelContent(() => {
              setOriginal(originalEditor.getValue())
            })
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderSideBySide: sideBySide,
            automaticLayout: true,
            padding: { top: 8 },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to router**

In `src/router.tsx`, add lazy import:

```tsx
const TextDiff = React.lazy(() =>
  import("@/components/textdiff/TextDiff").then((m) => ({
    default: m.TextDiff,
  })),
)
```

Add route inside `dev-tools` children:

```tsx
{ path: "text-diff", element: lazy_(TextDiff) },
```

- [ ] **Step 3: Add to tool registry**

In `src/config/toolRegistry.ts`, add to Dev Tools section:

```tsx
{
  id: "text-diff",
  label: "Text Diff",
  description: "Compare two texts side-by-side or inline with highlighted differences",
  icon: FileTextIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/text-diff",
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/textdiff/TextDiff.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add Text Diff tool"
```

---

## Chunk 2: JSON → Types Generator

### Task 5: Type Inference Engine

**Files:**
- Create: `src/utils/jsonToTypes.ts`

This is the shared type inference logic that all language generators depend on.

- [ ] **Step 1: Create type inference module**

Create `src/utils/jsonToTypes.ts`:

```tsx
export type JsonType =
  | { kind: "string" }
  | { kind: "number"; isInteger: boolean }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "array"; elementType: JsonType }
  | { kind: "object"; fields: JsonField[] }
  | { kind: "union"; types: JsonType[] }
  | { kind: "unknown" }

export type JsonField = {
  name: string
  type: JsonType
  optional: boolean
}

export function inferType(value: unknown): JsonType {
  if (value === null) return { kind: "null" }
  if (typeof value === "string") return { kind: "string" }
  if (typeof value === "boolean") return { kind: "boolean" }
  if (typeof value === "number")
    return { kind: "number", isInteger: Number.isInteger(value) }

  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", elementType: { kind: "unknown" } }
    const types = value.map(inferType)
    const merged = mergeTypes(types)
    return { kind: "array", elementType: merged }
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const fields: JsonField[] = Object.keys(obj).map((key) => ({
      name: key,
      type: inferType(obj[key]),
      optional: false,
    }))
    return { kind: "object", fields }
  }

  return { kind: "unknown" }
}

function mergeTypes(types: JsonType[]): JsonType {
  if (types.length === 0) return { kind: "unknown" }
  if (types.length === 1) return types[0]

  // If all same kind, merge
  const kinds = new Set(types.map((t) => t.kind))
  if (kinds.size === 1) {
    const kind = types[0].kind
    if (kind === "object") {
      return mergeObjectTypes(types as Extract<JsonType, { kind: "object" }>[])
    }
    if (kind === "number") {
      const allInt = (types as Extract<JsonType, { kind: "number" }>[]).every(
        (t) => t.isInteger,
      )
      return { kind: "number", isInteger: allInt }
    }
    return types[0]
  }

  // If mix of null and something else, make it optional
  const nonNull = types.filter((t) => t.kind !== "null")
  if (nonNull.length === 1 && types.some((t) => t.kind === "null")) {
    return nonNull[0] // caller handles nullable at field level
  }

  return { kind: "union", types: dedupeTypes(types) }
}

function mergeObjectTypes(
  types: Extract<JsonType, { kind: "object" }>[],
): JsonType {
  const allKeys = new Set<string>()
  for (const t of types) {
    for (const f of t.fields) allKeys.add(f.name)
  }

  const fields: JsonField[] = [...allKeys].map((key) => {
    const fieldTypes: JsonType[] = []
    let presentCount = 0

    for (const t of types) {
      const field = t.fields.find((f) => f.name === key)
      if (field) {
        fieldTypes.push(field.type)
        presentCount++
      }
    }

    return {
      name: key,
      type: mergeTypes(fieldTypes),
      optional: presentCount < types.length,
    }
  })

  return { kind: "object", fields }
}

function dedupeTypes(types: JsonType[]): JsonType[] {
  const seen = new Set<string>()
  return types.filter((t) => {
    const key = t.kind
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/jsonToTypes.ts
git commit -m "feat: add JSON type inference engine"
```

---

### Task 6: Language Generators (TypeScript, Dart, C#, Python, Java)

**Files:**
- Create: `src/utils/jsonToTs.ts`
- Create: `src/utils/jsonToDart.ts`
- Create: `src/utils/jsonToCsharp.ts`
- Create: `src/utils/jsonToPython.ts`
- Create: `src/utils/jsonToJava.ts`

Each generator is a pure function: `(json: unknown, rootName: string) => string`.

- [ ] **Step 1: Create TypeScript generator**

Create `src/utils/jsonToTs.ts`:

```tsx
import { inferType, toPascalCase, type JsonType, type JsonField } from "./jsonToTypes"

export function generateTypeScript(json: unknown, rootName: string): string {
  const type = inferType(json)
  const interfaces: string[] = []
  resolveType(type, rootName, interfaces)
  return interfaces.join("\n\n")
}

function resolveType(
  type: JsonType,
  name: string,
  interfaces: string[],
): string {
  switch (type.kind) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "unknown":
      return "unknown"
    case "union":
      return type.types.map((t) => resolveType(t, name, interfaces)).join(" | ")
    case "array": {
      const elType = resolveType(type.elementType, name + "Item", interfaces)
      return `${elType}[]`
    }
    case "object": {
      const interfaceName = toPascalCase(name)
      const lines = type.fields.map((f) => {
        const fieldType = resolveType(f.type, f.name, interfaces)
        const opt = f.optional ? "?" : ""
        const nullable = hasNull(f.type) ? " | null" : ""
        return `  ${safeName(f.name)}${opt}: ${fieldType}${nullable};`
      })
      interfaces.push(`interface ${interfaceName} {\n${lines.join("\n")}\n}`)
      return interfaceName
    }
  }
}

function hasNull(type: JsonType): boolean {
  if (type.kind === "null") return true
  if (type.kind === "union") return type.types.some((t) => t.kind === "null")
  return false
}

function safeName(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `"${name}"`
}
```

- [ ] **Step 2: Create Dart generator**

Create `src/utils/jsonToDart.ts`:

```tsx
import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateDart(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = []
  resolveType(type, rootName, classes)
  return classes.join("\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "String"
    case "number":
      return type.isInteger ? "int" : "double"
    case "boolean":
      return "bool"
    case "null":
      return "dynamic"
    case "unknown":
      return "dynamic"
    case "union":
      return "dynamic"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${el}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const fields = type.fields
      const fieldDecls = fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          const nullable = f.optional ? "?" : ""
          return `  final ${t}${nullable} ${dartFieldName(f.name)};`
        })
        .join("\n")

      const ctorParams = fields
        .map((f) => {
          const req = f.optional ? "" : "required "
          return `    ${req}this.${dartFieldName(f.name)},`
        })
        .join("\n")

      const fromJsonFields = fields
        .map((f) => {
          const t = resolveType(f.type, f.name, [])
          return `      ${dartFieldName(f.name)}: json['${f.name}']${isComplexType(f.type) ? ` as ${t}` : " as ${t}"},`
        })
        .join("\n")

      const toJsonFields = fields
        .map((f) => `      '${f.name}': ${dartFieldName(f.name)},`)
        .join("\n")

      classes.push(
        `class ${className} {\n${fieldDecls}\n\n  ${className}({\n${ctorParams}\n  });\n\n  factory ${className}.fromJson(Map<String, dynamic> json) {\n    return ${className}(\n${fromJsonFields}\n    );\n  }\n\n  Map<String, dynamic> toJson() {\n    return {\n${toJsonFields}\n    };\n  }\n}`,
      )
      return className
    }
  }
}

function isComplexType(type: JsonType): boolean {
  return type.kind === "object" || type.kind === "array"
}

function dartFieldName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
}
```

- [ ] **Step 3: Create C# generator**

Create `src/utils/jsonToCsharp.ts`:

```tsx
import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateCsharp(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = []
  resolveType(type, rootName, classes)
  return classes.join("\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "string"
    case "number":
      return type.isInteger ? "int" : "double"
    case "boolean":
      return "bool"
    case "null":
      return "object"
    case "unknown":
      return "object"
    case "union":
      return "object"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${el}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const props = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          const nullable = f.optional ? "?" : ""
          const propName = toPascalCase(f.name)
          return `    [JsonProperty("${f.name}")]\n    public ${t}${nullable} ${propName} { get; set; }`
        })
        .join("\n\n")

      classes.push(`public class ${className}\n{\n${props}\n}`)
      return className
    }
  }
}
```

- [ ] **Step 4: Create Python generator**

Create `src/utils/jsonToPython.ts`:

```tsx
import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generatePython(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = ["from dataclasses import dataclass\nfrom typing import Optional, List, Any"]
  resolveType(type, rootName, classes)
  return classes.join("\n\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "str"
    case "number":
      return type.isInteger ? "int" : "float"
    case "boolean":
      return "bool"
    case "null":
      return "None"
    case "unknown":
      return "Any"
    case "union":
      return "Any"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List[${el}]`
    }
    case "object": {
      const className = toPascalCase(name)
      const fields = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          if (f.optional) {
            return `    ${toSnakeCase(f.name)}: Optional[${t}] = None`
          }
          return `    ${toSnakeCase(f.name)}: ${t}`
        })
        .join("\n")

      classes.push(`@dataclass\nclass ${className}:\n${fields}`)
      return className
    }
  }
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_/, "")
    .toLowerCase()
}
```

- [ ] **Step 5: Create Java generator**

Create `src/utils/jsonToJava.ts`:

```tsx
import { inferType, toPascalCase, type JsonType } from "./jsonToTypes"

export function generateJava(json: unknown, rootName: string): string {
  const type = inferType(json)
  const classes: string[] = []
  resolveType(type, rootName, classes)
  return classes.join("\n\n")
}

function resolveType(type: JsonType, name: string, classes: string[]): string {
  switch (type.kind) {
    case "string":
      return "String"
    case "number":
      return type.isInteger ? "int" : "double"
    case "boolean":
      return "boolean"
    case "null":
      return "Object"
    case "unknown":
      return "Object"
    case "union":
      return "Object"
    case "array": {
      const el = resolveType(type.elementType, name + "Item", classes)
      return `List<${boxed(el)}>`
    }
    case "object": {
      const className = toPascalCase(name)
      const fieldDecls = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, classes)
          return `    private ${t} ${f.name};`
        })
        .join("\n")

      const methods = type.fields
        .map((f) => {
          const t = resolveType(f.type, f.name, [])
          const getter = `    public ${t} get${toPascalCase(f.name)}() {\n        return ${f.name};\n    }`
          const setter = `    public void set${toPascalCase(f.name)}(${t} ${f.name}) {\n        this.${f.name} = ${f.name};\n    }`
          return `${getter}\n\n${setter}`
        })
        .join("\n\n")

      classes.push(`public class ${className} {\n${fieldDecls}\n\n${methods}\n}`)
      return className
    }
  }
}

function boxed(type: string): string {
  const boxMap: Record<string, string> = {
    int: "Integer",
    double: "Double",
    boolean: "Boolean",
  }
  return boxMap[type] ?? type
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/utils/jsonToTs.ts src/utils/jsonToDart.ts src/utils/jsonToCsharp.ts src/utils/jsonToPython.ts src/utils/jsonToJava.ts
git commit -m "feat: add JSON-to-types language generators (TS, Dart, C#, Python, Java)"
```

---

### Task 7: JSON → Types UI Component

**Files:**
- Create: `src/components/jsontypes/JsonToTypes.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

- [ ] **Step 1: Create JsonToTypes component**

Create `src/components/jsontypes/JsonToTypes.tsx`:

```tsx
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { generateTypeScript } from "@/utils/jsonToTs"
import { generateDart } from "@/utils/jsonToDart"
import { generateCsharp } from "@/utils/jsonToCsharp"
import { generatePython } from "@/utils/jsonToPython"
import { generateJava } from "@/utils/jsonToJava"

const LANGUAGES = [
  { value: "typescript", label: "TypeScript", monacoLang: "typescript" },
  { value: "dart", label: "Dart", monacoLang: "dart" },
  { value: "csharp", label: "C#", monacoLang: "csharp" },
  { value: "python", label: "Python", monacoLang: "python" },
  { value: "java", label: "Java", monacoLang: "java" },
] as const

type Language = (typeof LANGUAGES)[number]["value"]

const GENERATORS: Record<Language, (json: unknown, rootName: string) => string> = {
  typescript: generateTypeScript,
  dart: generateDart,
  csharp: generateCsharp,
  python: generatePython,
  java: generateJava,
}

const EXAMPLE_JSON = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "active": true,
  "score": 95.5,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "62704"
  },
  "roles": ["admin", "editor"],
  "metadata": null
}`

export function JsonToTypes() {
  const [json, setJson] = useState(EXAMPLE_JSON)
  const [language, setLanguage] = useState<Language>("typescript")
  const [rootName, setRootName] = useState("Root")
  const [copied, setCopied] = useState(false)

  const { output, error } = useMemo(() => {
    if (!json.trim()) return { output: "", error: null }
    try {
      const parsed = JSON.parse(json)
      const result = GENERATORS[language](parsed, rootName || "Root")
      return { output: result, error: null }
    } catch (e) {
      return {
        output: "",
        error: e instanceof Error ? e.message : "Invalid JSON",
      }
    }
  }, [json, language, rootName])

  const handleChange = useCallback((value: string | undefined) => {
    setJson(value ?? "")
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoLang ?? "plaintext"

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    padding: { top: 8 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          JSON → Types
        </span>
        <div className="flex items-center gap-2">
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="h-6 w-20 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none font-mono"
            title="Root type name"
          />
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-px bg-border">
        {/* Input pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              JSON Input
            </span>
            {error && (
              <span className="text-destructive text-[10px] flex items-center gap-0.5">
                <AlertCircleIcon className="h-2.5 w-2.5" />
                Invalid
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={json}
              onChange={handleChange}
              theme="vs-dark"
              options={editorOptions}
            />
            {error && (
              <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Output pane */}
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-5 text-[10px] bg-transparent border border-border rounded px-1 text-foreground outline-none uppercase tracking-wider font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              disabled={!output}
              title="Copy"
            >
              {copied ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              value={output}
              theme="vs-dark"
              options={{
                ...editorOptions,
                readOnly: true,
                domReadOnly: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to router**

In `src/router.tsx`, add lazy import:

```tsx
const JsonToTypes = React.lazy(() =>
  import("@/components/jsontypes/JsonToTypes").then((m) => ({
    default: m.JsonToTypes,
  })),
)
```

Add route inside `dev-tools` children:

```tsx
{ path: "json-to-types", element: lazy_(JsonToTypes) },
```

- [ ] **Step 3: Add to tool registry**

In `src/config/toolRegistry.ts`, add to Dev Tools section:

```tsx
{
  id: "json-to-types",
  label: "JSON to Types",
  description: "Generate TypeScript, Dart, C#, Python, and Java types from JSON",
  icon: BracesIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/json-to-types",
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/jsontypes/JsonToTypes.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add JSON to Types generator tool"
```

---

## Chunk 3: Cron Builder + HTTP Status Codes

### Task 8: Cron Expression Builder

**Files:**
- Create: `src/components/cron/CronBuilder.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

- [ ] **Step 1: Create CronBuilder component**

Create `src/components/cron/CronBuilder.tsx`:

```tsx
import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import cronstrue from "cronstrue"
import { parseExpression } from "cron-parser"

const PRESETS: { label: string; value: string }[] = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every day at noon", value: "0 12 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
  { label: "First of month at midnight", value: "0 0 1 * *" },
  { label: "Every Sunday at 3 AM", value: "0 3 * * 0" },
]

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CronBuilder() {
  const [expression, setExpression] = useState("*/15 * * * *")
  const [copied, setCopied] = useState(false)

  const fields = useMemo(() => {
    const parts = expression.trim().split(/\s+/)
    return {
      minute: parts[0] ?? "*",
      hour: parts[1] ?? "*",
      dayOfMonth: parts[2] ?? "*",
      month: parts[3] ?? "*",
      dayOfWeek: parts[4] ?? "*",
    }
  }, [expression])

  const setField = useCallback(
    (index: number, value: string) => {
      const parts = expression.trim().split(/\s+/)
      while (parts.length < 5) parts.push("*")
      parts[index] = value
      setExpression(parts.join(" "))
    },
    [expression],
  )

  const { description, error } = useMemo(() => {
    try {
      const desc = cronstrue.toString(expression, { use24HourTimeFormat: true })
      return { description: desc, error: null }
    } catch {
      return { description: null, error: "Invalid cron expression" }
    }
  }, [expression])

  const nextRuns = useMemo(() => {
    try {
      const interval = parseExpression(expression)
      const runs: string[] = []
      for (let i = 0; i < 5; i++) {
        const next = interval.next()
        runs.push(next.toDate().toLocaleString())
      }
      return runs
    } catch {
      return []
    }
  }, [expression])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(expression)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Cron Builder
        </span>
        <div className="flex items-center gap-1">
          <select
            onChange={(e) => {
              if (e.target.value) setExpression(e.target.value)
              e.target.value = ""
            }}
            defaultValue=""
            className="h-6 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none"
          >
            <option value="" disabled>
              Presets…
            </option>
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy expression">
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Expression input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Expression
          </label>
          <input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full h-10 text-lg font-mono bg-transparent border border-border rounded-md px-3 text-foreground outline-none text-center tracking-widest"
            placeholder="* * * * *"
            spellCheck={false}
          />
        </div>

        {/* Visual builder */}
        <div className="grid grid-cols-5 gap-3">
          <FieldEditor label="Minute" hint="0-59" value={fields.minute} onChange={(v) => setField(0, v)} />
          <FieldEditor label="Hour" hint="0-23" value={fields.hour} onChange={(v) => setField(1, v)} />
          <FieldEditor label="Day" hint="1-31" value={fields.dayOfMonth} onChange={(v) => setField(2, v)} />
          <FieldEditor
            label="Month"
            hint="1-12"
            value={fields.month}
            onChange={(v) => setField(3, v)}
            options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
          />
          <FieldEditor
            label="Weekday"
            hint="0-6"
            value={fields.dayOfWeek}
            onChange={(v) => setField(4, v)}
            options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))}
          />
        </div>

        {/* Description */}
        <div className="rounded-md border border-border p-3">
          {error ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ) : (
            <p className="text-sm text-foreground">{description}</p>
          )}
        </div>

        {/* Next runs */}
        {nextRuns.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Next 5 runs
            </h3>
            <ul className="space-y-1">
              {nextRuns.map((run, i) => (
                <li key={i} className="text-sm text-muted-foreground font-mono">
                  {run}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldEditor({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  options?: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm font-mono bg-transparent border border-border rounded px-2 text-foreground outline-none text-center"
        placeholder="*"
        spellCheck={false}
      />
      {options && (
        <select
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value)
          }}
          defaultValue=""
          className="h-6 text-[10px] bg-transparent border border-border rounded px-1 text-muted-foreground outline-none"
        >
          <option value="">{hint}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {!options && (
        <span className="text-[10px] text-muted-foreground text-center">{hint}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add to router**

In `src/router.tsx`, add lazy import:

```tsx
const CronBuilder = React.lazy(() =>
  import("@/components/cron/CronBuilder").then((m) => ({
    default: m.CronBuilder,
  })),
)
```

Add route inside `dev-tools` children:

```tsx
{ path: "cron", element: lazy_(CronBuilder) },
```

- [ ] **Step 3: Add to tool registry**

In `src/config/toolRegistry.ts`, add to Dev Tools section:

```tsx
{
  id: "cron",
  label: "Cron Builder",
  description: "Build cron expressions visually with human-readable descriptions and next run times",
  icon: ClockIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/cron",
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/cron/CronBuilder.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add Cron Expression Builder tool"
```

---

### Task 9: HTTP Status Codes Reference

**Files:**
- Create: `src/data/httpStatusCodes.ts`
- Create: `src/components/httpstatus/HttpStatusCodes.tsx`
- Modify: `src/router.tsx`
- Modify: `src/config/toolRegistry.ts`

- [ ] **Step 1: Create HTTP status codes data file**

Create `src/data/httpStatusCodes.ts` with all standard HTTP status codes, their descriptions, and request/response examples. This file contains static data — no logic.

Each entry follows:

```ts
export type HttpStatusCategory = "1xx" | "2xx" | "3xx" | "4xx" | "5xx"

export type HttpStatusCode = {
  code: number
  name: string
  description: string
  category: HttpStatusCategory
  example?: {
    request: string
    response: string
  }
}

export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 1xx Informational
  { code: 100, name: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", category: "1xx", example: { request: "POST /upload HTTP/1.1\nHost: example.com\nExpect: 100-continue\nContent-Length: 1048576", response: "HTTP/1.1 100 Continue" } },
  { code: 101, name: "Switching Protocols", description: "The server is switching protocols as requested by the client via the Upgrade header.", category: "1xx", example: { request: "GET /chat HTTP/1.1\nHost: example.com\nUpgrade: websocket\nConnection: Upgrade", response: "HTTP/1.1 101 Switching Protocols\nUpgrade: websocket\nConnection: Upgrade" } },
  { code: 102, name: "Processing", description: "The server has received and is processing the request, but no response is available yet (WebDAV).", category: "1xx" },
  { code: 103, name: "Early Hints", description: "Used to return some response headers before final HTTP message, allowing the browser to preload resources.", category: "1xx", example: { request: "GET / HTTP/1.1\nHost: example.com", response: "HTTP/1.1 103 Early Hints\nLink: </style.css>; rel=preload; as=style" } },

  // 2xx Success
  { code: 200, name: "OK", description: "The request succeeded. The response body contains the requested resource.", category: "2xx", example: { request: "GET /api/users/1 HTTP/1.1\nHost: api.example.com", response: "HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\"id\": 1, \"name\": \"Alice\"}" } },
  { code: 201, name: "Created", description: "The request succeeded and a new resource was created. Typically returned after POST requests.", category: "2xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{\"name\": \"Bob\"}", response: "HTTP/1.1 201 Created\nLocation: /api/users/2\n\n{\"id\": 2, \"name\": \"Bob\"}" } },
  { code: 202, name: "Accepted", description: "The request has been accepted for processing, but the processing has not been completed.", category: "2xx", example: { request: "POST /api/reports/generate HTTP/1.1", response: "HTTP/1.1 202 Accepted\n\n{\"jobId\": \"abc123\", \"status\": \"queued\"}" } },
  { code: 204, name: "No Content", description: "The request succeeded but there is no content to send in the response body.", category: "2xx", example: { request: "DELETE /api/users/1 HTTP/1.1", response: "HTTP/1.1 204 No Content" } },
  { code: 206, name: "Partial Content", description: "The server is delivering only part of the resource due to a Range header sent by the client.", category: "2xx", example: { request: "GET /video.mp4 HTTP/1.1\nRange: bytes=0-1023", response: "HTTP/1.1 206 Partial Content\nContent-Range: bytes 0-1023/146515" } },

  // 3xx Redirection
  { code: 301, name: "Moved Permanently", description: "The requested resource has been permanently moved to a new URL. Search engines will update their links.", category: "3xx", example: { request: "GET /old-page HTTP/1.1", response: "HTTP/1.1 301 Moved Permanently\nLocation: /new-page" } },
  { code: 302, name: "Found", description: "The resource temporarily resides at a different URL. The client should continue to use the original URL.", category: "3xx", example: { request: "GET /temp-redirect HTTP/1.1", response: "HTTP/1.1 302 Found\nLocation: /temporary-location" } },
  { code: 304, name: "Not Modified", description: "The resource has not been modified since the last request. The client can use its cached version.", category: "3xx", example: { request: "GET /api/data HTTP/1.1\nIf-None-Match: \"abc123\"", response: "HTTP/1.1 304 Not Modified" } },
  { code: 307, name: "Temporary Redirect", description: "The resource temporarily resides at a different URL. Unlike 302, the request method must not change.", category: "3xx", example: { request: "POST /api/submit HTTP/1.1", response: "HTTP/1.1 307 Temporary Redirect\nLocation: /api/v2/submit" } },
  { code: 308, name: "Permanent Redirect", description: "The resource has been permanently moved. Unlike 301, the request method must not change.", category: "3xx", example: { request: "POST /api/old HTTP/1.1", response: "HTTP/1.1 308 Permanent Redirect\nLocation: /api/new" } },

  // 4xx Client Error
  { code: 400, name: "Bad Request", description: "The server cannot process the request due to malformed syntax, invalid parameters, or missing required fields.", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{invalid json}", response: "HTTP/1.1 400 Bad Request\n\n{\"error\": \"Invalid JSON in request body\"}" } },
  { code: 401, name: "Unauthorized", description: "Authentication is required. The client must provide valid credentials (e.g., Bearer token, API key).", category: "4xx", example: { request: "GET /api/profile HTTP/1.1", response: "HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Bearer" } },
  { code: 403, name: "Forbidden", description: "The server understood the request but refuses to authorize it. The client does not have permission.", category: "4xx", example: { request: "DELETE /api/admin/users/1 HTTP/1.1\nAuthorization: Bearer user-token", response: "HTTP/1.1 403 Forbidden\n\n{\"error\": \"Admin access required\"}" } },
  { code: 404, name: "Not Found", description: "The requested resource could not be found on the server.", category: "4xx", example: { request: "GET /api/users/999 HTTP/1.1", response: "HTTP/1.1 404 Not Found\n\n{\"error\": \"User not found\"}" } },
  { code: 405, name: "Method Not Allowed", description: "The HTTP method used is not supported for the requested resource.", category: "4xx", example: { request: "DELETE /api/readonly-resource HTTP/1.1", response: "HTTP/1.1 405 Method Not Allowed\nAllow: GET, HEAD" } },
  { code: 408, name: "Request Timeout", description: "The server timed out waiting for the request from the client.", category: "4xx" },
  { code: 409, name: "Conflict", description: "The request conflicts with the current state of the resource (e.g., duplicate entry, version mismatch).", category: "4xx", example: { request: "PUT /api/users/1 HTTP/1.1\nIf-Match: \"old-etag\"\n\n{\"name\": \"Updated\"}", response: "HTTP/1.1 409 Conflict\n\n{\"error\": \"Resource was modified by another request\"}" } },
  { code: 410, name: "Gone", description: "The resource was once available but has been intentionally and permanently removed.", category: "4xx" },
  { code: 413, name: "Content Too Large", description: "The request body is larger than the server is willing to accept.", category: "4xx", example: { request: "POST /api/upload HTTP/1.1\nContent-Length: 104857600", response: "HTTP/1.1 413 Content Too Large\n\n{\"error\": \"Maximum upload size is 10MB\"}" } },
  { code: 415, name: "Unsupported Media Type", description: "The media type of the request body is not supported by the server.", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: text/xml\n\n<user><name>Bob</name></user>", response: "HTTP/1.1 415 Unsupported Media Type\n\n{\"error\": \"Expected application/json\"}" } },
  { code: 422, name: "Unprocessable Content", description: "The request body is syntactically correct but semantically invalid (e.g., validation errors).", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{\"name\": \"\", \"email\": \"not-an-email\"}", response: "HTTP/1.1 422 Unprocessable Content\n\n{\"errors\": {\"name\": \"required\", \"email\": \"invalid\"}}" } },
  { code: 429, name: "Too Many Requests", description: "The client has sent too many requests in a given time period (rate limiting).", category: "4xx", example: { request: "GET /api/search?q=test HTTP/1.1", response: "HTTP/1.1 429 Too Many Requests\nRetry-After: 60\n\n{\"error\": \"Rate limit exceeded\"}" } },
  { code: 451, name: "Unavailable For Legal Reasons", description: "The resource is unavailable due to legal reasons, such as censorship or government-mandated restrictions.", category: "4xx" },

  // 5xx Server Error
  { code: 500, name: "Internal Server Error", description: "The server encountered an unexpected condition that prevented it from fulfilling the request.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 500 Internal Server Error\n\n{\"error\": \"An unexpected error occurred\"}" } },
  { code: 502, name: "Bad Gateway", description: "The server, acting as a gateway or proxy, received an invalid response from the upstream server.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 502 Bad Gateway\n\n{\"error\": \"Upstream service unavailable\"}" } },
  { code: 503, name: "Service Unavailable", description: "The server is temporarily unable to handle the request, usually due to maintenance or overload.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 503 Service Unavailable\nRetry-After: 300\n\n{\"error\": \"Service under maintenance\"}" } },
  { code: 504, name: "Gateway Timeout", description: "The server, acting as a gateway or proxy, did not receive a timely response from the upstream server.", category: "5xx", example: { request: "GET /api/slow-query HTTP/1.1", response: "HTTP/1.1 504 Gateway Timeout\n\n{\"error\": \"Upstream server timed out\"}" } },
]

export const CATEGORY_LABELS: Record<HttpStatusCategory, string> = {
  "1xx": "Informational",
  "2xx": "Success",
  "3xx": "Redirection",
  "4xx": "Client Error",
  "5xx": "Server Error",
}

export const CATEGORY_STYLES: Record<HttpStatusCategory, string> = {
  "1xx": "bg-blue-500/15 text-blue-500",
  "2xx": "bg-green-500/15 text-green-500",
  "3xx": "bg-yellow-500/15 text-yellow-500",
  "4xx": "bg-orange-500/15 text-orange-500",
  "5xx": "bg-red-500/15 text-red-500",
}
```

- [ ] **Step 2: Create HttpStatusCodes component**

Create `src/components/httpstatus/HttpStatusCodes.tsx`:

```tsx
import { useState, useMemo } from "react"
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import {
  HTTP_STATUS_CODES,
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  type HttpStatusCategory,
  type HttpStatusCode,
} from "@/data/httpStatusCodes"

export function HttpStatusCodes() {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return HTTP_STATUS_CODES
    const q = search.toLowerCase()
    return HTTP_STATUS_CODES.filter(
      (s) =>
        String(s.code).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<HttpStatusCategory, HttpStatusCode[]> = {
      "1xx": [],
      "2xx": [],
      "3xx": [],
      "4xx": [],
      "5xx": [],
    }
    for (const code of filtered) {
      groups[code.category].push(code)
    }
    return groups
  }, [filtered])

  const toggleExpanded = (code: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          HTTP Status Codes
        </span>
        <span className="text-[10px] text-muted-foreground">
          {filtered.length} codes
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or description…"
            className="w-full h-8 text-sm bg-transparent border border-border rounded-md pl-8 pr-3 text-foreground outline-none placeholder:text-muted-foreground"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status codes list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-4">
          {(Object.keys(grouped) as HttpStatusCategory[]).map((cat) => {
            const codes = grouped[cat]
            if (codes.length === 0) return null
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_STYLES[cat]}`}
                  >
                    {cat}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
                <div className="space-y-1">
                  {codes.map((status) => {
                    const isOpen = expanded.has(status.code)
                    return (
                      <div
                        key={status.code}
                        className="border border-border rounded-md overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpanded(status.code)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                        >
                          {isOpen ? (
                            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm font-mono font-semibold ${CATEGORY_STYLES[status.category].split(" ")[1]}`}
                          >
                            {status.code}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {status.name}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-3">
                              {status.description}
                            </p>
                            {status.example && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Request
                                  </span>
                                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                                    {status.example.request}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                                    Response
                                  </span>
                                  <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                                    {status.example.response}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add to router**

In `src/router.tsx`, add lazy import:

```tsx
const HttpStatusCodes = React.lazy(() =>
  import("@/components/httpstatus/HttpStatusCodes").then((m) => ({
    default: m.HttpStatusCodes,
  })),
)
```

Add route inside `dev-tools` children:

```tsx
{ path: "http-status", element: lazy_(HttpStatusCodes) },
```

- [ ] **Step 4: Add to tool registry**

In `src/config/toolRegistry.ts`, add to Dev Tools section:

```tsx
{
  id: "http-status",
  label: "HTTP Status",
  description: "Searchable HTTP status codes reference with request/response examples",
  icon: GlobeIcon,
  categoryId: "dev-tools",
  path: "/dev-tools/http-status",
},
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/data/httpStatusCodes.ts src/components/httpstatus/HttpStatusCodes.tsx src/router.tsx src/config/toolRegistry.ts
git commit -m "feat: add HTTP Status Codes reference tool"
```

---

### Task 10: Final Build Verification

- [ ] **Step 1: Full production build**

```bash
npm run build
```

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```

Visit each new route and verify it loads:
- `/converters/yaml-json`
- `/dev-tools/sql-formatter`
- `/dev-tools/text-diff`
- `/dev-tools/json-to-types`
- `/dev-tools/cron`
- `/dev-tools/http-status`

Also verify:
- Each tool appears in the sidebar under its category
- Each tool appears on its category landing page
- Welcome page shows the new tools
