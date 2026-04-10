"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { HistoryIcon, FolderIcon, BracesIcon, BookOpenIcon, PanelLeftOpenIcon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useShareableUrl } from "@/hooks/useShareableUrl"
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type ExportOption } from "@/components/shared/ExportMenu"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { type ParsedOpenApiSpec, type OpenApiEndpoint } from "@/utils/openApiParser"
import {
    type HttpMethod, type KeyValuePair, type BodyType, type AuthConfig, type ApiResponse,
    METHODS, DEFAULT_AUTH,
} from "./apiTypes"
import { resolveVariables, resolveAuth, buildUrlWithParams, parseQueryParams, getUrlWithoutParams, findVariableRefs, generateCurl } from "./apiUtils"
import { useApiStore } from "./useApiStore"
import { API_PRESETS } from "./apiPresets"
import { RequestPanel } from "./RequestPanel"
import { ResponsePanel } from "./ResponsePanel"
import { EndpointSidebar } from "./EndpointSidebar"
import { ImportModal } from "./ImportModal"
import { HistoryDrawer } from "./HistoryDrawer"
import { CollectionsDrawer } from "./CollectionsDrawer"
import { EnvDrawer } from "./EnvDrawer"

// ─── Persisted state shape ──────────────────────────────────────────────────

interface PersistedRequestState {
    method: HttpMethod
    url: string
    headers: KeyValuePair[]
    queryParams: KeyValuePair[]
    bodyType: BodyType
    body: string
    auth: AuthConfig
}

const DEFAULT_PERSISTED: PersistedRequestState = {
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
    queryParams: [],
    bodyType: "none",
    body: "",
    auth: DEFAULT_AUTH,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ApiRequestBuilder() {
    const { isDark } = useTheme()
    const store = useApiStore()

    // ── Persisted request state ─────────────────────────────────────────────
    const [persisted, setPersisted] = useLocalStorage<PersistedRequestState>("kutu-api-builder", DEFAULT_PERSISTED)

    const [method, setMethodRaw] = useState<HttpMethod>(persisted.method)
    const [url, setUrlRaw] = useState(persisted.url)
    const [headers, setHeaders] = useState<KeyValuePair[]>(persisted.headers)
    const [queryParams, setQueryParamsRaw] = useState<KeyValuePair[]>(persisted.queryParams)
    const [bodyType, setBodyType] = useState<BodyType>(persisted.bodyType)
    const [body, setBody] = useState(persisted.body)
    const [auth, setAuth] = useState<AuthConfig>(persisted.auth)

    // ── Transient state ─────────────────────────────────────────────────────
    const [formData, setFormData] = useState<KeyValuePair[]>([])
    const [urlEncodedData, setUrlEncodedData] = useState<KeyValuePair[]>([])
    const [binaryFile, setBinaryFile] = useState<File | null>(null)
    const [response, setResponse] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [collectionsOpen, setCollectionsOpen] = useState(false)
    const [envOpen, setEnvOpen] = useState(false)
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [spec, setSpec] = useState<ParsedOpenApiSpec | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarSearch, setSidebarSearch] = useState("")

    // ── Environment variables ───────────────────────────────────────────────
    const [envVars, setEnvVars] = useLocalStorage<Record<string, string>>("kutu-api-env", {})

    // ── Sync ref to prevent URL ↔ queryParams infinite loops ────────────────
    const syncingRef = useRef(false)

    // ── Persist helper ──────────────────────────────────────────────────────
    const persist = useCallback(
        (patch: Partial<PersistedRequestState>) => {
            setPersisted(prev => ({ ...prev, ...patch }))
        },
        [setPersisted],
    )

    // ── Setters with persistence + bidirectional sync ────────────────────────
    const setMethod = useCallback((m: HttpMethod) => {
        setMethodRaw(m)
        persist({ method: m })
    }, [persist])

    const setUrl = useCallback((u: string) => {
        setUrlRaw(u)
        persist({ url: u })
        if (!syncingRef.current) {
            syncingRef.current = true
            setQueryParamsRaw(parseQueryParams(u))
            syncingRef.current = false
        }
    }, [persist])

    const setQueryParams = useCallback((params: KeyValuePair[]) => {
        setQueryParamsRaw(params)
        persist({ queryParams: params })
        if (!syncingRef.current) {
            syncingRef.current = true
            const base = getUrlWithoutParams(url)
            const rebuilt = buildUrlWithParams(base, params)
            setUrlRaw(rebuilt)
            persist({ url: rebuilt, queryParams: params })
            syncingRef.current = false
        }
    }, [persist, url])

    // ── Shareable URL ───────────────────────────────────────────────────────
    const shareableState = useMemo(
        () => ({ method, url, headers, queryParams, bodyType, body, auth }),
        [method, url, headers, queryParams, bodyType, body, auth],
    )

    const { shareUrl } = useShareableUrl("api-request", shareableState, (restored) => {
        setMethodRaw(restored.method)
        setUrlRaw(restored.url)
        setHeaders(restored.headers)
        setQueryParamsRaw(restored.queryParams)
        setBodyType(restored.bodyType)
        setBody(restored.body)
        setAuth(restored.auth)
        setPersisted(restored)
    })

    // ── Referenced env vars (for EnvDrawer highlight) ────────────────────────
    const referencedVars = useMemo(() => {
        const texts = [url, body, auth.bearer.token, auth.basic.username, auth.basic.password, auth.apiKey.key, auth.apiKey.value]
        headers.forEach(h => { texts.push(h.value) })
        queryParams.forEach(p => { texts.push(p.value) })
        return findVariableRefs(texts.join(" "))
    }, [url, body, auth, headers, queryParams])

    // ── handleSend ──────────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        setLoading(true)
        setError(null)
        setResponse(null)

        const startTime = performance.now()
        try {
            // Resolve env vars
            const rUrl = resolveVariables(url, envVars)
            const rHeaders = headers
                .filter(h => h.enabled && h.key.trim())
                .map(h => ({ ...h, value: resolveVariables(h.value, envVars) }))
            const rParams = queryParams
                .filter(p => p.enabled && p.key.trim())
                .map(p => ({ ...p, value: resolveVariables(p.value, envVars) }))
            const rBody = resolveVariables(body, envVars)

            // Auth
            const authResult = resolveAuth(auth, envVars)

            // Final URL
            const finalUrl = buildUrlWithParams(rUrl, rParams, authResult.queryParams)

            // Merge headers
            const finalHeaders: Record<string, string> = {}
            for (const h of rHeaders) finalHeaders[h.key] = h.value
            for (const [k, v] of Object.entries(authResult.headers)) finalHeaders[k] = v

            // Build body
            let fetchBody: BodyInit | undefined
            if (bodyType === "json" || bodyType === "raw") {
                fetchBody = rBody || undefined
            } else if (bodyType === "form-data") {
                const fd = new FormData()
                formData.filter(d => d.enabled && d.key.trim()).forEach(d => fd.append(d.key, d.value))
                fetchBody = fd
            } else if (bodyType === "x-www-form-urlencoded") {
                const params = new URLSearchParams()
                urlEncodedData.filter(d => d.enabled && d.key.trim()).forEach(d => params.append(d.key, d.value))
                fetchBody = params
            } else if (bodyType === "binary" && binaryFile) {
                fetchBody = binaryFile
            }

            // Set Content-Type if not manually provided
            if (bodyType === "json" && !finalHeaders["Content-Type"]) {
                finalHeaders["Content-Type"] = "application/json"
            } else if (bodyType === "x-www-form-urlencoded" && !finalHeaders["Content-Type"]) {
                finalHeaders["Content-Type"] = "application/x-www-form-urlencoded"
            }
            // form-data: let browser set boundary; binary: no default

            const res = await fetch(finalUrl, { method, headers: finalHeaders, body: fetchBody })
            const elapsed = Math.round(performance.now() - startTime)
            const text = await res.text()

            const resHeaders: Record<string, string> = {}
            res.headers.forEach((v, k) => { resHeaders[k] = v })

            let formattedBody = text
            try {
                formattedBody = JSON.stringify(JSON.parse(text), null, 2)
            } catch { /* not JSON */ }

            const apiResponse: ApiResponse = {
                status: res.status,
                statusText: res.statusText,
                headers: resHeaders,
                body: formattedBody,
                time: elapsed,
                size: new Blob([text]).size,
            }
            setResponse(apiResponse)

            // Save to history
            store.addHistory({
                id: crypto.randomUUID(),
                requestId: null,
                method,
                url,
                status: res.status,
                statusText: res.statusText,
                responseBody: formattedBody,
                responseHeaders: resHeaders,
                time: elapsed,
                size: new Blob([text]).size,
                timestamp: Date.now(),
            })
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Request failed"
            setError(msg.includes("Failed to fetch") ? "Network error — the server may not allow browser requests (CORS)" : msg)
        } finally {
            setLoading(false)
        }
    }, [method, url, headers, queryParams, bodyType, body, auth, envVars, formData, urlEncodedData, binaryFile, store])

    // ── handleSaveCurrent ───────────────────────────────────────────────────
    const handleSaveCurrent = useCallback((name: string, collectionId: string) => {
        store.saveRequest({
            id: crypto.randomUUID(),
            name,
            method, url, headers, queryParams, bodyType, body, auth,
            collectionId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
    }, [store, method, url, headers, queryParams, bodyType, body, auth])

    // ── Preset handler ──────────────────────────────────────────────────────
    const handlePresetSelect = useCallback((preset: Preset) => {
        const data = JSON.parse(preset.content)
        setMethod(data.method)
        setUrl(data.url)
        setHeaders(data.headers)
        setBody(data.body ?? "")
        setResponse(null)
        setError(null)
    }, [setMethod, setUrl])

    // ── OpenAPI handlers ────────────────────────────────────────────────────
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
        if (METHODS.includes(m as HttpMethod)) setMethod(m as HttpMethod)

        let endpointUrl = endpoint.path
        if (spec?.baseUrl) {
            endpointUrl = spec.baseUrl.replace(/\/$/, "") + endpoint.path
        }
        if (endpoint.queryParams.length > 0) {
            const qs = endpoint.queryParams.map(p => `${encodeURIComponent(p.name)}=`).join("&")
            endpointUrl += "?" + qs
        }
        setUrl(endpointUrl)

        const newHeaders: KeyValuePair[] = endpoint.headers.map(h => ({
            key: h.key, value: h.value || "", enabled: true,
        }))
        if (endpoint.bodyExample && !newHeaders.some(h => h.key.toLowerCase() === "content-type")) {
            newHeaders.unshift({ key: "Content-Type", value: "application/json", enabled: true })
        }
        if (newHeaders.length === 0) {
            newHeaders.push({ key: "Content-Type", value: "application/json", enabled: true })
        }
        setHeaders(newHeaders)
        persist({ headers: newHeaders })

        if (endpoint.bodyExample) {
            setBody(endpoint.bodyExample)
            persist({ body: endpoint.bodyExample })
        }

        setResponse(null)
        setError(null)
    }, [spec, setMethod, setUrl, persist])

    // ── History select ──────────────────────────────────────────────────────
    const handleHistorySelect = useCallback((entry: { method: HttpMethod; url: string }) => {
        setMethod(entry.method)
        setUrl(entry.url)
        setHistoryOpen(false)
        setResponse(null)
        setError(null)
    }, [setMethod, setUrl])

    // ── Collection request select ───────────────────────────────────────────
    const handleSelectRequest = useCallback((req: { method: HttpMethod; url: string; headers: KeyValuePair[]; queryParams: KeyValuePair[]; bodyType: BodyType; body: string; auth: AuthConfig }) => {
        setMethod(req.method)
        setUrl(req.url)
        setHeaders(req.headers)
        setQueryParamsRaw(req.queryParams)
        setBodyType(req.bodyType)
        setBody(req.body)
        setAuth(req.auth)
        setPersisted({ method: req.method, url: req.url, headers: req.headers, queryParams: req.queryParams, bodyType: req.bodyType, body: req.body, auth: req.auth })
        setCollectionsOpen(false)
        setResponse(null)
        setError(null)
    }, [setPersisted, setMethod, setUrl])

    // ── Export options ───────────────────────────────────────────────────────
    const exportOptions: ExportOption[] = useMemo(() => [
        { label: "Copy as cURL", action: () => navigator.clipboard.writeText(generateCurl(method, url, headers, body, bodyType)) },
        { label: "Copy response", action: () => { if (response) navigator.clipboard.writeText(response.body) } },
        { label: "Copy request JSON", action: () => navigator.clipboard.writeText(JSON.stringify({ method, url, headers, queryParams, bodyType, body, auth }, null, 2)) },
    ], [method, url, headers, queryParams, bodyType, body, auth, response])

    // ── Keyboard shortcuts ──────────────────────────────────────────────────
    const shortcuts: Shortcut[] = useMemo(() => [
        { key: "mod+enter", label: "Send request", action: () => handleSend() },
        { key: "mod+s", label: "Save to collection", action: () => setCollectionsOpen(true) },
        { key: "mod+h", label: "Toggle history", action: () => setHistoryOpen(prev => !prev) },
        { key: "mod+k", label: "Toggle collections", action: () => setCollectionsOpen(prev => !prev) },
        { key: "mod+e", label: "Toggle environment", action: () => setEnvOpen(prev => !prev) },
        { key: "mod+i", label: "Import OpenAPI", action: () => setImportModalOpen(true) },
    ], [handleSend])

    useKeyboardShortcuts(shortcuts)

    // ── JSX ─────────────────────────────────────────────────────────────────
    return (
        <div className="h-full flex flex-col min-h-0 relative">
            <ToolToolbar
                title="API"
                status={
                    response
                        ? { type: response.status < 400 ? "success" : "error", label: `${response.status} ${response.statusText}` }
                        : error
                            ? { type: "error", label: error }
                            : null
                }
                copyValue={response?.body}
                onShare={shareUrl}
                exportOptions={exportOptions}
                presets={API_PRESETS}
                onPresetSelect={handlePresetSelect}
                shortcuts={shortcuts}
                actions={
                    <>
                        <Button variant="ghost" size="xs" onClick={() => setHistoryOpen(true)} title="History">
                            <HistoryIcon className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setCollectionsOpen(true)} title="Collections">
                            <FolderIcon className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setEnvOpen(true)} title="Environment">
                            <BracesIcon className="h-3 w-3" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-0.5" />
                        <Button variant="ghost" size="xs" onClick={() => setImportModalOpen(true)} title="Import OpenAPI">
                            <BookOpenIcon className="h-3 w-3" />
                        </Button>
                        {spec && !sidebarOpen && (
                            <Button variant="ghost" size="xs" onClick={() => setSidebarOpen(true)} title="Show endpoints">
                                <PanelLeftOpenIcon className="h-3 w-3" />
                            </Button>
                        )}
                    </>
                }
            />

            <div className="flex-1 flex min-h-0 gap-px bg-border">
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

                <div className="flex-1 flex flex-col min-h-0 bg-background">
                    <RequestPanel
                        method={method}
                        url={url}
                        headers={headers}
                        queryParams={queryParams}
                        bodyType={bodyType}
                        body={body}
                        formData={formData}
                        urlEncodedData={urlEncodedData}
                        binaryFile={binaryFile}
                        auth={auth}
                        loading={loading}
                        isDark={isDark}
                        onMethodChange={setMethod}
                        onUrlChange={setUrl}
                        onHeadersChange={(h) => { setHeaders(h); persist({ headers: h }) }}
                        onQueryParamsChange={setQueryParams}
                        onBodyTypeChange={(t) => { setBodyType(t); persist({ bodyType: t }) }}
                        onBodyChange={(b) => { setBody(b); persist({ body: b }) }}
                        onFormDataChange={setFormData}
                        onUrlEncodedChange={setUrlEncodedData}
                        onBinaryFileChange={setBinaryFile}
                        onAuthChange={(a) => { setAuth(a); persist({ auth: a }) }}
                        onSend={handleSend}
                    />
                    <ResponsePanel
                        response={response}
                        loading={loading}
                        error={error}
                        isDark={isDark}
                    />
                </div>
            </div>

            {importModalOpen && (
                <ImportModal onImport={handleImportSpec} onClose={() => setImportModalOpen(false)} />
            )}

            <HistoryDrawer
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                history={store.history}
                onSelect={handleHistorySelect}
                onDelete={store.deleteHistory}
                onClear={store.clearHistory}
            />

            <CollectionsDrawer
                open={collectionsOpen}
                onClose={() => setCollectionsOpen(false)}
                collections={store.collections}
                getRequestsByCollection={store.getRequestsByCollection}
                onSelectRequest={handleSelectRequest}
                onDeleteRequest={store.deleteRequest}
                onAddCollection={(name) => store.addCollection({ id: crypto.randomUUID(), name, description: "", createdAt: Date.now(), updatedAt: Date.now() })}
                onDeleteCollection={store.deleteCollection}
                onRenameCollection={(id, name) => {
                    const col = store.collections.find(c => c.id === id)
                    if (col) store.updateCollection({ ...col, name, updatedAt: Date.now() })
                }}
                onSaveCurrent={handleSaveCurrent}
            />

            <EnvDrawer
                open={envOpen}
                onClose={() => setEnvOpen(false)}
                vars={envVars}
                onChange={setEnvVars}
                referencedVars={referencedVars}
            />

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
                            onSelect={(endpoint) => { handleSelectEndpoint(endpoint); setSidebarOpen(false) }}
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
