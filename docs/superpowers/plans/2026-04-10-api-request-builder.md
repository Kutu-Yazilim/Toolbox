# API Request Builder Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic 927-line API Request Builder into a modular, feature-rich REST client with IndexedDB-backed history/collections, auth helpers, environment variables, query params editor, and multiple body format support.

**Architecture:** IndexedDB-first — build the storage layer and types first, then decompose the UI into focused components, then wire in new features. Each component communicates via props from the main orchestrator.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Monaco Editor, `idb` (IndexedDB wrapper), lucide-react, existing shared infrastructure (ToolToolbar, useLocalStorage, useShareableUrl, useKeyboardShortcuts, useTheme)

---

### Task 1: Install `idb` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install idb**

```bash
npm install idb
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('idb'); console.log('idb OK')"
```

Expected: `idb OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add idb package for IndexedDB access"
```

---

### Task 2: Create shared types

**Files:**
- Create: `src/components/api/apiTypes.ts`

- [ ] **Step 1: Write the types file**

```ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type BodyType = "json" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary" | "none"

export type AuthType = "none" | "bearer" | "basic" | "api-key"

export interface AuthConfig {
    type: AuthType
    bearer: { token: string }
    basic: { username: string; password: string }
    apiKey: { key: string; value: string; addTo: "header" | "query" }
}

export const DEFAULT_AUTH: AuthConfig = {
    type: "none",
    bearer: { token: "" },
    basic: { username: "", password: "" },
    apiKey: { key: "", value: "", addTo: "header" },
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
    { value: "json", label: "JSON" },
    { value: "form-data", label: "Form Data" },
    { value: "x-www-form-urlencoded", label: "URL Encoded" },
    { value: "raw", label: "Raw" },
    { value: "binary", label: "Binary" },
    { value: "none", label: "None" },
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep apiTypes || echo "No errors"
```

Expected: `No errors`

- [ ] **Step 3: Commit**

```bash
git add src/components/api/apiTypes.ts
git commit -m "feat(api): add shared types for API request builder"
```

---

### Task 3: Create IndexedDB store and React hook

**Files:**
- Create: `src/components/api/apiStore.ts`
- Create: `src/components/api/useApiStore.ts`

- [ ] **Step 1: Write apiStore.ts**

```ts
import { openDB, type IDBPDatabase } from "idb"
import { type StoredRequest, type Collection, type HistoryEntry, HISTORY_LIMIT } from "./apiTypes"

const DB_NAME = "kutu-api"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("requests")) {
                    db.createObjectStore("requests", { keyPath: "id" })
                }
                if (!db.objectStoreNames.contains("collections")) {
                    db.createObjectStore("collections", { keyPath: "id" })
                }
                if (!db.objectStoreNames.contains("history")) {
                    const store = db.createObjectStore("history", { keyPath: "id" })
                    store.createIndex("by-timestamp", "timestamp")
                }
            },
        })
    }
    return dbPromise
}

// History
export async function getHistory(limit = HISTORY_LIMIT): Promise<HistoryEntry[]> {
    const db = await getDb()
    const all = await db.getAllFromIndex("history", "by-timestamp")
    return all.reverse().slice(0, limit)
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
    const db = await getDb()
    await db.put("history", entry)
    // Prune old entries beyond limit
    const all = await db.getAllFromIndex("history", "by-timestamp")
    if (all.length > HISTORY_LIMIT) {
        const toDelete = all.slice(0, all.length - HISTORY_LIMIT)
        const tx = db.transaction("history", "readwrite")
        for (const entry of toDelete) {
            await tx.store.delete(entry.id)
        }
        await tx.done
    }
}

export async function deleteHistory(id: string): Promise<void> {
    const db = await getDb()
    await db.delete("history", id)
}

export async function clearHistory(): Promise<void> {
    const db = await getDb()
    await db.clear("history")
}

// Collections
export async function getCollections(): Promise<Collection[]> {
    const db = await getDb()
    const all = await db.getAll("collections")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function addCollection(collection: Collection): Promise<void> {
    const db = await getDb()
    await db.put("collections", collection)
}

export async function updateCollection(collection: Collection): Promise<void> {
    const db = await getDb()
    await db.put("collections", collection)
}

export async function deleteCollection(id: string): Promise<void> {
    const db = await getDb()
    // Delete collection and its requests
    const allRequests = await db.getAll("requests")
    const tx = db.transaction(["collections", "requests"], "readwrite")
    await tx.objectStore("collections").delete(id)
    for (const req of allRequests) {
        if (req.collectionId === id) {
            await tx.objectStore("requests").delete(req.id)
        }
    }
    await tx.done
}

// Requests
export async function getRequests(): Promise<StoredRequest[]> {
    const db = await getDb()
    const all = await db.getAll("requests")
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getRequestsByCollection(collectionId: string): Promise<StoredRequest[]> {
    const db = await getDb()
    const all = await db.getAll("requests")
    return all.filter(r => r.collectionId === collectionId).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveRequest(request: StoredRequest): Promise<void> {
    const db = await getDb()
    await db.put("requests", request)
}

export async function updateRequest(request: StoredRequest): Promise<void> {
    const db = await getDb()
    await db.put("requests", request)
}

export async function deleteRequest(id: string): Promise<void> {
    const db = await getDb()
    await db.delete("requests", id)
}
```

- [ ] **Step 2: Write useApiStore.ts**

```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { type StoredRequest, type Collection, type HistoryEntry } from "./apiTypes"
import * as store from "./apiStore"

export function useApiStore() {
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [collections, setCollections] = useState<Collection[]>([])
    const [requests, setRequests] = useState<StoredRequest[]>([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        async function load() {
            const [h, c, r] = await Promise.all([
                store.getHistory(),
                store.getCollections(),
                store.getRequests(),
            ])
            setHistory(h)
            setCollections(c)
            setRequests(r)
            setLoaded(true)
        }
        load()
    }, [])

    const addHistory = useCallback(async (entry: HistoryEntry) => {
        await store.addHistory(entry)
        setHistory(await store.getHistory())
    }, [])

    const deleteHistoryEntry = useCallback(async (id: string) => {
        await store.deleteHistory(id)
        setHistory(prev => prev.filter(h => h.id !== id))
    }, [])

    const clearAllHistory = useCallback(async () => {
        await store.clearHistory()
        setHistory([])
    }, [])

    const addCollection = useCallback(async (collection: Collection) => {
        await store.addCollection(collection)
        setCollections(await store.getCollections())
    }, [])

    const updateCollection = useCallback(async (collection: Collection) => {
        await store.updateCollection(collection)
        setCollections(await store.getCollections())
    }, [])

    const removeCollection = useCallback(async (id: string) => {
        await store.deleteCollection(id)
        setCollections(await store.getCollections())
        setRequests(await store.getRequests())
    }, [])

    const saveRequest = useCallback(async (request: StoredRequest) => {
        await store.saveRequest(request)
        setRequests(await store.getRequests())
    }, [])

    const updateRequest = useCallback(async (request: StoredRequest) => {
        await store.updateRequest(request)
        setRequests(await store.getRequests())
    }, [])

    const removeRequest = useCallback(async (id: string) => {
        await store.deleteRequest(id)
        setRequests(prev => prev.filter(r => r.id !== id))
    }, [])

    const getRequestsByCollection = useCallback((collectionId: string) => {
        return requests.filter(r => r.collectionId === collectionId)
    }, [requests])

    return {
        loaded,
        history, addHistory, deleteHistory: deleteHistoryEntry, clearHistory: clearAllHistory,
        collections, addCollection, updateCollection, deleteCollection: removeCollection,
        requests, saveRequest, updateRequest, deleteRequest: removeRequest,
        getRequestsByCollection,
    }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "apiStore|useApiStore" || echo "No errors"
```

Expected: `No errors`

- [ ] **Step 4: Commit**

```bash
git add src/components/api/apiStore.ts src/components/api/useApiStore.ts
git commit -m "feat(api): add IndexedDB store and React hook for history/collections"
```

---

### Task 4: Create utility functions

**Files:**
- Create: `src/components/api/apiUtils.ts`

- [ ] **Step 1: Write apiUtils.ts**

```ts
import { type AuthConfig, type KeyValuePair } from "./apiTypes"

export function resolveVariables(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] ?? match
    })
}

export function detectLanguage(body: string): string {
    try {
        JSON.parse(body)
        return "json"
    } catch {
        if (body.trim().startsWith("<")) return "html"
        return "plaintext"
    }
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
}

export function resolveAuth(
    auth: AuthConfig,
    vars: Record<string, string>
): { headers: Record<string, string>; queryParams: Record<string, string> } {
    const headers: Record<string, string> = {}
    const queryParams: Record<string, string> = {}

    switch (auth.type) {
        case "bearer": {
            const token = resolveVariables(auth.bearer.token, vars)
            if (token) headers["Authorization"] = `Bearer ${token}`
            break
        }
        case "basic": {
            const user = resolveVariables(auth.basic.username, vars)
            const pass = resolveVariables(auth.basic.password, vars)
            if (user || pass) headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`
            break
        }
        case "api-key": {
            const key = resolveVariables(auth.apiKey.key, vars)
            const value = resolveVariables(auth.apiKey.value, vars)
            if (key && value) {
                if (auth.apiKey.addTo === "header") headers[key] = value
                else queryParams[key] = value
            }
            break
        }
    }

    return { headers, queryParams }
}

export function buildUrlWithParams(baseUrl: string, queryParams: KeyValuePair[], extraParams: Record<string, string> = {}): string {
    const url = new URL(baseUrl.includes("://") ? baseUrl : `https://${baseUrl}`)

    // Clear existing search params from URL (they're managed by the params editor)
    url.search = ""

    // Add enabled query params
    for (const p of queryParams) {
        if (p.enabled && p.key.trim()) {
            url.searchParams.set(p.key, p.value)
        }
    }

    // Add extra params (from auth)
    for (const [k, v] of Object.entries(extraParams)) {
        url.searchParams.set(k, v)
    }

    return url.toString()
}

export function parseQueryParams(url: string): KeyValuePair[] {
    try {
        const parsed = new URL(url.includes("://") ? url : `https://${url}`)
        const params: KeyValuePair[] = []
        parsed.searchParams.forEach((value, key) => {
            params.push({ key, value, enabled: true })
        })
        return params
    } catch {
        return []
    }
}

export function getUrlWithoutParams(url: string): string {
    try {
        const parsed = new URL(url.includes("://") ? url : `https://${url}`)
        parsed.search = ""
        return parsed.toString()
    } catch {
        return url
    }
}

export function findVariableRefs(text: string): string[] {
    const matches = text.matchAll(/\{\{(\w+)\}\}/g)
    return [...new Set(Array.from(matches, m => m[1]))]
}

export function generateCurl(
    method: string,
    url: string,
    headers: KeyValuePair[],
    body: string,
    bodyType: string
): string {
    const parts = [`curl -X ${method} '${url}'`]

    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim())
    for (const h of enabledHeaders) {
        parts.push(`-H '${h.key}: ${h.value}'`)
    }

    const hasBody = ["POST", "PUT", "PATCH"].includes(method)
    if (hasBody && body.trim() && bodyType !== "none") {
        parts.push(`-d '${body.replace(/'/g, "'\\''")}'`)
    }

    return parts.join(" \\\n  ")
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep apiUtils || echo "No errors"
```

Expected: `No errors`

- [ ] **Step 3: Commit**

```bash
git add src/components/api/apiUtils.ts
git commit -m "feat(api): add utility functions for variable substitution, auth, URL building"
```

---

### Task 5: Extract StatusBadge, ImportModal, EndpointSidebar

**Files:**
- Create: `src/components/api/StatusBadge.tsx`
- Create: `src/components/api/ImportModal.tsx`
- Create: `src/components/api/EndpointSidebar.tsx`

- [ ] **Step 1: Write StatusBadge.tsx**

```ts
"use client"

export function StatusBadge({ status }: { status: number }) {
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
```

- [ ] **Step 2: Write ImportModal.tsx**

Extract lines 120-238 from the current `ApiRequestBuilder.tsx` into a standalone component. Copy the existing `ImportModal` function verbatim, add the necessary imports:

```ts
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { XIcon, AlertCircleIcon, UploadIcon } from "lucide-react"
import { parseOpenApiSpec, type ParsedOpenApiSpec } from "@/utils/openApiParser"
```

Export as `export function ImportModal({ onImport, onClose }: { onImport: (spec: ParsedOpenApiSpec) => void; onClose: () => void })`. Keep the full existing implementation body unchanged.

- [ ] **Step 3: Write EndpointSidebar.tsx**

Extract lines 242-387 from the current `ApiRequestBuilder.tsx`. Copy the existing `EndpointSidebar` function verbatim, add necessary imports:

```ts
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { BookOpenIcon, SearchIcon, XIcon, ChevronRightIcon, ChevronDownIcon, TrashIcon, PanelLeftCloseIcon } from "lucide-react"
import { type ParsedOpenApiSpec, type OpenApiEndpoint } from "@/utils/openApiParser"
import { METHOD_COLORS_MUTED } from "./apiTypes"
import { cn } from "@/lib/utils"
```

Keep the full existing implementation body unchanged.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "StatusBadge|ImportModal|EndpointSidebar" || echo "No errors"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/api/StatusBadge.tsx src/components/api/ImportModal.tsx src/components/api/EndpointSidebar.tsx
git commit -m "refactor(api): extract StatusBadge, ImportModal, EndpointSidebar from monolith"
```

---

### Task 6: Create HeadersEditor and QueryParamsEditor

**Files:**
- Create: `src/components/api/HeadersEditor.tsx`
- Create: `src/components/api/QueryParamsEditor.tsx`

- [ ] **Step 1: Write HeadersEditor.tsx**

```ts
"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { type KeyValuePair } from "./apiTypes"

interface HeadersEditorProps {
    headers: KeyValuePair[]
    onChange: (headers: KeyValuePair[]) => void
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
    const addHeader = () => onChange([...headers, { key: "", value: "", enabled: true }])

    const removeHeader = (index: number) => onChange(headers.filter((_, i) => i !== index))

    const updateHeader = (index: number, field: keyof KeyValuePair, val: string | boolean) => {
        onChange(headers.map((h, i) => i === index ? { ...h, [field]: val } : h))
    }

    return (
        <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Headers ({headers.filter(h => h.enabled).length})
                </span>
                <Button variant="ghost" size="xs" onClick={addHeader} title="Add header">
                    <PlusIcon className="h-3 w-3" />
                </Button>
            </div>
            <div className="overflow-y-auto flex-1">
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
                        <Button variant="ghost" size="xs" onClick={() => removeHeader(i)} title="Remove">
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
        </div>
    )
}
```

- [ ] **Step 2: Write QueryParamsEditor.tsx**

```ts
"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { type KeyValuePair } from "./apiTypes"

interface QueryParamsEditorProps {
    params: KeyValuePair[]
    onChange: (params: KeyValuePair[]) => void
}

export function QueryParamsEditor({ params, onChange }: QueryParamsEditorProps) {
    const addParam = useCallback(() => {
        onChange([...params, { key: "", value: "", enabled: true }])
    }, [params, onChange])

    const removeParam = useCallback((index: number) => {
        onChange(params.filter((_, i) => i !== index))
    }, [params, onChange])

    const updateParam = useCallback((index: number, field: keyof KeyValuePair, val: string | boolean) => {
        onChange(params.map((p, i) => i === index ? { ...p, [field]: val } : p))
    }, [params, onChange])

    return (
        <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 h-7 border-b border-border flex-shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Params ({params.filter(p => p.enabled).length})
                </span>
                <Button variant="ghost" size="xs" onClick={addParam} title="Add param">
                    <PlusIcon className="h-3 w-3" />
                </Button>
            </div>
            <div className="overflow-y-auto flex-1">
                {params.map((param, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1">
                        <input
                            type="checkbox"
                            checked={param.enabled}
                            onChange={e => updateParam(i, "enabled", e.target.checked)}
                            className="rounded accent-primary flex-shrink-0"
                        />
                        <input
                            type="text"
                            value={param.key}
                            onChange={e => updateParam(i, "key", e.target.value)}
                            placeholder="Key"
                            className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                        <input
                            type="text"
                            value={param.value}
                            onChange={e => updateParam(i, "value", e.target.value)}
                            placeholder="Value"
                            className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                        <Button variant="ghost" size="xs" onClick={() => removeParam(i)} title="Remove">
                            <XIcon className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                {params.length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                        No query params. Click + to add one.
                    </div>
                )}
            </div>
        </div>
    )
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "HeadersEditor|QueryParamsEditor" || echo "No errors"
git add src/components/api/HeadersEditor.tsx src/components/api/QueryParamsEditor.tsx
git commit -m "feat(api): add HeadersEditor and QueryParamsEditor components"
```

---

### Task 7: Create AuthEditor

**Files:**
- Create: `src/components/api/AuthEditor.tsx`

- [ ] **Step 1: Write AuthEditor.tsx**

```ts
"use client"

import { type AuthConfig, AUTH_TYPES } from "./apiTypes"

interface AuthEditorProps {
    auth: AuthConfig
    onChange: (auth: AuthConfig) => void
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
    return (
        <div className="flex flex-col gap-3 p-3">
            {/* Auth type selector */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Type</span>
                <select
                    value={auth.type}
                    onChange={e => onChange({ ...auth, type: e.target.value as AuthConfig["type"] })}
                    className="flex-1 h-6 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground"
                >
                    {AUTH_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            {/* Bearer fields */}
            {auth.type === "bearer" && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Token</span>
                    <input
                        type="text"
                        value={auth.bearer.token}
                        onChange={e => onChange({ ...auth, bearer: { token: e.target.value } })}
                        placeholder="{{token}} or paste token"
                        className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                        spellCheck={false}
                    />
                </div>
            )}

            {/* Basic auth fields */}
            {auth.type === "basic" && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">User</span>
                        <input
                            type="text"
                            value={auth.basic.username}
                            onChange={e => onChange({ ...auth, basic: { ...auth.basic, username: e.target.value } })}
                            placeholder="Username"
                            className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Pass</span>
                        <input
                            type="password"
                            value={auth.basic.password}
                            onChange={e => onChange({ ...auth, basic: { ...auth.basic, password: e.target.value } })}
                            placeholder="Password"
                            className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                    </div>
                </>
            )}

            {/* API Key fields */}
            {auth.type === "api-key" && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Key</span>
                        <input
                            type="text"
                            value={auth.apiKey.key}
                            onChange={e => onChange({ ...auth, apiKey: { ...auth.apiKey, key: e.target.value } })}
                            placeholder="X-API-Key"
                            className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Value</span>
                        <input
                            type="text"
                            value={auth.apiKey.value}
                            onChange={e => onChange({ ...auth, apiKey: { ...auth.apiKey, value: e.target.value } })}
                            placeholder="{{apiKey}} or paste key"
                            className="flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12">Add to</span>
                        <select
                            value={auth.apiKey.addTo}
                            onChange={e => onChange({ ...auth, apiKey: { ...auth.apiKey, addTo: e.target.value as "header" | "query" } })}
                            className="flex-1 h-6 px-2 text-xs bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground"
                        >
                            <option value="header">Header</option>
                            <option value="query">Query Param</option>
                        </select>
                    </div>
                </>
            )}

            {auth.type === "none" && (
                <div className="text-[11px] text-muted-foreground">No authentication configured.</div>
            )}
        </div>
    )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep AuthEditor || echo "No errors"
git add src/components/api/AuthEditor.tsx
git commit -m "feat(api): add AuthEditor component with Bearer, Basic, API Key support"
```

---

### Task 8: Create BodyEditor

**Files:**
- Create: `src/components/api/BodyEditor.tsx`

- [ ] **Step 1: Write BodyEditor.tsx**

```ts
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon, UploadIcon, FileIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { type BodyType, type KeyValuePair, BODY_TYPES, MONACO_OPTIONS } from "./apiTypes"

interface BodyEditorProps {
    bodyType: BodyType
    body: string
    formData: KeyValuePair[]
    urlEncodedData: KeyValuePair[]
    binaryFile: File | null
    onBodyTypeChange: (type: BodyType) => void
    onBodyChange: (body: string) => void
    onFormDataChange: (data: KeyValuePair[]) => void
    onUrlEncodedChange: (data: KeyValuePair[]) => void
    onBinaryFileChange: (file: File | null) => void
    isDark: boolean
    method: string
}

export function BodyEditor({
    bodyType, body, formData, urlEncodedData, binaryFile,
    onBodyTypeChange, onBodyChange, onFormDataChange, onUrlEncodedChange, onBinaryFileChange,
    isDark, method,
}: BodyEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const hasBody = ["POST", "PUT", "PATCH"].includes(method)

    if (!hasBody) {
        return (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                No body for {method} requests
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Body type pills */}
            <div className="flex items-center gap-1 px-3 h-7 border-b border-border flex-shrink-0">
                {BODY_TYPES.map(t => (
                    <button
                        key={t.value}
                        onClick={() => onBodyTypeChange(t.value)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            bodyType === t.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Body content */}
            <div className="flex-1 min-h-0">
                {(bodyType === "json" || bodyType === "raw") && (
                    <Editor
                        height="100%"
                        defaultLanguage={bodyType === "json" ? "json" : "plaintext"}
                        value={body}
                        onChange={v => onBodyChange(v || "")}
                        theme={isDark ? "vs-dark" : "light"}
                        options={MONACO_OPTIONS}
                    />
                )}

                {bodyType === "form-data" && (
                    <KeyValueWithFileEditor data={formData} onChange={onFormDataChange} />
                )}

                {bodyType === "x-www-form-urlencoded" && (
                    <KeyValueSimpleEditor data={urlEncodedData} onChange={onUrlEncodedChange} />
                )}

                {bodyType === "binary" && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => onBinaryFileChange(e.target.files?.[0] || null)} />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <UploadIcon className="h-3.5 w-3.5" />
                            <span className="text-xs">{binaryFile ? "Change file" : "Select file"}</span>
                        </Button>
                        {binaryFile && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileIcon className="h-3 w-3" />
                                <span>{binaryFile.name}</span>
                                <span className="text-[10px]">({(binaryFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>
                )}

                {bodyType === "none" && (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        No body content
                    </div>
                )}
            </div>
        </div>
    )
}

function KeyValueWithFileEditor({ data, onChange }: { data: KeyValuePair[]; onChange: (d: KeyValuePair[]) => void }) {
    return (
        <div className="overflow-y-auto p-1">
            {data.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1">
                    <input type="text" value={row.key} onChange={e => onChange(data.map((r, j) => j === i ? { ...r, key: e.target.value } : r))} placeholder="Key" className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" spellCheck={false} />
                    <input type="text" value={row.value} onChange={e => onChange(data.map((r, j) => j === i ? { ...r, value: e.target.value } : r))} placeholder="Value" className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" spellCheck={false} />
                    <Button variant="ghost" size="xs" onClick={() => onChange(data.filter((_, j) => j !== i))}><XIcon className="h-3 w-3" /></Button>
                </div>
            ))}
            <div className="px-2 py-1">
                <Button variant="ghost" size="xs" onClick={() => onChange([...data, { key: "", value: "", enabled: true }])}><PlusIcon className="h-3 w-3" /><span className="text-[10px]">Add</span></Button>
            </div>
        </div>
    )
}

function KeyValueSimpleEditor({ data, onChange }: { data: KeyValuePair[]; onChange: (d: KeyValuePair[]) => void }) {
    return (
        <div className="overflow-y-auto p-1">
            {data.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1">
                    <input type="text" value={row.key} onChange={e => onChange(data.map((r, j) => j === i ? { ...r, key: e.target.value } : r))} placeholder="Key" className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" spellCheck={false} />
                    <input type="text" value={row.value} onChange={e => onChange(data.map((r, j) => j === i ? { ...r, value: e.target.value } : r))} placeholder="Value" className="flex-1 min-w-0 h-5 px-1.5 text-[11px] font-mono bg-transparent border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" spellCheck={false} />
                    <Button variant="ghost" size="xs" onClick={() => onChange(data.filter((_, j) => j !== i))}><XIcon className="h-3 w-3" /></Button>
                </div>
            ))}
            <div className="px-2 py-1">
                <Button variant="ghost" size="xs" onClick={() => onChange([...data, { key: "", value: "", enabled: true }])}><PlusIcon className="h-3 w-3" /><span className="text-[10px]">Add</span></Button>
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep BodyEditor || echo "No errors"
git add src/components/api/BodyEditor.tsx
git commit -m "feat(api): add BodyEditor with JSON, form-data, URL encoded, raw, binary modes"
```

---

### Task 9: Create RequestPanel

**Files:**
- Create: `src/components/api/RequestPanel.tsx`

- [ ] **Step 1: Write RequestPanel.tsx**

```ts
"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SendIcon, LoaderIcon } from "lucide-react"
import { type HttpMethod, type KeyValuePair, type BodyType, type AuthConfig, METHODS, METHOD_COLORS } from "./apiTypes"
import { HeadersEditor } from "./HeadersEditor"
import { QueryParamsEditor } from "./QueryParamsEditor"
import { BodyEditor } from "./BodyEditor"
import { AuthEditor } from "./AuthEditor"

interface RequestPanelProps {
    method: HttpMethod
    url: string
    headers: KeyValuePair[]
    queryParams: KeyValuePair[]
    bodyType: BodyType
    body: string
    formData: KeyValuePair[]
    urlEncodedData: KeyValuePair[]
    binaryFile: File | null
    auth: AuthConfig
    loading: boolean
    isDark: boolean
    onMethodChange: (method: HttpMethod) => void
    onUrlChange: (url: string) => void
    onHeadersChange: (headers: KeyValuePair[]) => void
    onQueryParamsChange: (params: KeyValuePair[]) => void
    onBodyTypeChange: (type: BodyType) => void
    onBodyChange: (body: string) => void
    onFormDataChange: (data: KeyValuePair[]) => void
    onUrlEncodedChange: (data: KeyValuePair[]) => void
    onBinaryFileChange: (file: File | null) => void
    onAuthChange: (auth: AuthConfig) => void
    onSend: () => void
}

export function RequestPanel(props: RequestPanelProps) {
    return (
        <div className="flex flex-col min-h-0 h-1/2">
            {/* Request bar */}
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b border-border flex-shrink-0">
                {METHODS.map(m => (
                    <button
                        key={m}
                        onClick={() => props.onMethodChange(m)}
                        className={`px-2 py-1 rounded text-[11px] font-medium font-mono transition-colors ${
                            props.method === m ? METHOD_COLORS[m] : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {m}
                    </button>
                ))}
                <div className="w-px h-4 bg-border mx-0.5" />
                <input
                    type="text"
                    value={props.url}
                    onChange={e => props.onUrlChange(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") props.onSend() }}
                    placeholder="https://api.example.com/endpoint"
                    className="order-last md:order-none basis-full md:basis-auto flex-1 h-6 px-2 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
                    spellCheck={false}
                />
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button variant="default" size="xs" onClick={props.onSend} disabled={props.loading || !props.url.trim()}>
                    {props.loading ? <LoaderIcon className="h-3 w-3 animate-spin" /> : <SendIcon className="h-3 w-3" />}
                    <span className="text-[11px]">Send</span>
                </Button>
            </div>

            {/* Tabbed editor */}
            <Tabs defaultValue="params" className="flex-1 flex flex-col min-h-0">
                <TabsList variant="line" className="px-3 flex-shrink-0 h-8">
                    <TabsTrigger value="params" className="text-[11px]">Params</TabsTrigger>
                    <TabsTrigger value="headers" className="text-[11px]">Headers</TabsTrigger>
                    <TabsTrigger value="body" className="text-[11px]">Body</TabsTrigger>
                    <TabsTrigger value="auth" className="text-[11px]">Auth</TabsTrigger>
                </TabsList>
                <TabsContent value="params" className="flex-1 min-h-0">
                    <QueryParamsEditor params={props.queryParams} onChange={props.onQueryParamsChange} />
                </TabsContent>
                <TabsContent value="headers" className="flex-1 min-h-0">
                    <HeadersEditor headers={props.headers} onChange={props.onHeadersChange} />
                </TabsContent>
                <TabsContent value="body" className="flex-1 min-h-0 flex flex-col">
                    <BodyEditor
                        bodyType={props.bodyType} body={props.body}
                        formData={props.formData} urlEncodedData={props.urlEncodedData} binaryFile={props.binaryFile}
                        onBodyTypeChange={props.onBodyTypeChange} onBodyChange={props.onBodyChange}
                        onFormDataChange={props.onFormDataChange} onUrlEncodedChange={props.onUrlEncodedChange}
                        onBinaryFileChange={props.onBinaryFileChange}
                        isDark={props.isDark} method={props.method}
                    />
                </TabsContent>
                <TabsContent value="auth" className="flex-1 min-h-0 overflow-y-auto">
                    <AuthEditor auth={props.auth} onChange={props.onAuthChange} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep RequestPanel || echo "No errors"
git add src/components/api/RequestPanel.tsx
git commit -m "feat(api): add RequestPanel with tabbed Params/Headers/Body/Auth"
```

---

### Task 10: Create ResponsePanel

**Files:**
- Create: `src/components/api/ResponsePanel.tsx`

- [ ] **Step 1: Write ResponsePanel.tsx**

```ts
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CopyIcon, CheckIcon, LoaderIcon } from "lucide-react"
import Editor from "@monaco-editor/react"
import { type ApiResponse, MONACO_OPTIONS } from "./apiTypes"
import { detectLanguage, formatSize } from "./apiUtils"
import { StatusBadge } from "./StatusBadge"

interface ResponsePanelProps {
    response: ApiResponse | null
    loading: boolean
    error: string | null
    isDark: boolean
}

export function ResponsePanel({ response, loading, error, isDark }: ResponsePanelProps) {
    const [copiedHeader, setCopiedHeader] = useState<string | null>(null)

    const copyHeaderValue = async (key: string, value: string) => {
        await navigator.clipboard.writeText(value)
        setCopiedHeader(key)
        setTimeout(() => setCopiedHeader(null), 2000)
    }

    const sortedHeaders = response
        ? Object.entries(response.headers).sort(([a], [b]) => a.localeCompare(b))
        : []

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-border">
            {/* Status bar */}
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
                        <span className="text-destructive text-xs">{error}</span>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : response ? (
                <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
                    <TabsList variant="line" className="px-3 flex-shrink-0 h-8">
                        <TabsTrigger value="body" className="text-[11px]">Body</TabsTrigger>
                        <TabsTrigger value="headers" className="text-[11px]">Headers ({sortedHeaders.length})</TabsTrigger>
                        <TabsTrigger value="timing" className="text-[11px]">Timing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="body" className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage={detectLanguage(response.body)}
                            value={response.body}
                            theme={isDark ? "vs-dark" : "light"}
                            options={{ ...MONACO_OPTIONS, readOnly: true }}
                        />
                    </TabsContent>
                    <TabsContent value="headers" className="flex-1 min-h-0 overflow-y-auto">
                        <div className="divide-y divide-border">
                            {sortedHeaders.map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => copyHeaderValue(key, value)}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted/30 transition-colors group"
                                >
                                    <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0 w-40 truncate">{key}</span>
                                    <span className="text-[11px] font-mono text-foreground/80 truncate flex-1">{value}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        {copiedHeader === key ? <CheckIcon className="h-3 w-3 text-emerald-500" /> : <CopyIcon className="h-3 w-3 text-muted-foreground" />}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="timing" className="flex-1 min-h-0 overflow-y-auto p-3">
                        <TimingBreakdown totalTime={response.time} />
                    </TabsContent>
                </Tabs>
            ) : !error ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                    Send a request to see the response
                </div>
            ) : null}
        </div>
    )
}

function TimingBreakdown({ totalTime }: { totalTime: number }) {
    // PerformanceResourceTiming is often unavailable due to CORS
    // Show total time as the reliable fallback
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-20">Total</span>
                <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500/60 rounded" style={{ width: "100%" }} />
                </div>
                <span className="text-xs font-mono text-foreground w-16 text-right">{totalTime}ms</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
                Detailed timing breakdown (DNS, TLS, TTFB) is available when the server provides timing headers via the Resource Timing API.
            </p>
        </div>
    )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep ResponsePanel || echo "No errors"
git add src/components/api/ResponsePanel.tsx
git commit -m "feat(api): add ResponsePanel with Body/Headers/Timing tabs"
```

---

### Task 11: Create HistoryDrawer, CollectionsDrawer, EnvDrawer

**Files:**
- Create: `src/components/api/HistoryDrawer.tsx`
- Create: `src/components/api/CollectionsDrawer.tsx`
- Create: `src/components/api/EnvDrawer.tsx`

- [ ] **Step 1: Write HistoryDrawer.tsx**

A slide-out drawer listing past requests. Uses the same pattern as `PresetsDrawer` (fixed overlay, slide from right). Each row shows method badge, URL, status, time ago. Click loads into editor. Search/filter at top. Clear all in footer. Read `src/components/shared/PresetsDrawer.tsx` for the styling pattern.

Props:
```ts
interface HistoryDrawerProps {
    open: boolean
    onClose: () => void
    history: HistoryEntry[]
    onSelect: (entry: HistoryEntry) => void
    onDelete: (id: string) => void
    onClear: () => void
}
```

- [ ] **Step 2: Write CollectionsDrawer.tsx**

Slide-out drawer for collections management. Expandable collection rows with nested request rows. "New Collection" button. "Save current" action triggers a callback to the parent. 

Props:
```ts
interface CollectionsDrawerProps {
    open: boolean
    onClose: () => void
    collections: Collection[]
    getRequestsByCollection: (id: string) => StoredRequest[]
    onSelectRequest: (request: StoredRequest) => void
    onDeleteRequest: (id: string) => void
    onAddCollection: (name: string) => void
    onDeleteCollection: (id: string) => void
    onRenameCollection: (id: string, name: string) => void
    onSaveCurrent: (name: string, collectionId: string) => void
}
```

- [ ] **Step 3: Write EnvDrawer.tsx**

Slide-out drawer for environment variables. Key-value editor. Footer shows variable usage count from current request.

Props:
```ts
interface EnvDrawerProps {
    open: boolean
    onClose: () => void
    vars: Record<string, string>
    onChange: (vars: Record<string, string>) => void
    referencedVars: string[]  // variable names found in current request
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "HistoryDrawer|CollectionsDrawer|EnvDrawer" || echo "No errors"
git add src/components/api/HistoryDrawer.tsx src/components/api/CollectionsDrawer.tsx src/components/api/EnvDrawer.tsx
git commit -m "feat(api): add History, Collections, and Environment drawers"
```

---

### Task 12: Rename presets file

**Files:**
- Rename: `src/components/api/apiRequestPresets.ts` → `src/components/api/apiPresets.ts`

- [ ] **Step 1: Rename and update import**

```bash
mv src/components/api/apiRequestPresets.ts src/components/api/apiPresets.ts
```

Update the import name inside the file from `API_REQUEST_PRESETS` to `API_PRESETS` and update the presets to include `queryParams`, `bodyType`, and `auth` fields in each preset's content JSON.

- [ ] **Step 2: Commit**

```bash
git add src/components/api/
git commit -m "refactor(api): rename apiRequestPresets to apiPresets, extend preset schema"
```

---

### Task 13: Rewrite ApiRequestBuilder orchestrator

**Files:**
- Rewrite: `src/components/api/ApiRequestBuilder.tsx`

- [ ] **Step 1: Write the new orchestrator**

This is the main file that wires everything together. It should be ~200-250 lines. Responsibilities:

1. State: method, URL, headers, queryParams, bodyType, body, formData, urlEncodedData, binaryFile, auth, response, loading, error
2. Hooks: `useApiStore()`, `useLocalStorage("kutu-api-env")`, `useShareableUrl`, `useKeyboardShortcuts`, `useTheme`
3. Bidirectional URL/queryParams sync
4. `handleSend()`: resolves env vars in all fields, resolves auth, builds final URL with params, makes fetch, saves to history
5. Drawer state: historyOpen, collectionsOpen, envOpen, importModalOpen
6. Layout: `ToolToolbar` → optional `EndpointSidebar` + `RequestPanel` (top) + `ResponsePanel` (bottom)
7. Toolbar actions: History, Collections, Env, OpenAPI import buttons
8. Save-to-collection handler

All child components imported from their respective files. No inline component definitions.

- [ ] **Step 2: Verify full build**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -5
```

Expected: zero errors, build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/api/ApiRequestBuilder.tsx
git commit -m "feat(api): rewrite ApiRequestBuilder as modular orchestrator"
```

---

### Task 14: Final cleanup and verification

**Files:**
- Verify all files in `src/components/api/`

- [ ] **Step 1: Verify file count**

```bash
ls -1 src/components/api/ | wc -l
```

Expected: 18 files

- [ ] **Step 2: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | wc -l
```

Expected: 0

- [ ] **Step 3: Full build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds, all pages generated

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(api): complete API Request Builder overhaul

- IndexedDB storage for history (200 entries) and collections
- Auth helpers: Bearer, Basic Auth, API Key
- Query params editor with bidirectional URL sync
- Body format options: JSON, Form Data, URL Encoded, Raw, Binary
- Environment variables with {{variable}} substitution
- Response tabs: Body, Headers, Timing
- History drawer, Collections drawer, Environment drawer
- Decomposed from 927-line monolith into 18 focused files"
```
