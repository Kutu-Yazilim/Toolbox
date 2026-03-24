import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    CopyIcon,
    CheckIcon,
    CodeIcon,
    LinkIcon,
    UnlinkIcon,
} from "lucide-react"
import Editor, { type OnMount } from "@monaco-editor/react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

const MONACO_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    padding: { top: 8 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
}

const DEFAULT_MARKDOWN = `# Markdown Preview

Welcome to the **Markdown Preview** tool. This editor supports GitHub Flavored Markdown.

## Features

- **Bold**, *italic*, and ~~strikethrough~~ text
- [Links](https://example.com) and inline \`code\`
- Code blocks with syntax highlighting

### Code Example

\`\`\`typescript
interface User {
  id: number
  name: string
  roles: string[]
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
\`\`\`

### Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Tables | Done | High |
| Task lists | Done | High |
| Code blocks | Done | Medium |
| Blockquotes | Done | Low |

### Task List

- [x] Basic markdown rendering
- [x] GitHub Flavored Markdown
- [x] Live preview
- [ ] Export to PDF

### Blockquote

> "Simplicity is the ultimate sophistication."
>
> This blockquote supports **formatting** and *emphasis*.

---

### Ordered List

1. First item
2. Second item
3. Third item

Start editing on the left to see live changes on the right.
`

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl font-semibold text-foreground mt-5 mb-2 pb-1.5 border-b border-border">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-base font-semibold text-foreground mt-3 mb-1.5">{children}</h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-xs font-semibold text-muted-foreground mt-3 mb-1">{children}</h6>
    ),
    p: ({ children }) => (
        <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="list-disc list-inside text-sm text-foreground/90 mb-3 space-y-1 pl-2">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal list-inside text-sm text-foreground/90 mb-3 space-y-1 pl-2">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="text-sm leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-sm text-muted-foreground italic">
            {children}
        </blockquote>
    ),
    code: ({ className, children }) => {
        const isBlock = className?.includes("language-")
        if (isBlock) {
            return (
                <code className={`block text-xs font-mono ${className || ""}`}>
                    {children}
                </code>
            )
        }
        return (
            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/90">
                {children}
            </code>
        )
    },
    pre: ({ children }) => (
        <pre className="bg-muted/50 border border-border rounded-md px-4 py-3 mb-3 overflow-x-auto text-xs font-mono leading-relaxed">
            {children}
        </pre>
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto mb-3">
            <table className="min-w-full text-sm border border-border rounded">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-muted/40">{children}</thead>
    ),
    th: ({ children }) => (
        <th className="px-3 py-1.5 text-left text-xs font-semibold text-foreground border-b border-border">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-1.5 text-sm text-foreground/80 border-b border-border">
            {children}
        </td>
    ),
    hr: () => <hr className="border-border my-4" />,
    input: ({ type, checked, ...props }) => {
        if (type === "checkbox") {
            return (
                <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-1.5 rounded accent-primary"
                    {...props}
                />
            )
        }
        return <input type={type} {...props} />
    },
    img: ({ src, alt }) => (
        <img src={src} alt={alt} className="max-w-full rounded my-2" />
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic">{children}</em>
    ),
    del: ({ children }) => (
        <del className="line-through text-muted-foreground">{children}</del>
    ),
}

export function MarkdownPreview() {
    const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
    const [copiedMd, setCopiedMd] = useState(false)
    const [copiedHtml, setCopiedHtml] = useState(false)
    const [syncScroll, setSyncScroll] = useState(true)
    const previewRef = useRef<HTMLDivElement>(null)
    const previewScrollRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const isSyncingRef = useRef(false)

    const handleEditorChange = useCallback((value: string | undefined) => {
        setMarkdown(value || "")
    }, [])

    const handleEditorMount: OnMount = useCallback((editor) => {
        editorRef.current = editor

        // Sync: editor scroll → preview scroll
        editor.onDidScrollChange((e) => {
            if (!syncScroll || isSyncingRef.current) return
            const previewEl = previewScrollRef.current
            if (!previewEl) return

            const editorModel = editor.getModel()
            if (!editorModel) return

            const scrollTop = e.scrollTop
            const layoutHeight = editor.getLayoutInfo().height
            const scrollHeight = e.scrollHeight - layoutHeight
            if (scrollHeight <= 0) return

            const ratio = scrollTop / scrollHeight
            const previewScrollHeight = previewEl.scrollHeight - previewEl.clientHeight
            if (previewScrollHeight <= 0) return

            isSyncingRef.current = true
            previewEl.scrollTop = ratio * previewScrollHeight
            requestAnimationFrame(() => { isSyncingRef.current = false })
        })
    }, [syncScroll])

    // Sync: preview scroll → editor scroll
    useEffect(() => {
        const previewEl = previewScrollRef.current
        if (!previewEl) return

        const handlePreviewScroll = () => {
            if (!syncScroll || isSyncingRef.current) return
            const editor = editorRef.current
            if (!editor) return

            const scrollTop = previewEl.scrollTop
            const scrollHeight = previewEl.scrollHeight - previewEl.clientHeight
            if (scrollHeight <= 0) return

            const ratio = scrollTop / scrollHeight
            const editorScrollHeight = editor.getScrollHeight() - (editor.getLayoutInfo().height || 0)
            if (editorScrollHeight <= 0) return

            isSyncingRef.current = true
            editor.setScrollTop(ratio * editorScrollHeight)
            requestAnimationFrame(() => { isSyncingRef.current = false })
        }

        previewEl.addEventListener("scroll", handlePreviewScroll)
        return () => previewEl.removeEventListener("scroll", handlePreviewScroll)
    }, [syncScroll])

    const handleCopyMarkdown = async () => {
        await navigator.clipboard.writeText(markdown)
        setCopiedMd(true)
        setTimeout(() => setCopiedMd(false), 2000)
    }

    const handleCopyHtml = async () => {
        if (previewRef.current) {
            await navigator.clipboard.writeText(previewRef.current.innerHTML)
            setCopiedHtml(true)
            setTimeout(() => setCopiedHtml(false), 2000)
        }
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Two-panel layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-px bg-border">
                {/* Editor panel (left) */}
                <div className="flex flex-col bg-background w-full md:w-1/2 h-1/2 md:h-auto min-h-0">
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Markdown
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="xs" onClick={handleCopyMarkdown} title="Copy Markdown">
                                {copiedMd ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage="markdown"
                            value={markdown}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                            theme="vs-dark"
                            options={MONACO_OPTIONS}
                        />
                    </div>
                </div>

                {/* Preview panel (right) */}
                <div className="flex-1 flex flex-col bg-background min-w-0 h-1/2 md:h-auto min-h-0">
                    {/* Preview toolbar */}
                    <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Preview
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setSyncScroll(!syncScroll)}
                                title={syncScroll ? "Disable scroll sync" : "Enable scroll sync"}
                                className={syncScroll ? "text-primary" : "text-muted-foreground"}
                            >
                                {syncScroll ? <LinkIcon className="h-3 w-3" /> : <UnlinkIcon className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="xs" onClick={handleCopyHtml} title="Copy HTML">
                                {copiedHtml ? (
                                    <CheckIcon className="h-3 w-3" />
                                ) : (
                                    <CodeIcon className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Rendered preview */}
                    <div ref={previewScrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                        <div ref={previewRef} className="max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
