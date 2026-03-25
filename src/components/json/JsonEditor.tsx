"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    DownloadIcon,
    WrapTextIcon,
    MinimizeIcon,
    CheckIcon,
    AlertCircleIcon,
} from "lucide-react"
import Editor from "@monaco-editor/react"

const EXAMPLE_JSON = `{
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

function tryParseJson(value: string): { valid: boolean; error: string | null; parsed?: unknown } {
    if (!value.trim()) return { valid: true, error: null }
    try {
        const parsed = JSON.parse(value)
        return { valid: true, error: null, parsed }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Invalid JSON"
        return { valid: false, error: msg }
    }
}

export function JsonEditor() {
    const [json, setJson] = useState(EXAMPLE_JSON)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [indent, setIndent] = useState<2 | 4>(2)
    const editorRef = useRef<unknown>(null)

    const validate = useCallback((value: string) => {
        const result = tryParseJson(value)
        setError(result.error)
        return result
    }, [])

    const handleEditorChange = useCallback((value: string | undefined) => {
        const newValue = value || ""
        setJson(newValue)
        validate(newValue)
    }, [validate])

    const handleFormat = useCallback(() => {
        const result = tryParseJson(json)
        if (result.valid && result.parsed !== undefined) {
            const formatted = JSON.stringify(result.parsed, null, indent)
            setJson(formatted)
            setError(null)
        }
    }, [json, indent])

    const handleMinify = useCallback(() => {
        const result = tryParseJson(json)
        if (result.valid && result.parsed !== undefined) {
            const minified = JSON.stringify(result.parsed)
            setJson(minified)
            setError(null)
        }
    }, [json])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(json)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "formatted.json"
        a.click()
        URL.revokeObjectURL(url)
    }

    const cycleIndent = () => {
        setIndent(prev => prev === 2 ? 4 : 2)
    }

    // Validate on mount
    useEffect(() => {
        validate(json)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Handle editor mount to store ref
    const handleEditorMount = useCallback((editor: unknown) => {
        editorRef.current = editor
    }, [])

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">JSON</span>
                    {error && (
                        <span className="text-destructive text-xs flex items-center gap-1">
                            <AlertCircleIcon className="h-3 w-3" />
                            Invalid
                        </span>
                    )}
                    {!error && json.trim() && (
                        <span className="text-emerald-500 text-xs flex items-center gap-1">
                            <CheckIcon className="h-3 w-3" />
                            Valid
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
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
                    <Button variant="ghost" size="xs" onClick={handleFormat} disabled={!!error || !json.trim()} title="Format (pretty-print)">
                        <WrapTextIcon className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={handleMinify} disabled={!!error || !json.trim()} title="Minify">
                        <MinimizeIcon className="h-3 w-3" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy">
                        {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="xs" onClick={handleDownload} title="Download .json">
                        <DownloadIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 relative">
                <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={json}
                    onChange={handleEditorChange}
                    onMount={handleEditorMount}
                    theme="vs-dark"
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
                {/* Error overlay */}
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
