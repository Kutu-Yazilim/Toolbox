import { useState, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    SendIcon,
    CopyIcon,
    CheckIcon,
    AlertCircleIcon,
    PlusIcon,
    XIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    LoaderIcon,
    BookOpenIcon,
    SearchIcon,
    UploadIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    TrashIcon,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { parseOpenApiSpec, type ParsedOpenApiSpec, type OpenApiEndpoint } from "@/utils/openApiParser"
import { cn } from "@/lib/utils"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface KeyValuePair {
    key: string
    value: string
    enabled: boolean
}

interface ApiResponse {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    time: number
    size: number
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "bg-emerald-500 text-white",
    POST: "bg-blue-500 text-white",
    PUT: "bg-amber-500 text-white",
    PATCH: "bg-orange-400 text-white",
    DELETE: "bg-red-500 text-white",
}

const METHOD_COLORS_MUTED: Record<string, string> = {
    GET: "text-emerald-500",
    POST: "text-blue-500",
    PUT: "text-amber-500",
    PATCH: "text-orange-400",
    DELETE: "text-red-500",
    HEAD: "text-purple-400",
    OPTIONS: "text-muted-foreground",
}

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

function detectLanguage(body: string): string {
    try {
        JSON.parse(body)
        return "json"
    } catch {
        if (body.trim().startsWith("<")) return "html"
        return "plaintext"
    }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusBadge({ status }: { status: number }) {
    const color = status < 300
        ? "text-emerald-500 bg-emerald-500/10"
        : status < 400
            ? "text-blue-400 bg-blue-400/10"
            : status < 500
                ? "text-amber-400 bg-amber-400/10"
                : "text-destructive bg-destructive/10"

    return (
        <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${color}`}>
            {status}
        </span>
    )
}

// ── Import Modal ──────────────────────────────────────────────────

function ImportModal({
    onImport,
    onClose,
}: {
    onImport: (spec: ParsedOpenApiSpec) => void
    onClose: () => void
}) {
    const [text, setText] = useState("")
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = () => {
        setError(null)
        if (!text.trim()) {
            setError("Please paste an OpenAPI spec or upload a file")
            return
        }
        try {
            const parsed = JSON.parse(text)
            const spec = parseOpenApiSpec(parsed)
            onImport(spec)
        } catch (e: unknown) {
            if (e instanceof SyntaxError) {
                setError("Invalid JSON: " + e.message)
            } else {
                setError(e instanceof Error ? e.message : "Failed to parse spec")
            }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)
        const reader = new FileReader()
        reader.onload = () => {
            const content = reader.result as string
            setText(content)
            // Auto-import on file upload
            try {
                const parsed = JSON.parse(content)
                const spec = parseOpenApiSpec(parsed)
                onImport(spec)
            } catch (err: unknown) {
                if (err instanceof SyntaxError) {
                    setError("Invalid JSON: " + err.message)
                } else {
                    setError(err instanceof Error ? err.message : "Failed to parse spec")
                }
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80%]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-10 border-b border-border flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Import OpenAPI Spec</span>
                    <Button variant="ghost" size="xs" onClick={onClose}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col gap-3 p-4 min-h-0">
                    <textarea
                        value={text}
                        onChange={e => { setText(e.target.value); setError(null) }}
                        placeholder="Paste your OpenAPI / Swagger JSON spec here..."
                        className="flex-1 min-h-[200px] w-full px-3 py-2 text-xs font-mono bg-muted/30 border border-border rounded-md resize-none outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                        spellCheck={false}
                    />

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                    >
                        <UploadIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">Upload .json file</span>
                    </Button>

                    {error && (
                        <div className="flex items-start gap-1.5 text-destructive text-xs">
                            <AlertCircleIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 h-12 border-t border-border flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <span className="text-xs">Cancel</span>
                    </Button>
                    <Button variant="default" size="sm" onClick={handleImport} disabled={!text.trim()}>
                        <span className="text-xs">Import</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Endpoint Sidebar ──────────────────────────────────────────────

function EndpointSidebar({
    spec,
    search,
    onSearchChange,
    onSelect,
    onClose,
    onClear,
    className,
}: {
    spec: ParsedOpenApiSpec
    search: string
    onSearchChange: (val: string) => void
    onSelect: (endpoint: OpenApiEndpoint) => void
    onClose: () => void
    onClear: () => void
    className?: string
}) {
    const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set())

    const filteredEndpoints = useMemo(() => {
        if (!search.trim()) return spec.endpoints
        const q = search.toLowerCase()
        return spec.endpoints.filter(
            ep => ep.path.toLowerCase().includes(q)
                || ep.summary.toLowerCase().includes(q)
                || ep.method.toLowerCase().includes(q)
        )
    }, [spec.endpoints, search])

    const groupedByTag = useMemo(() => {
        const groups: Record<string, OpenApiEndpoint[]> = {}
        for (const ep of filteredEndpoints) {
            if (!groups[ep.tag]) groups[ep.tag] = []
            groups[ep.tag].push(ep)
        }
        return groups
    }, [filteredEndpoints])

    const toggleTag = (tag: string) => {
        setCollapsedTags(prev => {
            const next = new Set(prev)
            if (next.has(tag)) next.delete(tag)
            else next.add(tag)
            return next
        })
    }

    return (
        <div className={cn("flex flex-col bg-background h-full w-full md:w-[240px]", className)}>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-2 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-1 min-w-0">
                    <BookOpenIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] font-medium text-foreground truncate">{spec.title}</span>
                    {spec.version && (
                        <span className="text-[9px] text-muted-foreground flex-shrink-0">v{spec.version}</span>
                    )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button variant="ghost" size="xs" onClick={onClear} title="Remove spec">
                        <TrashIcon className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={onClose} title="Hide sidebar">
                        <PanelLeftCloseIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="px-2 py-1.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-1.5 h-6 px-2 bg-muted/30 border border-border rounded">
                    <SearchIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search endpoints..."
                        className="flex-1 min-w-0 text-[11px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                        spellCheck={false}
                    />
                    {search && (
                        <button onClick={() => onSearchChange("")} className="text-muted-foreground hover:text-foreground">
                            <XIcon className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Endpoint list */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {Object.keys(groupedByTag).length === 0 ? (
                    <div className="px-3 py-4 text-[11px] text-muted-foreground text-center">
                        No endpoints found
                    </div>
                ) : (
                    Object.entries(groupedByTag).map(([tag, endpoints]) => (
                        <div key={tag}>
                            {/* Tag header */}
                            <button
                                onClick={() => toggleTag(tag)}
                                className="flex items-center gap-1 w-full px-2 py-1.5 text-left hover:bg-muted/30 transition-colors"
                            >
                                {collapsedTags.has(tag) ? (
                                    <ChevronRightIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                    {tag}
                                </span>
                                <span className="text-[9px] text-muted-foreground/60 ml-auto flex-shrink-0">
                                    {endpoints.length}
                                </span>
                            </button>

                            {/* Endpoints under tag */}
                            {!collapsedTags.has(tag) && endpoints.map((ep, i) => (
                                <button
                                    key={`${ep.method}-${ep.path}-${i}`}
                                    onClick={() => onSelect(ep)}
                                    className="flex items-start gap-1.5 w-full px-2 py-1.5 pl-5 text-left hover:bg-muted/40 transition-colors group"
                                    title={ep.summary}
                                >
                                    <span className={`text-[9px] font-mono font-bold flex-shrink-0 mt-px ${METHOD_COLORS_MUTED[ep.method] ?? "text-muted-foreground"}`}>
                                        {ep.method.slice(0, 3)}
                                    </span>
                                    <span className="text-[11px] font-mono text-foreground/80 truncate group-hover:text-foreground">
                                        {ep.path}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Footer stats */}
            <div className="px-2 py-1 border-t border-border flex-shrink-0">
                <span className="text-[9px] text-muted-foreground">
                    {spec.endpoints.length} endpoint{spec.endpoints.length !== 1 ? "s" : ""}
                    {search && ` (${filteredEndpoints.length} shown)`}
                </span>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────

export function ApiRequestBuilder() {
    const [method, setMethod] = useState<HttpMethod>("GET")
    const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1")
    const [headers, setHeaders] = useState<KeyValuePair[]>([
        { key: "Content-Type", value: "application/json", enabled: true },
    ])
    const [body, setBody] = useState('{\n  "title": "Hello",\n  "body": "World",\n  "userId": 1\n}')

    const [response, setResponse] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [copied, setCopied] = useState<string | null>(null)
    const [headersExpanded, setHeadersExpanded] = useState(true)
    const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(false)

    // OpenAPI state
    const [spec, setSpec] = useState<ParsedOpenApiSpec | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarSearch, setSidebarSearch] = useState("")
    const [importModalOpen, setImportModalOpen] = useState(false)

    const handleCopy = async (text: string, which: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(which)
        setTimeout(() => setCopied(null), 2000)
    }

    const addHeader = () => {
        setHeaders(prev => [...prev, { key: "", value: "", enabled: true }])
    }

    const removeHeader = (index: number) => {
        setHeaders(prev => prev.filter((_, i) => i !== index))
    }

    const updateHeader = (index: number, field: "key" | "value" | "enabled", val: string | boolean) => {
        setHeaders(prev => prev.map((h, i) => i === index ? { ...h, [field]: val } : h))
    }

    const handleBodyChange = useCallback((value: string | undefined) => {
        setBody(value || "")
    }, [])

    const handleSend = useCallback(async () => {
        setLoading(true)
        setError(null)
        setResponse(null)

        const startTime = performance.now()
        try {
            const enabledHeaders: Record<string, string> = {}
            headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
                enabledHeaders[h.key] = h.value
            })

            const fetchOptions: RequestInit = {
                method,
                headers: enabledHeaders,
            }

            if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
                fetchOptions.body = body
            }

            const res = await fetch(url, fetchOptions)
            const elapsed = Math.round(performance.now() - startTime)
            const text = await res.text()

            const resHeaders: Record<string, string> = {}
            res.headers.forEach((value, key) => {
                resHeaders[key] = value
            })

            let formattedBody = text
            try {
                const parsed = JSON.parse(text)
                formattedBody = JSON.stringify(parsed, null, 2)
            } catch {
                // Not JSON, keep raw text
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: resHeaders,
                body: formattedBody,
                time: elapsed,
                size: new Blob([text]).size,
            })
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Request failed"
            setError(msg.includes("Failed to fetch") ? "Network error — the server may not allow browser requests (CORS)" : msg)
            setResponse(null)
        } finally {
            setLoading(false)
        }
    }, [method, url, headers, body])

    const handleImportSpec = useCallback((parsed: ParsedOpenApiSpec) => {
        setSpec(parsed)
        setSidebarOpen(true)
        setImportModalOpen(false)
        setSidebarSearch("")
    }, [])

    const handleClearSpec = useCallback(() => {
        setSpec(null)
        setSidebarOpen(false)
        setSidebarSearch("")
    }, [])

    const handleSelectEndpoint = useCallback((endpoint: OpenApiEndpoint) => {
        const m = endpoint.method.toUpperCase()
        if (METHODS.includes(m as HttpMethod)) {
            setMethod(m as HttpMethod)
        }

        // Build URL with base
        let endpointUrl = endpoint.path
        if (spec?.baseUrl) {
            const base = spec.baseUrl.replace(/\/$/, "")
            endpointUrl = base + endpoint.path
        }

        // Build query string from query params
        if (endpoint.queryParams.length > 0) {
            const queryParts = endpoint.queryParams
                .map(p => `${encodeURIComponent(p.name)}=`)
                .join("&")
            endpointUrl += "?" + queryParts
        }

        setUrl(endpointUrl)

        // Set headers
        const newHeaders: KeyValuePair[] = endpoint.headers.map(h => ({
            key: h.key,
            value: h.value || "",
            enabled: true,
        }))
        // Add Content-Type if there's a body
        if (endpoint.bodyExample && !newHeaders.some(h => h.key.toLowerCase() === "content-type")) {
            newHeaders.unshift({ key: "Content-Type", value: "application/json", enabled: true })
        }
        if (newHeaders.length === 0) {
            newHeaders.push({ key: "Content-Type", value: "application/json", enabled: true })
        }
        setHeaders(newHeaders)

        // Set body
        if (endpoint.bodyExample) {
            setBody(endpoint.bodyExample)
        }

        // Clear previous response
        setResponse(null)
        setError(null)
    }, [spec])

    const hasBody = ["POST", "PUT", "PATCH"].includes(method)

    return (
        <div className="h-full flex flex-col min-h-0 relative">
            {/* Top toolbar: OpenAPI + method + URL + send */}
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b border-border flex-shrink-0">
                {/* OpenAPI button */}
                <Button variant="ghost" size="xs" onClick={() => setImportModalOpen(true)} title="Import OpenAPI spec">
                    <BookOpenIcon className="h-3 w-3" />
                    <span className="text-[10px]">OpenAPI</span>
                </Button>
                {spec && !sidebarOpen && (
                    <Button variant="ghost" size="xs" onClick={() => setSidebarOpen(true)} title="Show endpoints">
                        <PanelLeftOpenIcon className="h-3 w-3" />
                    </Button>
                )}
                <div className="w-px h-4 bg-border mx-0.5" />
                {/* Method pills */}
                {METHODS.map(m => (
                    <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`px-2 py-1 rounded text-[11px] font-medium font-mono transition-colors ${
                            method === m
                                ? METHOD_COLORS[m]
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {m}
                    </button>
                ))}
                <div className="w-px h-4 bg-border mx-0.5" />
                {/* URL input */}
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSend() }}
                    placeholder="https://api.example.com/endpoint"
                    className="order-last md:order-none basis-full md:basis-auto flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    spellCheck={false}
                />
                <div className="w-px h-4 bg-border mx-0.5" />
                {/* Send button */}
                <Button
                    variant="default"
                    size="xs"
                    onClick={handleSend}
                    disabled={loading || !url.trim()}
                >
                    {loading ? (
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                    ) : (
                        <SendIcon className="h-3 w-3" />
                    )}
                    <span className="text-[11px]">Send</span>
                </Button>
            </div>

            {/* Main content area: optional sidebar + request/response */}
            <div className="flex-1 flex min-h-0 gap-px bg-border">
                {/* Sidebar */}
                {spec && sidebarOpen && (
                    <div className="hidden md:flex">
                        <EndpointSidebar
                            spec={spec}
                            search={sidebarSearch}
                            onSearchChange={setSidebarSearch}
                            onSelect={handleSelectEndpoint}
                            onClose={() => setSidebarOpen(false)}
                            onClear={handleClearSpec}
                        />
                    </div>
                )}

                {/* Request + Response vertical split */}
                <div className="flex-1 flex flex-col min-h-0 bg-background">
                    {/* REQUEST SECTION */}
                    <div className="flex flex-col min-h-0 h-1/2">
                        {/* Headers sub-section */}
                        <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                            <button
                                onClick={() => setHeadersExpanded(!headersExpanded)}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {headersExpanded ? (
                                    <ChevronDownIcon className="h-3 w-3" />
                                ) : (
                                    <ChevronRightIcon className="h-3 w-3" />
                                )}
                                <span className="text-[10px] font-medium uppercase tracking-wider">
                                    Headers ({headers.filter(h => h.enabled).length})
                                </span>
                            </button>
                            <Button variant="ghost" size="xs" onClick={addHeader} title="Add header">
                                <PlusIcon className="h-3 w-3" />
                            </Button>
                        </div>
                        {headersExpanded && (
                            <div className="overflow-y-auto max-h-28 flex-shrink-0 border-b border-border">
                                {headers.map((header, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1">
                                        <input
                                            type="checkbox"
                                            checked={header.enabled}
                                            onChange={e => updateHeader(i, "enabled", e.target.checked)}
                                            className="rounded accent-primary flex-shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={header.key}
                                            onChange={e => updateHeader(i, "key", e.target.value)}
                                            placeholder="Key"
                                            className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                            spellCheck={false}
                                        />
                                        <input
                                            type="text"
                                            value={header.value}
                                            onChange={e => updateHeader(i, "value", e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                                            spellCheck={false}
                                        />
                                        <Button variant="ghost" size="xs" onClick={() => removeHeader(i)} title="Remove header">
                                            <XIcon className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {headers.length === 0 && (
                                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                                        No headers. Click + to add one.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Body editor */}
                        {hasBody ? (
                            <div className="flex-1 min-h-0 flex flex-col">
                                <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Body</span>
                                    <Button variant="ghost" size="xs" onClick={() => handleCopy(body, "body")} title="Copy body">
                                        {copied === "body" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                                    </Button>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <Editor
                                        height="100%"
                                        defaultLanguage="json"
                                        value={body}
                                        onChange={handleBodyChange}
                                        theme="vs-dark"
                                        options={MONACO_OPTIONS}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                                No body for {method} requests
                            </div>
                        )}
                    </div>

                    {/* RESPONSE SECTION */}
                    <div className="flex-1 flex flex-col min-h-0 border-t border-border">
                        {/* Response toolbar */}
                        <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Response</span>
                                {response && (
                                    <>
                                        <StatusBadge status={response.status} />
                                        <span className="text-[10px] text-muted-foreground font-mono">{response.time}ms</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{formatSize(response.size)}</span>
                                    </>
                                )}
                                {error && (
                                    <span className="text-destructive text-xs flex items-center gap-1">
                                        <AlertCircleIcon className="h-3 w-3" />
                                        {error}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {response && (
                                    <>
                                        <button
                                            onClick={() => setResponseHeadersExpanded(!responseHeadersExpanded)}
                                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            Headers
                                            {responseHeadersExpanded ? (
                                                <ChevronDownIcon className="h-3 w-3" />
                                            ) : (
                                                <ChevronRightIcon className="h-3 w-3" />
                                            )}
                                        </button>
                                        <div className="w-px h-4 bg-border mx-0.5" />
                                        <Button variant="ghost" size="xs" onClick={() => handleCopy(response.body, "response")} title="Copy response">
                                            {copied === "response" ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Response headers (collapsible) */}
                        {responseHeadersExpanded && response && (
                            <div className="overflow-y-auto max-h-28 border-b border-border px-3 py-1 flex-shrink-0 bg-muted/20">
                                {Object.entries(response.headers).map(([key, value]) => (
                                    <div key={key} className="flex gap-2 py-0.5 text-[11px] font-mono">
                                        <span className="text-muted-foreground flex-shrink-0">{key}:</span>
                                        <span className="text-foreground/80 break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Response body */}
                        <div className="flex-1 min-h-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : response ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage={detectLanguage(response.body)}
                                    value={response.body}
                                    theme="vs-dark"
                                    options={{ ...MONACO_OPTIONS, readOnly: true }}
                                />
                            ) : !error ? (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                    Send a request to see the response
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import modal overlay */}
            {importModalOpen && (
                <ImportModal
                    onImport={handleImportSpec}
                    onClose={() => setImportModalOpen(false)}
                />
            )}

            {/* Mobile OpenAPI sidebar overlay */}
            {spec && sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="absolute inset-0 bg-black/50"
                        aria-label="Close OpenAPI sidebar"
                    />
                    <div className="absolute inset-0 bg-background">
                        <EndpointSidebar
                            spec={spec}
                            search={sidebarSearch}
                            onSearchChange={setSidebarSearch}
                            onSelect={(endpoint) => {
                                handleSelectEndpoint(endpoint)
                                setSidebarOpen(false)
                            }}
                            onClose={() => setSidebarOpen(false)}
                            onClear={handleClearSpec}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
