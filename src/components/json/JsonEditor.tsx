"use client"

import { useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    WrapTextIcon,
    MinimizeIcon,
    ArrowDownAZIcon,
    UploadIcon,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { JsonTreeView } from "./JsonTreeView"
import { JsonStatusBar } from "./JsonStatusBar"
import { JSON_PRESETS } from "./jsonPresets"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useFileImport } from "@/hooks/useFileImport"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { useTheme } from "@/hooks/useTheme"
import { sortKeys } from "@/utils/jsonTransforms"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ExportOption } from "@/components/shared/ExportMenu"

const STORAGE_KEY = "kutu-json-editor"
const TOOL_ID = "json-editor"

const DEFAULT_JSON = `{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "roles": ["admin", "editor"]
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "roles": ["viewer"]
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 10
  }
}`

interface EditorState {
    json: string
    indent: 2 | 4
}

const DEFAULT_STATE: EditorState = {
    json: DEFAULT_JSON,
    indent: 2,
}

function tryParse(value: string): { valid: boolean; error: string | null; parsed?: unknown } {
    if (!value.trim()) return { valid: true, error: null }
    try {
        return { valid: true, error: null, parsed: JSON.parse(value) }
    } catch (e: unknown) {
        return { valid: false, error: e instanceof Error ? e.message : "Invalid JSON" }
    }
}

function downloadBlob(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function JsonEditor() {
    const { isDark } = useTheme()
    const [state, setState] = useLocalStorage<EditorState>(STORAGE_KEY, DEFAULT_STATE)
    const [selectedPath, setSelectedPath] = useLocalStorage<string | null>(`${STORAGE_KEY}-path`, null)
    const editorRef = useRef<unknown>(null)

    const { json, indent } = state

    const setJson = useCallback(
        (value: string) => setState((prev) => ({ ...prev, json: value })),
        [setState],
    )

    const setIndent = useCallback(
        (value: 2 | 4) => setState((prev) => ({ ...prev, indent: value })),
        [setState],
    )

    const parseResult = useMemo(() => tryParse(json), [json])
    const isValid = parseResult.valid
    const error = parseResult.error

    // --- Shareable URL ---
    const onRestore = useCallback(
        (restored: EditorState) => setState(restored),
        [setState],
    )
    const { shareUrl } = useShareableUrl<EditorState>(TOOL_ID, state, onRestore)

    // --- File import ---
    const onImport = useCallback(
        (content: string) => setJson(content),
        [setJson],
    )
    const { dropzoneProps, openFilePicker, isDragging } = useFileImport({
        accept: [".json"],
        onImport,
    })

    // --- Actions ---
    const handleFormat = useCallback(() => {
        const result = tryParse(json)
        if (result.valid && result.parsed !== undefined) {
            setJson(JSON.stringify(result.parsed, null, indent))
        }
    }, [json, indent, setJson])

    const handleMinify = useCallback(() => {
        const result = tryParse(json)
        if (result.valid && result.parsed !== undefined) {
            setJson(JSON.stringify(result.parsed))
        }
    }, [json, setJson])

    const handleSortKeys = useCallback(() => {
        try {
            const sorted = sortKeys(json)
            const parsed = JSON.parse(sorted)
            setJson(JSON.stringify(parsed, null, indent))
        } catch {
            // JSON is invalid, do nothing
        }
    }, [json, indent, setJson])

    const cycleIndent = useCallback(() => {
        setIndent(indent === 2 ? 4 : 2)
    }, [indent, setIndent])

    const handleEditorChange = useCallback(
        (value: string | undefined) => setJson(value ?? ""),
        [setJson],
    )

    const handleEditorMount = useCallback((editor: unknown) => {
        editorRef.current = editor
    }, [])

    const handlePresetSelect = useCallback(
        (preset: Preset) => setJson(preset.content),
        [setJson],
    )

    // --- Keyboard shortcuts ---
    const shortcuts: Shortcut[] = useMemo(
        () => [
            { key: "mod+s", label: "Format JSON", action: handleFormat },
            { key: "mod+shift+m", label: "Minify JSON", action: handleMinify },
        ],
        [handleFormat, handleMinify],
    )
    useKeyboardShortcuts(shortcuts)

    // --- Export options ---
    const exportOptions: ExportOption[] = useMemo(
        () => [
            {
                label: "Download formatted (.json)",
                action: () => {
                    const result = tryParse(json)
                    if (result.valid && result.parsed !== undefined) {
                        downloadBlob(JSON.stringify(result.parsed, null, indent), "formatted.json", "application/json")
                    }
                },
            },
            {
                label: "Download minified (.json)",
                action: () => {
                    const result = tryParse(json)
                    if (result.valid && result.parsed !== undefined) {
                        downloadBlob(JSON.stringify(result.parsed), "minified.json", "application/json")
                    }
                },
            },
        ],
        [json, indent],
    )

    // --- Toolbar status ---
    const status = useMemo(() => {
        if (!json.trim()) return null
        if (isValid) return { type: "success" as const, label: "Valid" }
        return { type: "error" as const, label: "Invalid" }
    }, [json, isValid])

    // --- Toolbar actions ---
    const toolbarActions = useMemo(
        () => (
            <>
                <Button
                    variant="ghost"
                    size="xs"
                    onClick={cycleIndent}
                    title={`Indent: ${indent} spaces (click to toggle)`}
                    className="font-mono text-[10px] w-8"
                >
                    {indent}sp
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="ghost" size="xs" onClick={handleFormat} disabled={!isValid || !json.trim()} title="Format (pretty-print)">
                    <WrapTextIcon className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="xs" onClick={handleMinify} disabled={!isValid || !json.trim()} title="Minify">
                    <MinimizeIcon className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="xs" onClick={handleSortKeys} disabled={!isValid || !json.trim()} title="Sort keys alphabetically">
                    <ArrowDownAZIcon className="h-3 w-3" />
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="ghost" size="xs" onClick={openFilePicker} title="Import .json file">
                    <UploadIcon className="h-3 w-3" />
                </Button>
            </>
        ),
        [cycleIndent, indent, handleFormat, handleMinify, handleSortKeys, isValid, json, openFilePicker],
    )

    return (
        <div className="h-full flex flex-col min-h-0" {...dropzoneProps}>
            <ToolToolbar
                title="JSON"
                status={status}
                actions={toolbarActions}
                copyValue={json}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={JSON_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
            />

            <div className="flex-1 flex min-h-0 relative">
                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-md flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">Drop .json file here</span>
                    </div>
                )}

                {/* Editor panel */}
                <div className="flex-[3] min-w-0 border-r border-border relative">
                    <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={json}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        theme={isDark ? "vs-dark" : "light"}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            tabSize: indent,
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
                            formatOnPaste: true,
                        }}
                    />
                    {error && (
                        <div className="absolute bottom-0 left-0 right-0 max-h-20 overflow-y-auto bg-destructive/15 backdrop-blur-sm border-t border-destructive/30 px-3 py-2">
                            <p className="text-xs text-destructive font-mono leading-relaxed break-words">{error}</p>
                        </div>
                    )}
                </div>

                {/* Tree view panel */}
                <div className="flex-[2] min-w-0 flex flex-col bg-card">
                    <div className="px-3 h-7 flex items-center border-b border-border flex-shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tree View</span>
                    </div>
                    <JsonTreeView
                        json={json}
                        isValid={isValid}
                        selectedPath={selectedPath}
                        onSelectPath={setSelectedPath}
                    />
                </div>
            </div>

            <JsonStatusBar jsonPath={selectedPath} json={json} isValid={isValid} />
        </div>
    )
}
