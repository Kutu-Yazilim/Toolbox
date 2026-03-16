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
