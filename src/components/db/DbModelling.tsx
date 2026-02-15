import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CopyIcon, DownloadIcon, PlayIcon, AlertCircleIcon, ImageIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
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
            { code: "bio text [note: 'User bio']", desc: "With note" },
        ]
    },
    {
        title: "References (Relationships)",
        examples: [
            { code: "Ref: posts.user_id > users.id", desc: "Many-to-one" },
            { code: "Ref: users.id < posts.user_id", desc: "One-to-many" },
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
            { code: "Enum status { draft, published, archived }", desc: "Define enum" },
            { code: "status status_enum", desc: "Use enum as column type" },
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
        <div className="space-y-4">
            {/* Main content grid - fixed height */}
            <div className="grid gap-4 h-[calc(100vh-200px)] min-h-[500px]" style={{ gridTemplateColumns: '35% 65%' }}>
                <Card className="flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                DBML Editor
                                {error && (
                                    <span className="text-destructive text-sm font-normal flex items-center gap-1">
                                        <AlertCircleIcon className="h-4 w-4" />
                                        Parse Error
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCopy}>
                                    <CopyIcon className="h-4 w-4 mr-1" />
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDownload}>
                                    <DownloadIcon className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <div className="h-full rounded-md overflow-hidden border">
                            <Editor
                                height="100%"
                                defaultLanguage="sql"
                                value={dbml}
                                onChange={handleEditorChange}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    tabSize: 2,
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                        {error && (
                            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                        <CardTitle className="text-lg flex items-center justify-between">
                            ER Diagram
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPng}
                                    disabled={!database || database.tables.length === 0}
                                >
                                    <ImageIcon className="h-4 w-4 mr-1" />
                                    Export PNG
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => parse(dbml)}
                                >
                                    <PlayIcon className="h-4 w-4 mr-1" />
                                    Refresh
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <div className="h-full rounded-md overflow-hidden border bg-muted/30">
                            <ErDiagram database={database} onExportReady={handleExportReady} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* DBML Cheatsheet - Collapsible */}
            <Card className="flex-shrink-0">
                <button
                    onClick={() => setCheatsheetOpen(!cheatsheetOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg"
                >
                    <span className="font-semibold text-sm">📖 DBML Cheatsheet</span>
                    {cheatsheetOpen ? (
                        <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {cheatsheetOpen && (
                    <CardContent className="pt-0 pb-4">
                        <div className="grid grid-cols-5 gap-4">
                            {CHEATSHEET_ITEMS.map((section) => (
                                <div key={section.title} className="space-y-2">
                                    <h4 className="font-semibold text-xs text-primary uppercase tracking-wide">
                                        {section.title}
                                    </h4>
                                    <div className="space-y-1.5">
                                        {section.examples.map((example, idx) => (
                                            <div key={idx} className="text-xs">
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono block mb-0.5">
                                                    {example.code}
                                                </code>
                                                <span className="text-muted-foreground text-[10px]">
                                                    {example.desc}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            📚 Full docs: <a href="https://dbml.dbdiagram.io/docs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dbml.dbdiagram.io/docs</a>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
