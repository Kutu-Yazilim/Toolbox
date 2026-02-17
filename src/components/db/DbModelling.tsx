import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, DownloadIcon, PlayIcon, AlertCircleIcon, ImageIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { useDbmlParser } from "@/hooks/useDbmlParser"
import { ErDiagram } from "./ErDiagram"

const EXAMPLE_DBML = `// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  email varchar [unique]
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer
  status varchar
  created_at timestamp
}

Table comments {
  id integer [primary key]
  body text
  user_id integer
  post_id integer
  created_at timestamp
}

Ref: posts.user_id > users.id // many-to-one
Ref: comments.user_id > users.id
Ref: comments.post_id > posts.id
`

const CHEATSHEET_ITEMS = [
    {
        title: "Tables",
        examples: [
            { code: "Table users { ... }", desc: "Define a table" },
            { code: "Table schema.users { ... }", desc: "With schema name" },
        ]
    },
    {
        title: "Columns",
        examples: [
            { code: "id integer [primary key]", desc: "Primary key" },
            { code: "email varchar [unique]", desc: "Unique constraint" },
            { code: "name varchar [not null]", desc: "Not null" },
            { code: "status varchar [default: 'active']", desc: "Default value" },
        ]
    },
    {
        title: "References",
        examples: [
            { code: "Ref: posts.user_id > users.id", desc: "Many-to-one" },
            { code: "Ref: users.id - profiles.id", desc: "One-to-one" },
            { code: "Ref: posts.tags <> tags.posts", desc: "Many-to-many" },
        ]
    },
    {
        title: "Indexes",
        examples: [
            { code: "indexes { email [unique] }", desc: "Unique index" },
            { code: "indexes { (user_id, post_id) [pk] }", desc: "Composite PK" },
        ]
    },
    {
        title: "Enums",
        examples: [
            { code: "Enum status { draft, published }", desc: "Define enum" },
            { code: "status status_enum", desc: "Use as column type" },
        ]
    },
]

export function DbModelling() {
    const [dbml, setDbml] = useState(EXAMPLE_DBML)
    const [copied, setCopied] = useState(false)
    const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
    const exportFnRef = useRef<(() => Promise<void>) | null>(null)
    const { database, error, parse } = useDbmlParser()

    const handleEditorChange = useCallback((value: string | undefined) => {
        const newValue = value || ""
        setDbml(newValue)
        parse(newValue)
    }, [parse])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(dbml)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([dbml], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "schema.dbml"
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleExportPng = async () => {
        if (exportFnRef.current) {
            await exportFnRef.current()
        }
    }

    const handleExportReady = useCallback((fn: () => Promise<void>) => {
        exportFnRef.current = fn
    }, [])

    // Parse on initial load
    useEffect(() => {
        parse(EXAMPLE_DBML)
    }, [parse])

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Two-panel layout */}
            <div className="flex-1 flex min-h-0 gap-px bg-border">
                {/* Editor panel */}
                <div className="flex flex-col bg-background" style={{ width: '38%' }}>
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Editor</span>
                            {error && (
                                <span className="text-destructive text-xs flex items-center gap-1">
                                    <AlertCircleIcon className="h-3 w-3" />
                                    Error
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="xs" onClick={handleCopy} title="Copy DBML">
                                {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="xs" onClick={handleDownload} title="Download .dbml">
                                <DownloadIcon className="h-3 w-3" />
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
                        </div>
                    </div>

                    {/* Cheatsheet (collapsible, compact) */}
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

                    {/* Editor + error area */}
                    <div className="flex-1 min-h-0 relative">
                        <Editor
                            height="100%"
                            defaultLanguage="sql"
                            value={dbml}
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
                        {/* Error overlay — absolutely positioned so it never affects layout */}
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
                <div className="flex-1 flex flex-col bg-background min-w-0">
                    {/* Diagram toolbar */}
                    <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ER Diagram</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={handleExportPng}
                                disabled={!database || database.tables.length === 0}
                                title="Export PNG"
                            >
                                <ImageIcon className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => parse(dbml)}
                                title="Re-parse DBML"
                            >
                                <PlayIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Diagram */}
                    <div className="flex-1 min-h-0">
                        <ErDiagram database={database} onExportReady={handleExportReady} />
                    </div>
                </div>
            </div>
        </div>
    )
}
