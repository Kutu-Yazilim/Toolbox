"use client"

import { useCallback, useEffect, useRef } from "react"
import { ChevronDownIcon, ChevronUpIcon, FileUpIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import type { Preset } from "@/components/shared/PresetsDrawer"
import type { ExportOption } from "@/components/shared/ExportMenu"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { useDbmlParser } from "@/hooks/useDbmlParser"
import { exportToSql } from "@/utils/sqlExporter"
import { ErDiagram } from "./ErDiagram"
import { DB_PRESETS } from "./dbPresets"
import { CHEATSHEET_ITEMS, DEFAULT_DBML, STORAGE_KEY, TOOL_ID } from "./dbConstants"

export function DbModelling() {
    const [dbml, setDbml] = useLocalStorage<string>(STORAGE_KEY, DEFAULT_DBML)
    const [cheatsheetOpen, setCheatsheetOpen] = useLocalStorage<boolean>("kutu-db-cheatsheet", false)
    const exportFnRef = useRef<(() => Promise<void>) | null>(null)
    const { database, error, parse } = useDbmlParser()
    const { isDark } = useTheme()

    const handleRestore = useCallback((restored: string) => {
        setDbml(restored)
        parse(restored)
    }, [setDbml, parse])

    const { shareUrl } = useShareableUrl<string>(TOOL_ID, dbml, handleRestore)

    const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
        accept: [".dbml", ".sql"],
        onImport: (content) => {
            setDbml(content)
            parse(content)
        },
    })

    const handleEditorChange = useCallback((value: string | undefined) => {
        const newValue = value || ""
        setDbml(newValue)
        parse(newValue)
    }, [setDbml, parse])

    const handlePresetSelect = useCallback((preset: Preset) => {
        setDbml(preset.content)
        parse(preset.content)
    }, [setDbml, parse])

    const handleExportReady = useCallback((fn: () => Promise<void>) => {
        exportFnRef.current = fn
    }, [])

    const handleDownloadDbml = useCallback(() => {
        const blob = new Blob([dbml], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "schema.dbml"
        a.click()
        URL.revokeObjectURL(url)
    }, [dbml])

    const handleExportSql = useCallback((dialect: "postgresql" | "mysql" | "sqlite") => {
        try {
            const sql = exportToSql(dbml, dialect)
            const blob = new Blob([sql], { type: "text/sql" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `schema-${dialect}.sql`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error("SQL export error:", e)
        }
    }, [dbml])

    const handleExportPng = useCallback(async () => {
        if (exportFnRef.current) {
            await exportFnRef.current()
        }
    }, [])

    const exportOptions: ExportOption[] = [
        { label: "Download .dbml", action: handleDownloadDbml },
        { label: "Export PostgreSQL", action: () => handleExportSql("postgresql") },
        { label: "Export MySQL", action: () => handleExportSql("mysql") },
        { label: "Export SQLite", action: () => handleExportSql("sqlite") },
        { label: "Export PNG", action: handleExportPng },
    ]

    const shortcuts: Shortcut[] = [
        { key: "mod+s", label: "Share link", action: () => { shareUrl() } },
        { key: "mod+shift+e", label: "Export PNG", action: handleExportPng },
        { key: "mod+o", label: "Import file", action: openFilePicker },
    ]

    useKeyboardShortcuts(shortcuts)

    useEffect(() => {
        parse(dbml)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const toolbarStatus = error
        ? { type: "error" as const, label: "Parse error" }
        : database && database.tables.length > 0
            ? { type: "success" as const, label: `${database.tables.length} tables` }
            : null

    return (
        <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <FileUpIcon className="h-8 w-8" />
                        <span className="text-sm font-medium">Drop .dbml or .sql file</span>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
                {/* Editor panel */}
                <div className="flex flex-col bg-background w-full md:w-[38%] h-1/2 md:h-auto min-h-0">
                    <ToolToolbar
                        title="Editor"
                        status={toolbarStatus}
                        copyValue={dbml}
                        onShare={shareUrl}
                        exportOptions={exportOptions}
                        presets={DB_PRESETS}
                        onPresetSelect={handlePresetSelect}
                        shortcuts={shortcuts}
                        actions={
                            <>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={openFilePicker}
                                    title="Import file"
                                >
                                    <FileUpIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setCheatsheetOpen(!cheatsheetOpen)}
                                    title="DBML Cheatsheet"
                                    className={cheatsheetOpen ? "bg-muted" : ""}
                                >
                                    {cheatsheetOpen ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                            </>
                        }
                    />

                    {cheatsheetOpen && (
                        <div className="border-b border-border bg-muted/30 px-3 py-2 flex-shrink-0 overflow-y-auto max-h-48">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {CHEATSHEET_ITEMS.map((section) => (
                                    <div key={section.title}>
                                        <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                            {section.title}
                                        </h4>
                                        <div className="space-y-0.5">
                                            {section.examples.map((example, idx) => (
                                                <div key={idx}>
                                                    <code className="text-[10px] font-mono text-foreground/80">
                                                        {example.code}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground">
                                Docs: <a href="https://dbml.dbdiagram.io/docs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dbml.dbdiagram.io/docs</a>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-h-0 relative">
                        <Editor
                            height="100%"
                            defaultLanguage="sql"
                            value={dbml}
                            onChange={handleEditorChange}
                            theme={isDark ? "vs-dark" : "light"}
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
                        {error && (
                            <div className="absolute bottom-0 left-0 right-0 max-h-24 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                                <p className="text-xs text-destructive font-mono leading-relaxed break-words">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Diagram panel */}
                <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
                    <ErDiagram database={database} onExportReady={handleExportReady} />
                </div>
            </div>
        </div>
    )
}
