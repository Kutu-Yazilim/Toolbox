"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  WrapTextIcon,
  MinimizeIcon,
  Trash2Icon,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { format as formatSql } from "sql-formatter"
import type { SqlLanguage } from "sql-formatter"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { SQL_FORMATTER_PRESETS } from "./sqlFormatterPresets"

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "T-SQL" },
  { value: "plsql", label: "PL/SQL" },
]

const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 10;`

interface SqlFormatterState {
  sql: string
  dialect: SqlLanguage
}

export function SqlFormatter() {
  const [stored, setStored] = useLocalStorage<SqlFormatterState>("sql-formatter", {
    sql: EXAMPLE_SQL,
    dialect: "sql",
  })

  const [sql, setSql] = useState(stored.sql)
  const [dialect, setDialect] = useState<SqlLanguage>(stored.dialect)
  const [error, setError] = useState<string | null>(null)
  const { isDark } = useTheme()

  const persist = useCallback((newSql: string, newDialect: SqlLanguage) => {
    setStored({ sql: newSql, dialect: newDialect })
  }, [setStored])

  const { shareUrl } = useShareableUrl("sql-formatter", { sql, dialect }, (restored) => {
    setSql(restored.sql)
    setDialect(restored.dialect)
    persist(restored.sql, restored.dialect)
  })

  const { dropzoneProps, isDragging } = useFileImport({
    accept: [".sql", ".txt"],
    onImport: (content) => {
      setSql(content)
      persist(content, dialect)
    },
  })

  const handleChange = useCallback((value: string | undefined) => {
    const v = value ?? ""
    setSql(v)
    setError(null)
    persist(v, dialect)
  }, [dialect, persist])

  const handleDialectChange = useCallback((d: SqlLanguage) => {
    setDialect(d)
    persist(sql, d)
  }, [sql, persist])

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
      persist(formatted, dialect)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Format failed")
    }
  }, [sql, dialect, persist])

  const handleMinify = useCallback(() => {
    try {
      const minified = formatSql(sql, {
        language: dialect,
        tabWidth: 0,
        useTabs: false,
        keywordCase: "preserve",
      })
      const result = minified.replace(/\s+/g, " ").trim()
      setSql(result)
      setError(null)
      persist(result, dialect)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minify failed")
    }
  }, [sql, dialect, persist])

  const handleClear = useCallback(() => {
    setSql("")
    setError(null)
    persist("", dialect)
  }, [dialect, persist])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setSql(preset.content)
    setError(null)
    persist(preset.content, dialect)
  }, [dialect, persist])

  const handleDownload = useCallback(() => {
    const blob = new Blob([sql], { type: "text/sql" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query.sql"
    a.click()
    URL.revokeObjectURL(url)
  }, [sql])

  const exportOptions: ExportOption[] = useMemo(() => [
    { label: "Download .sql", action: handleDownload },
  ], [handleDownload])

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "mod+shift+f", label: "Format SQL", action: handleFormat },
    { key: "mod+shift+m", label: "Minify SQL", action: handleMinify },
    { key: "mod+shift+x", label: "Clear", action: handleClear },
  ], [handleFormat, handleMinify, handleClear])

  useKeyboardShortcuts(shortcuts)

  const status = error
    ? { type: "error" as const, label: error }
    : sql.trim()
      ? { type: "info" as const, label: `${sql.split("\n").length} lines` }
      : null

  return (
    <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
      {/* Toolbar */}
      <ToolToolbar
        title="SQL"
        status={status}
        copyValue={sql}
        onShare={shareUrl}
        exportOptions={exportOptions}
        presets={SQL_FORMATTER_PRESETS}
        onPresetSelect={handlePresetSelect}
        shortcuts={shortcuts}
        actions={
          <>
            <select
              value={dialect}
              onChange={(e) => handleDialectChange(e.target.value as SqlLanguage)}
              className="h-6 text-xs bg-transparent border border-border rounded px-1.5 text-foreground outline-none"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-border mx-0.5" />
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
            <Button
              variant="ghost"
              size="xs"
              onClick={handleClear}
              title="Clear"
            >
              <Trash2Icon className="h-3 w-3" />
            </Button>
          </>
        }
      />

      {/* Editor */}
      <div className={`flex-1 min-h-0 relative ${isDragging ? "ring-2 ring-primary ring-inset" : ""}`}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={handleChange}
          theme={isDark ? "vs-dark" : "light"}
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
