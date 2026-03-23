import { useState, useMemo, useCallback, useRef } from "react"
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  XIcon,
  UploadIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  BookOpenIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types & Constants ──────────────────────────────────────────────────────

type Mode = "single" | "compare"

type EnvLine =
  | { type: "comment"; raw: string }
  | { type: "empty" }
  | { type: "entry"; key: string; value: string }

type EnvEntry = {
  id: string
  key: string
  value: string
}

type DiffStatus = "left-only" | "right-only" | "different" | "same"

type DiffRow = {
  key: string
  leftValue: string | null
  rightValue: string | null
  status: DiffStatus
}

const EXAMPLE_ENV = `# Application Configuration
APP_NAME=MyApp
APP_ENV=production
APP_DEBUG=false
APP_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_production
DB_USER=admin
DB_PASSWORD=s3cret!p@ssw0rd

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
API_KEY=sk-1234567890abcdef
API_SECRET="my secret with spaces"
WEBHOOK_URL=https://example.com/hook?token=abc123&type=notify

# Feature Flags
ENABLE_CACHE=true
MAX_RETRIES=3
`

const EXAMPLE_ENV_LEFT = `# Server
APP_ENV=staging
APP_PORT=3000
DB_HOST=staging-db.internal
DB_PASSWORD=staging-pass
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=debug
`

const EXAMPLE_ENV_RIGHT = `# Server
APP_ENV=production
APP_PORT=8080
DB_HOST=prod-db.internal
DB_PASSWORD=prod-s3cret!
REDIS_URL=redis://prod-redis:6379
SENTRY_DSN=https://sentry.io/123
`

let nextId = 0
function uid(): string {
  return `env-${++nextId}`
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

function parseEnv(raw: string): EnvLine[] {
  return raw.split("\n").map((line) => {
    const trimmed = line.trim()
    if (trimmed === "") return { type: "empty" }
    if (trimmed.startsWith("#")) return { type: "comment", raw: line }
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) return { type: "comment", raw: line }
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return { type: "entry", key, value }
  })
}

function toEntries(lines: EnvLine[]): EnvEntry[] {
  return lines
    .filter((l): l is Extract<EnvLine, { type: "entry" }> => l.type === "entry")
    .map((l) => ({ id: uid(), key: l.key, value: l.value }))
}

function entriesToEnvString(entries: EnvEntry[]): string {
  return entries.map((e) => `${e.key}=${e.value}`).join("\n") + "\n"
}

function buildDiff(left: EnvEntry[], right: EnvEntry[]): DiffRow[] {
  const leftMap = new Map(left.map((e) => [e.key, e.value]))
  const rightMap = new Map(right.map((e) => [e.key, e.value]))
  const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()])
  const rows: DiffRow[] = []
  for (const key of allKeys) {
    const lv = leftMap.get(key) ?? null
    const rv = rightMap.get(key) ?? null
    if (lv !== null && rv === null) {
      rows.push({ key, leftValue: lv, rightValue: null, status: "left-only" })
    } else if (lv === null && rv !== null) {
      rows.push({ key, leftValue: null, rightValue: rv, status: "right-only" })
    } else if (lv !== rv) {
      rows.push({ key, leftValue: lv, rightValue: rv, status: "different" })
    } else {
      rows.push({ key, leftValue: lv, rightValue: rv, status: "same" })
    }
  }
  const order: DiffStatus[] = ["left-only", "different", "right-only", "same"]
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  return rows
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EnvEditor() {
  const [mode, setMode] = useState<Mode>("single")

  // Single mode state
  const [rawInput, setRawInput] = useState("")
  const [entries, setEntries] = useState<EnvEntry[]>([])
  const [hasParsed, setHasParsed] = useState(false)
  const [filter, setFilter] = useState("")
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{
    id: string
    field: "key" | "value"
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Compare mode state
  const [leftRaw, setLeftRaw] = useState("")
  const [rightRaw, setRightRaw] = useState("")
  const [leftEntries, setLeftEntries] = useState<EnvEntry[]>([])
  const [rightEntries, setRightEntries] = useState<EnvEntry[]>([])
  const [hasCompared, setHasCompared] = useState(false)
  const [compareRevealed, setCompareRevealed] = useState<Set<string>>(
    new Set(),
  )

  const fileRef = useRef<HTMLInputElement>(null)
  const leftFileRef = useRef<HTMLInputElement>(null)
  const rightFileRef = useRef<HTMLInputElement>(null)

  // ─── Single mode handlers ────────────────────────────────────────────

  const handleParse = useCallback(() => {
    const lines = parseEnv(rawInput)
    setEntries(toEntries(lines))
    setHasParsed(true)
    setRevealedIds(new Set())
    setEditingCell(null)
  }, [rawInput])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        setRawInput(text)
        const lines = parseEnv(text)
        setEntries(toEntries(lines))
        setHasParsed(true)
        setRevealedIds(new Set())
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [],
  )

  const handleLoadExample = useCallback(() => {
    if (mode === "single") {
      setRawInput(EXAMPLE_ENV)
      const lines = parseEnv(EXAMPLE_ENV)
      setEntries(toEntries(lines))
      setHasParsed(true)
      setRevealedIds(new Set())
    } else {
      setLeftRaw(EXAMPLE_ENV_LEFT)
      setRightRaw(EXAMPLE_ENV_RIGHT)
      setLeftEntries(toEntries(parseEnv(EXAMPLE_ENV_LEFT)))
      setRightEntries(toEntries(parseEnv(EXAMPLE_ENV_RIGHT)))
      setHasCompared(true)
      setCompareRevealed(new Set())
    }
  }, [mode])

  const toggleReveal = useCallback((id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const updateEntry = useCallback(
    (id: string, field: "key" | "value", val: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
      )
    },
    [],
  )

  const addRow = useCallback(() => {
    setEntries((prev) => [...prev, { id: uid(), key: "", value: "" }])
  }, [])

  const deleteRow = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const filteredEntries = useMemo(() => {
    if (!filter) return entries
    const q = filter.toLowerCase()
    return entries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q),
    )
  }, [entries, filter])

  const exportString = useMemo(() => entriesToEnvString(entries), [entries])

  const handleExport = useCallback(() => {
    const blob = new Blob([exportString], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = ".env"
    a.click()
    URL.revokeObjectURL(url)
  }, [exportString])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportString)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [exportString])

  // ─── Compare mode handlers ──────────────────────────────────────────

  const handleCompareFileUpload = useCallback(
    (side: "left" | "right") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        if (side === "left") {
          setLeftRaw(text)
          setLeftEntries(toEntries(parseEnv(text)))
        } else {
          setRightRaw(text)
          setRightEntries(toEntries(parseEnv(text)))
        }
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [],
  )

  const handleCompare = useCallback(() => {
    setLeftEntries(toEntries(parseEnv(leftRaw)))
    setRightEntries(toEntries(parseEnv(rightRaw)))
    setHasCompared(true)
    setCompareRevealed(new Set())
  }, [leftRaw, rightRaw])

  const toggleCompareReveal = useCallback((key: string) => {
    setCompareRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const diffRows = useMemo(
    () => buildDiff(leftEntries, rightEntries),
    [leftEntries, rightEntries],
  )

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-muted inline-flex rounded-lg p-[3px]">
          <button
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              mode === "single"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("single")}
          >
            Single
          </button>
          <button
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              mode === "compare"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("compare")}
          >
            Compare
          </button>
        </div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleLoadExample}>
          <BookOpenIcon />
          Load Example
        </Button>

        {mode === "single" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".env,.env.*,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <UploadIcon />
              Upload
            </Button>
            {hasParsed && (
              <>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <DownloadIcon />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Single mode */}
      {mode === "single" && (
        <>
          {!hasParsed ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">
                Paste your .env content
              </label>
              <textarea
                className="border-input bg-muted/50 min-h-[200px] w-full rounded-md border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder={`# Paste .env content here\nAPI_KEY=your-key\nDB_HOST=localhost`}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
              <Button
                className="self-start"
                onClick={handleParse}
                disabled={!rawInput.trim()}
              >
                Parse
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative max-w-xs">
                <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  className="border-input bg-muted/50 h-8 w-full rounded-md border pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Filter keys..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-3 py-2 text-left font-medium">Key</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Value
                      </th>
                      <th className="w-20 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-b-0">
                        <td className="px-3 py-1.5">
                          {editingCell?.id === entry.id &&
                          editingCell.field === "key" ? (
                            <input
                              autoFocus
                              className="bg-muted/50 w-full rounded border px-1.5 py-0.5 font-mono text-sm outline-none focus:ring-1 focus:ring-ring/50"
                              value={entry.key}
                              onChange={(e) =>
                                updateEntry(entry.id, "key", e.target.value)
                              }
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape")
                                  setEditingCell(null)
                              }}
                            />
                          ) : (
                            <span
                              className="cursor-pointer font-mono"
                              onClick={() =>
                                setEditingCell({
                                  id: entry.id,
                                  field: "key",
                                })
                              }
                            >
                              {entry.key || (
                                <span className="text-muted-foreground italic">
                                  empty
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            {editingCell?.id === entry.id &&
                            editingCell.field === "value" ? (
                              <input
                                autoFocus
                                className="bg-muted/50 w-full rounded border px-1.5 py-0.5 font-mono text-sm outline-none focus:ring-1 focus:ring-ring/50"
                                value={entry.value}
                                onChange={(e) =>
                                  updateEntry(
                                    entry.id,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Escape")
                                    setEditingCell(null)
                                }}
                              />
                            ) : (
                              <span
                                className="cursor-pointer font-mono"
                                onClick={() =>
                                  setEditingCell({
                                    id: entry.id,
                                    field: "value",
                                  })
                                }
                              >
                                {revealedIds.has(entry.id)
                                  ? entry.value || (
                                      <span className="text-muted-foreground italic">
                                        empty
                                      </span>
                                    )
                                  : entry.value
                                    ? "\u2022\u2022\u2022\u2022\u2022\u2022"
                                    : (
                                      <span className="text-muted-foreground italic">
                                        empty
                                      </span>
                                    )}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => toggleReveal(entry.id)}
                            >
                              {revealedIds.has(entry.id) ? (
                                <EyeOffIcon />
                              ) : (
                                <EyeIcon />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteRow(entry.id)}
                          >
                            <XIcon />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  <PlusIcon />
                  Add Row
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHasParsed(false)
                    setEntries([])
                    setRawInput("")
                    setFilter("")
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compare mode */}
      {mode === "compare" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Left panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Left (.env)</label>
                <div>
                  <input
                    ref={leftFileRef}
                    type="file"
                    accept=".env,.env.*,.txt"
                    className="hidden"
                    onChange={handleCompareFileUpload("left")}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => leftFileRef.current?.click()}
                  >
                    <UploadIcon />
                  </Button>
                </div>
              </div>
              <textarea
                className="border-input bg-muted/50 min-h-[180px] w-full rounded-md border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="Paste left .env content..."
                value={leftRaw}
                onChange={(e) => setLeftRaw(e.target.value)}
              />
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Right (.env)</label>
                <div>
                  <input
                    ref={rightFileRef}
                    type="file"
                    accept=".env,.env.*,.txt"
                    className="hidden"
                    onChange={handleCompareFileUpload("right")}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => rightFileRef.current?.click()}
                  >
                    <UploadIcon />
                  </Button>
                </div>
              </div>
              <textarea
                className="border-input bg-muted/50 min-h-[180px] w-full rounded-md border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="Paste right .env content..."
                value={rightRaw}
                onChange={(e) => setRightRaw(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="self-start"
            onClick={handleCompare}
            disabled={!leftRaw.trim() && !rightRaw.trim()}
          >
            Compare
          </Button>

          {/* Diff table */}
          {hasCompared && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-3 py-2 text-left font-medium">Key</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Left Value
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Right Value
                    </th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {diffRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-muted-foreground px-3 py-6 text-center"
                      >
                        No entries to compare.
                      </td>
                    </tr>
                  )}
                  {diffRows.map((row) => (
                    <tr
                      key={row.key}
                      className={cn("border-b last:border-b-0", {
                        "bg-destructive/10": row.status === "left-only",
                        "bg-green-500/10": row.status === "right-only",
                        "bg-yellow-500/10": row.status === "different",
                      })}
                    >
                      <td className="px-3 py-1.5 font-mono">{row.key}</td>
                      <td className="px-3 py-1.5 font-mono">
                        {row.leftValue === null ? (
                          <span className="text-muted-foreground italic">
                            --
                          </span>
                        ) : compareRevealed.has(row.key) ? (
                          row.leftValue
                        ) : (
                          "\u2022\u2022\u2022\u2022\u2022\u2022"
                        )}
                      </td>
                      <td className="px-3 py-1.5 font-mono">
                        {row.rightValue === null ? (
                          <span className="text-muted-foreground italic">
                            --
                          </span>
                        ) : compareRevealed.has(row.key) ? (
                          row.rightValue
                        ) : (
                          "\u2022\u2022\u2022\u2022\u2022\u2022"
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => toggleCompareReveal(row.key)}
                        >
                          {compareRevealed.has(row.key) ? (
                            <EyeOffIcon />
                          ) : (
                            <EyeIcon />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasCompared && diffRows.length > 0 && (
            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive/20 inline-block size-3 rounded" />
                Left only
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded bg-green-500/20" />
                Right only
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded bg-yellow-500/20" />
                Different values
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-muted inline-block size-3 rounded" />
                Same
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
