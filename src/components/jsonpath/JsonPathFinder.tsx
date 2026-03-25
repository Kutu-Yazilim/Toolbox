"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react"
import Editor from "@monaco-editor/react"

const SAMPLE_JSON = `{
  "store": {
    "name": "TechBooks",
    "location": {
      "city": "Istanbul",
      "country": "Turkey"
    },
    "books": [
      {
        "title": "TypeScript Handbook",
        "author": "Microsoft",
        "price": 29.99,
        "tags": ["typescript", "programming"],
        "inStock": true
      },
      {
        "title": "React Patterns",
        "author": "Kent C. Dodds",
        "price": 35.50,
        "tags": ["react", "javascript", "frontend"],
        "inStock": false
      },
      {
        "title": "Node.js Design Patterns",
        "author": "Mario Casciaro",
        "price": 42.00,
        "tags": ["node", "backend"],
        "inStock": true
      }
    ],
    "totalBooks": 3,
    "open": true
  }
}`

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function getType(value: JsonValue): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

const TYPE_COLORS: Record<string, string> = {
  string: "text-emerald-400",
  number: "text-sky-400",
  boolean: "text-amber-400",
  null: "text-rose-400",
  array: "text-violet-400",
  object: "text-orange-400",
}

const TYPE_BADGE_BG: Record<string, string> = {
  string: "bg-emerald-500/15 text-emerald-400",
  number: "bg-sky-500/15 text-sky-400",
  boolean: "bg-amber-500/15 text-amber-400",
  null: "bg-rose-500/15 text-rose-400",
  array: "bg-violet-500/15 text-violet-400",
  object: "bg-orange-500/15 text-orange-400",
}

function formatValue(value: JsonValue): string {
  if (value === null) return "null"
  if (typeof value === "string") return `"${value}"`
  return String(value)
}

// ----------- JSONPath query engine -----------

function evaluateJsonPath(root: JsonValue, expression: string): JsonValue[] {
  if (!expression.startsWith("$")) return []

  const rest = expression.slice(1)
  if (rest === "" || rest === ".") return [root]

  const tokens = tokenize(rest)
  if (tokens === null) return []

  return resolve(root, tokens)
}

function tokenize(expr: string): string[] | null {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (expr[i] === ".") {
      if (expr[i + 1] === ".") {
        // deep scan
        i += 2
        const key = readKey(expr, i)
        if (!key) return null
        tokens.push(".." + key)
        i += key.length
      } else {
        i += 1
        const key = readKey(expr, i)
        if (!key) return null
        tokens.push(key)
        i += key.length
      }
    } else if (expr[i] === "[") {
      const end = expr.indexOf("]", i)
      if (end === -1) return null
      const inner = expr.slice(i + 1, end)
      tokens.push("[" + inner + "]")
      i = end + 1
    } else {
      return null
    }
  }
  return tokens
}

function readKey(expr: string, start: number): string {
  let i = start
  while (i < expr.length && expr[i] !== "." && expr[i] !== "[") i++
  return expr.slice(start, i)
}

function resolve(current: JsonValue, tokens: string[]): JsonValue[] {
  if (tokens.length === 0) return [current]

  const [token, ...remaining] = tokens

  // deep scan: ..key
  if (token.startsWith("..")) {
    const key = token.slice(2)
    const results: JsonValue[] = []
    deepScan(current, key, remaining, results)
    return results
  }

  // wildcard array: [*]
  if (token === "[*]") {
    if (Array.isArray(current)) {
      return current.flatMap((item) => resolve(item, remaining))
    }
    if (current !== null && typeof current === "object") {
      return Object.values(current).flatMap((item) => resolve(item, remaining))
    }
    return []
  }

  // numeric index: [N]
  if (token.startsWith("[") && token.endsWith("]")) {
    const inner = token.slice(1, -1)
    const idx = Number(inner)
    if (!Number.isNaN(idx) && Array.isArray(current)) {
      const item = current[idx]
      return item !== undefined ? resolve(item, remaining) : []
    }
    // quoted key: ['key'] or ["key"]
    const quotedMatch = inner.match(/^['"](.+)['"]$/)
    if (quotedMatch && current !== null && typeof current === "object" && !Array.isArray(current)) {
      const val = (current as Record<string, JsonValue>)[quotedMatch[1]]
      return val !== undefined ? resolve(val, remaining) : []
    }
    return []
  }

  // child key
  if (current !== null && typeof current === "object" && !Array.isArray(current)) {
    const obj = current as Record<string, JsonValue>
    if (token in obj) {
      return resolve(obj[token], remaining)
    }
  }

  return []
}

function deepScan(current: JsonValue, key: string, remaining: string[], results: JsonValue[]) {
  if (current !== null && typeof current === "object") {
    if (!Array.isArray(current)) {
      const obj = current as Record<string, JsonValue>
      if (key in obj) {
        results.push(...resolve(obj[key], remaining))
      }
      for (const v of Object.values(obj)) {
        deepScan(v, key, remaining, results)
      }
    } else {
      for (const item of current) {
        deepScan(item, key, remaining, results)
      }
    }
  }
}

// ----------- Tree node component -----------

function TreeNode({
  keyName,
  value,
  path,
  jqPath,
  selectedPath,
  onSelect,
  defaultExpanded,
}: {
  keyName: string | number | null
  value: JsonValue
  path: string
  jqPath: string
  selectedPath: string | null
  onSelect: (path: string, jqPath: string) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const type = getType(value)
  const isExpandable = type === "object" || type === "array"
  const isSelected = selectedPath === path

  const childCount = isExpandable
    ? Array.isArray(value)
      ? value.length
      : Object.keys(value as Record<string, JsonValue>).length
    : 0

  const handleClick = useCallback(() => {
    onSelect(path, jqPath)
  }, [path, jqPath, onSelect])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }, [])

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? "bg-primary/15 ring-1 ring-primary/30" : ""
        }`}
        onClick={handleClick}
      >
        {isExpandable ? (
          <button onClick={handleToggle} className="flex-shrink-0 p-0.5 hover:bg-muted rounded">
            {expanded ? (
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {keyName !== null && (
          <span className="text-xs font-medium text-foreground">{String(keyName)}:</span>
        )}

        {!isExpandable && (
          <span className={`text-xs font-mono truncate ${TYPE_COLORS[type]}`}>
            {formatValue(value)}
          </span>
        )}

        <span className={`text-[10px] px-1 py-0.5 rounded font-mono flex-shrink-0 ${TYPE_BADGE_BG[type]}`}>
          {type}
          {isExpandable && (
            <span className="ml-0.5 opacity-70">
              ({childCount})
            </span>
          )}
        </span>
      </div>

      {isExpandable && expanded && (
        <div className="ml-4 border-l border-border/40 pl-1">
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <TreeNode
                  key={idx}
                  keyName={idx}
                  value={item}
                  path={`${path}[${idx}]`}
                  jqPath={`${jqPath}[${idx}]`}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                />
              ))
            : Object.entries(value as Record<string, JsonValue>).map(([k, v]) => (
                <TreeNode
                  key={k}
                  keyName={k}
                  value={v}
                  path={`${path}.${k}`}
                  jqPath={`${jqPath}.${k}`}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                />
              ))}
        </div>
      )}
    </div>
  )
}

// ----------- Main component -----------

export function JsonPathFinder() {
  const [json, setJson] = useState(SAMPLE_JSON)
  const [query, setQuery] = useState("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedJqPath, setSelectedJqPath] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const parseResult = useMemo(() => {
    if (!json.trim()) return { valid: true, error: null, parsed: undefined }
    try {
      const parsed = JSON.parse(json) as JsonValue
      return { valid: true, error: null, parsed }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON"
      return { valid: false, error: msg, parsed: undefined }
    }
  }, [json])

  const queryResults = useMemo(() => {
    if (!query.trim() || !parseResult.valid || parseResult.parsed === undefined) return null
    if (!query.startsWith("$")) return { error: true as const, values: [] }
    try {
      const values = evaluateJsonPath(parseResult.parsed, query)
      return { error: false as const, values }
    } catch {
      return { error: true as const, values: [] }
    }
  }, [query, parseResult])

  const handleEditorChange = useCallback((value: string | undefined) => {
    setJson(value || "")
  }, [])

  const handleSelect = useCallback((path: string, jqPath: string) => {
    setSelectedPath(path)
    setSelectedJqPath(jqPath)
  }, [])

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            JSON Path Finder
          </span>
          {parseResult.error && (
            <span className="text-destructive text-xs flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              Invalid JSON
            </span>
          )}
          {parseResult.valid && json.trim() && (
            <span className="text-emerald-500 text-xs flex items-center gap-1">
              <CheckIcon className="h-3 w-3" />
              Valid
            </span>
          )}
        </div>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Monaco editor */}
        <div className="w-1/2 min-h-0 border-r border-border">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={json}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 8 },
              renderLineHighlight: "none",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </div>

        {/* Right panel: tree + query */}
        <div className="w-1/2 min-h-0 flex flex-col">
          {/* Query bar */}
          <div className="flex-shrink-0 border-b border-border p-2 space-y-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="JSONPath query (e.g. $.store.books[*].title)"
              className="w-full px-2 py-1.5 text-xs font-mono rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {queryResults && (
              <div className="max-h-32 overflow-y-auto">
                {queryResults.error ? (
                  <p className="text-xs text-destructive">Invalid JSONPath query</p>
                ) : queryResults.values.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No matches</p>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      {queryResults.values.length} result{queryResults.values.length !== 1 ? "s" : ""}
                    </p>
                    {queryResults.values.map((val, i) => (
                      <div key={i} className="text-xs font-mono text-foreground bg-muted/30 px-2 py-1 rounded truncate">
                        {typeof val === "object" ? JSON.stringify(val) : formatValue(val)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected path display */}
          {selectedPath && (
            <div className="flex-shrink-0 border-b border-border px-2 py-1.5 space-y-1 bg-muted/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0">JSONPath</span>
                <code className="text-xs font-mono text-foreground truncate flex-1">{selectedPath}</code>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => copyToClipboard(selectedPath, "jsonpath")}
                  title="Copy JSONPath"
                >
                  {copiedField === "jsonpath" ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0">jq</span>
                <code className="text-xs font-mono text-foreground truncate flex-1">{selectedJqPath}</code>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => copyToClipboard(selectedJqPath!, "jq")}
                  title="Copy jq path"
                >
                  {copiedField === "jq" ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Tree view */}
          <div className="flex-1 min-h-0 overflow-auto p-2">
            {parseResult.error ? (
              <div className="flex items-center gap-2 text-destructive p-3">
                <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-mono break-words">{parseResult.error}</p>
              </div>
            ) : parseResult.parsed !== undefined ? (
              <TreeNode
                keyName={null}
                value={parseResult.parsed}
                path="$"
                jqPath="."
                selectedPath={selectedPath}
                onSelect={handleSelect}
                defaultExpanded
              />
            ) : (
              <p className="text-xs text-muted-foreground p-3">Enter JSON in the editor to explore its structure.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
