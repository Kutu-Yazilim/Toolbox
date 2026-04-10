// Shared types, constants, and defaults for the API Request Builder

// ─── Types ───────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type BodyType = "json" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary" | "none"

export type AuthType = "none" | "bearer" | "basic" | "api-key"

export interface AuthConfig {
    type: AuthType
    bearer: { token: string }
    basic: { username: string; password: string }
    apiKey: { key: string; value: string; addTo: "header" | "query" }
}

export interface KeyValuePair {
    key: string
    value: string
    enabled: boolean
}

export interface StoredRequest {
    id: string
    name: string
    method: HttpMethod
    url: string
    headers: KeyValuePair[]
    queryParams: KeyValuePair[]
    bodyType: BodyType
    body: string
    auth: AuthConfig
    collectionId: string | null
    createdAt: number
    updatedAt: number
}

export interface Collection {
    id: string
    name: string
    description: string
    createdAt: number
    updatedAt: number
}

export interface HistoryEntry {
    id: string
    requestId: string | null
    method: HttpMethod
    url: string
    status: number
    statusText: string
    responseBody: string
    responseHeaders: Record<string, string>
    time: number
    size: number
    timestamp: number
}

export interface ApiResponse {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    time: number
    size: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_AUTH: AuthConfig = {
    type: "none",
    bearer: { token: "" },
    basic: { username: "", password: "" },
    apiKey: { key: "", value: "", addTo: "header" },
}

export const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

export const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "bg-emerald-500 text-white",
    POST: "bg-blue-500 text-white",
    PUT: "bg-amber-500 text-white",
    PATCH: "bg-orange-400 text-white",
    DELETE: "bg-red-500 text-white",
}

export const METHOD_COLORS_MUTED: Record<string, string> = {
    GET: "text-emerald-500",
    POST: "text-blue-500",
    PUT: "text-amber-500",
    PATCH: "text-orange-400",
    DELETE: "text-red-500",
    HEAD: "text-purple-400",
    OPTIONS: "text-muted-foreground",
}

export const BODY_TYPES: { value: BodyType; label: string }[] = [
    { value: "none", label: "None" },
    { value: "json", label: "JSON" },
    { value: "form-data", label: "Form Data" },
    { value: "x-www-form-urlencoded", label: "URL Encoded" },
    { value: "raw", label: "Raw" },
    { value: "binary", label: "Binary" },
]

export const AUTH_TYPES: { value: AuthType; label: string }[] = [
    { value: "none", label: "None" },
    { value: "bearer", label: "Bearer Token" },
    { value: "basic", label: "Basic Auth" },
    { value: "api-key", label: "API Key" },
]

export const HISTORY_LIMIT = 200

export const MONACO_OPTIONS = {
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
