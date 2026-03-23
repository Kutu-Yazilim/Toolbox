import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import {
  PlayIcon,
  UploadIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  DatabaseIcon,
  TableIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react"
import initSqlJs, { type Database } from "sql.js/dist/sql-asm.js"

type TableInfo = {
  name: string
  rowCount: number
  columns: { name: string; type: string }[]
}

type QueryResult = {
  columns: string[]
  values: (string | number | Uint8Array | null)[][]
}

type SortState = {
  column: number
  direction: "asc" | "desc"
} | null

const EXAMPLE_SQL = `-- Try some queries on your loaded tables
-- Example: SELECT * FROM my_table LIMIT 10;
SELECT 1 + 1 AS result;`

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n")
  if (lines.length === 0) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)
  const rows = lines.slice(1).filter((l) => l.trim()).map((l) => parseCsvLine(l, delimiter))

  return { headers, rows }
}

function detectDelimiter(line: string): string {
  const counts: Record<string, number> = { ",": 0, "\t": 0, ";": 0, "|": 0 }
  for (const ch of line) {
    if (ch in counts) counts[ch]++
  }
  let best = ","
  let bestCount = 0
  for (const [d, c] of Object.entries(counts)) {
    if (c > bestCount) {
      bestCount = c
      best = d
    }
  }
  return best
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        result.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

function sanitizeName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    .substring(0, 64) || "table_data"
}

function inferColumnType(values: string[]): string {
  if (values.length === 0) return "TEXT"
  const nonEmpty = values.filter((v) => v !== "")
  if (nonEmpty.length === 0) return "TEXT"
  const allNumeric = nonEmpty.every((v) => !isNaN(Number(v)) && v.trim() !== "")
  return allNumeric ? "REAL" : "TEXT"
}

function formatCellValue(value: string | number | Uint8Array | null): string {
  if (value === null) return "NULL"
  if (value instanceof Uint8Array) return `[BLOB ${value.length} bytes]`
  return String(value)
}

export function SqlPlayground() {
  const [db, setDb] = useState<Database | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [sql, setSql] = useState(EXAMPLE_SQL)
  const [results, setResults] = useState<QueryResult[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [execTime, setExecTime] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [sortState, setSortState] = useState<SortState>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dbRef = useRef<Database | null>(null)

  useEffect(() => {
    let cancelled = false
    initSqlJs()
      .then((SQL) => {
        if (cancelled) return
        const database = new SQL.Database()
        dbRef.current = database
        setDb(database)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setInitError(err instanceof Error ? err.message : "Failed to initialize SQLite")
        setLoading(false)
      })

    return () => {
      cancelled = true
      dbRef.current?.close()
    }
  }, [])

  const refreshTables = useCallback(
    (database: Database) => {
      try {
        const result = database.exec(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        )
        if (result.length === 0) {
          setTables([])
          return
        }
        const tableInfos: TableInfo[] = []
        for (const row of result[0].values) {
          const tableName = String(row[0])
          const countResult = database.exec(`SELECT COUNT(*) FROM "${tableName}"`)
          const rowCount = countResult.length > 0 ? Number(countResult[0].values[0][0]) : 0
          const pragmaResult = database.exec(`PRAGMA table_info("${tableName}")`)
          const columns =
            pragmaResult.length > 0
              ? pragmaResult[0].values.map((r) => ({
                  name: String(r[1]),
                  type: String(r[2]) || "TEXT",
                }))
              : []
          tableInfos.push({ name: tableName, rowCount, columns })
        }
        setTables(tableInfos)
      } catch {
        // ignore errors refreshing tables
      }
    },
    [],
  )

  const loadFileData = useCallback(
    (file: File) => {
      if (!db) return

      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        const tableName = sanitizeName(file.name)
        const isJson = file.name.endsWith(".json")

        try {
          let headers: string[]
          let rows: string[][]

          if (isJson) {
            const parsed = JSON.parse(text)
            const arr = Array.isArray(parsed) ? parsed : [parsed]
            if (arr.length === 0) return
            headers = Object.keys(arr[0])
            rows = arr.map((item) => headers.map((h) => String(item[h] ?? "")))
          } else {
            const csvData = parseCSV(text)
            headers = csvData.headers
            rows = csvData.rows
          }

          if (headers.length === 0) return

          const colTypes = headers.map((_, i) => inferColumnType(rows.map((r) => r[i] ?? "")))
          const colDefs = headers
            .map((h, i) => `"${h.replace(/"/g, '""')}" ${colTypes[i]}`)
            .join(", ")

          db.run(`DROP TABLE IF EXISTS "${tableName}"`)
          db.run(`CREATE TABLE "${tableName}" (${colDefs})`)

          const placeholders = headers.map(() => "?").join(", ")
          const stmt = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`)
          for (const row of rows) {
            const values = row.map((v, i) => {
              if (colTypes[i] === "REAL" && v !== "") return Number(v)
              return v
            })
            stmt.run(values)
          }
          stmt.free()

          refreshTables(db)
        } catch (err) {
          setQueryError(
            `Failed to load ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
          )
        }
      }
      reader.readAsText(file)
    },
    [db, refreshTables],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (
          file.name.endsWith(".csv") ||
          file.name.endsWith(".tsv") ||
          file.name.endsWith(".json")
        ) {
          loadFileData(file)
        }
      }
    },
    [loadFileData],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const runQuery = useCallback(() => {
    if (!db || !sql.trim()) return
    setQueryError(null)
    setSortState(null)
    const start = performance.now()
    try {
      const res = db.exec(sql)
      const elapsed = performance.now() - start
      setExecTime(elapsed)
      setResults(
        res.map((r) => ({ columns: r.columns, values: r.values as QueryResult["values"] })),
      )
      refreshTables(db)
    } catch (err) {
      const elapsed = performance.now() - start
      setExecTime(elapsed)
      setQueryError(err instanceof Error ? err.message : "Query execution failed")
      setResults([])
    }
  }, [db, sql, refreshTables])

  const handleClear = useCallback(() => {
    if (!db) return
    const tableNames = tables.map((t) => t.name)
    for (const name of tableNames) {
      db.run(`DROP TABLE IF EXISTS "${name}"`)
    }
    setTables([])
    setResults([])
    setQueryError(null)
    setExecTime(null)
    setSql(EXAMPLE_SQL)
  }, [db, tables])

  const handleEditorKeyDown = useCallback(
    (_value: string | undefined, ev: { metaKey?: boolean; ctrlKey?: boolean; key?: string; code?: string; preventDefault?: () => void }) => {
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === "Enter" || ev.code === "Enter")) {
        ev.preventDefault?.()
        runQuery()
      }
    },
    [runQuery],
  )

  const getSortedValues = useCallback(
    (result: QueryResult): QueryResult["values"] => {
      if (!sortState) return result.values
      const { column, direction } = sortState
      return [...result.values].sort((a, b) => {
        const aVal = a[column]
        const bVal = b[column]
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1
        if (bVal === null) return -1
        if (typeof aVal === "number" && typeof bVal === "number") {
          return direction === "asc" ? aVal - bVal : bVal - aVal
        }
        const aStr = String(aVal)
        const bStr = String(bVal)
        return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    },
    [sortState],
  )

  const handleSort = useCallback(
    (colIndex: number) => {
      setSortState((prev) => {
        if (prev?.column === colIndex) {
          if (prev.direction === "asc") return { column: colIndex, direction: "desc" }
          return null
        }
        return { column: colIndex, direction: "asc" }
      })
    },
    [],
  )

  const resultToCSV = useCallback((result: QueryResult): string => {
    const header = result.columns.join(",")
    const rows = result.values.map((row) =>
      row
        .map((v) => {
          const s = formatCellValue(v)
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s
        })
        .join(","),
    )
    return [header, ...rows].join("\n")
  }, [])

  const resultToJSON = useCallback((result: QueryResult): string => {
    const rows = result.values.map((row) => {
      const obj: Record<string, unknown> = {}
      result.columns.forEach((col, i) => {
        obj[col] = row[i]
      })
      return obj
    })
    return JSON.stringify(rows, null, 2)
  }, [])

  const copyToClipboard = useCallback(
    (format: "csv" | "json") => {
      if (results.length === 0) return
      const text = format === "csv" ? resultToCSV(results[0]) : resultToJSON(results[0])
      navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    },
    [results, resultToCSV, resultToJSON],
  )

  const downloadCSV = useCallback(() => {
    if (results.length === 0) return
    const csv = resultToCSV(results[0])
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query_results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [results, resultToCSV])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <DatabaseIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Initializing SQLite...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">Failed to initialize SQLite: {initError}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <DatabaseIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {tables.length === 0
              ? "No tables loaded"
              : `${tables.length} table${tables.length !== 1 ? "s" : ""} loaded`}
          </span>
          {tables.map((t) => (
            <span
              key={t.name}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              title={t.columns.map((c) => `${c.name} (${c.type})`).join(", ")}
            >
              <TableIcon className="h-3 w-3" />
              {t.name}
              <span className="opacity-60">({t.rowCount})</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.json"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-3.5 w-3.5 mr-1" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={tables.length === 0}
          >
            <Trash2Icon className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {tables.length === 0 ? (
          /* Drop zone */
          <div
            className={`flex-1 flex items-center justify-center border-2 border-dashed rounded-lg m-4 transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <UploadIcon className="h-10 w-10" />
              <p className="text-sm font-medium">Drop CSV or JSON files here</p>
              <p className="text-xs">or click Upload to browse</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* SQL Editor + Run */}
            <div
              className="flex flex-col border-b border-border shrink-0"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="h-48">
                <Editor
                  height="100%"
                  language="sql"
                  theme="vs-dark"
                  value={sql}
                  onChange={(v) => setSql(v ?? "")}
                  onMount={(editor) => {
                    editor.onKeyDown((e) => {
                      handleEditorKeyDown(undefined, {
                        metaKey: e.metaKey,
                        ctrlKey: e.ctrlKey,
                        code: e.code,
                        preventDefault: () => e.preventDefault(),
                      })
                    })
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 8 },
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30">
                <Button size="sm" onClick={runQuery}>
                  <PlayIcon className="h-3.5 w-3.5 mr-1" />
                  Run
                </Button>
                <span className="text-xs text-muted-foreground">
                  {/Mac|iPhone|iPad/.test(navigator.userAgent) ? "Cmd" : "Ctrl"}+Enter to run
                </span>
                {execTime !== null && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {execTime < 1 ? "<1" : execTime.toFixed(1)}ms
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 flex flex-col min-h-0 overflow-auto">
              {queryError && (
                <div className="mx-3 mt-2 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {queryError}
                </div>
              )}

              {results.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Export buttons */}
                  <div className="flex items-center gap-1 px-3 py-1.5 shrink-0 border-b border-border">
                    <span className="text-xs text-muted-foreground mr-2">
                      {results[0].values.length} row{results[0].values.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("csv")}
                      className="h-7 text-xs"
                    >
                      {copiedFormat === "csv" ? (
                        <CheckIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <CopyIcon className="h-3 w-3 mr-1" />
                      )}
                      CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("json")}
                      className="h-7 text-xs"
                    >
                      {copiedFormat === "json" ? (
                        <CheckIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <CopyIcon className="h-3 w-3 mr-1" />
                      )}
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadCSV}
                      className="h-7 text-xs"
                    >
                      <DownloadIcon className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>

                  {/* Results table */}
                  <div className="flex-1 overflow-auto">
                    {results.map((result, ri) => (
                      <table key={ri} className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                          <tr>
                            {result.columns.map((col, ci) => (
                              <th
                                key={ci}
                                className="text-left px-3 py-1.5 font-medium text-foreground border-b border-border cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort(ci)}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {col}
                                  {sortState?.column === ci &&
                                    (sortState.direction === "asc" ? (
                                      <ArrowUpIcon className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownIcon className="h-3 w-3" />
                                    ))}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedValues(result).map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className="border-b border-border/50 hover:bg-muted/30"
                            >
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className={`px-3 py-1 font-mono text-xs ${cell === null ? "text-muted-foreground italic" : "text-foreground"}`}
                                >
                                  {formatCellValue(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ))}
                  </div>
                </div>
              )}

              {results.length === 0 && !queryError && execTime !== null && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Query executed successfully (no results to display)
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
