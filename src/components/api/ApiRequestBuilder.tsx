import { useState, useCallback } from "react"
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
} from "lucide-react"
import Editor from "@monaco-editor/react"

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
            const elapsed = Math.round(performance.now() - startTime)
            const msg = e instanceof Error ? e.message : "Request failed"
            setError(msg.includes("Failed to fetch") ? "Network error — the server may not allow browser requests (CORS)" : msg)
            setResponse(null)
            void elapsed
        } finally {
            setLoading(false)
        }
    }, [method, url, headers, body])

    const hasBody = ["POST", "PUT", "PATCH"].includes(method)

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Top toolbar: method + URL + send */}
            <div className="flex items-center gap-1.5 px-3 h-9 border-b border-border flex-shrink-0">
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
                    className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
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

            {/* Main content: vertical split */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* REQUEST SECTION */}
                <div className="flex flex-col min-h-0" style={{ height: "50%" }}>
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
    )
}
