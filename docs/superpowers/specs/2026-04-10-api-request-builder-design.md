# API Request Builder — Deep Overhaul Design Spec

**Date:** 2026-04-10
**Scope:** Full modernization of the API Request Builder — IndexedDB storage, UI decomposition, new features
**Approach:** IndexedDB-first architecture (storage layer → decomposition → features)

---

## Phase 1: Storage Layer

### Dependency

Add `idb` package (~1KB) for typed IndexedDB access.

### IndexedDB Schema

Database name: `kutu-api`, version 1. Three object stores:

#### `requests` — saved request configs

```ts
interface StoredRequest {
  id: string                    // crypto.randomUUID()
  name: string                  // user-given or auto-generated from method+path
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  queryParams: KeyValuePair[]
  bodyType: BodyType
  body: string
  auth: AuthConfig
  collectionId: string | null   // null = uncollected
  createdAt: number
  updatedAt: number
}
```

#### `collections` — named groups of requests

```ts
interface Collection {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}
```

#### `history` — auto-saved request/response pairs

```ts
interface HistoryEntry {
  id: string
  requestId: string | null      // link to saved request, or null for ad-hoc
  method: HttpMethod
  url: string
  status: number
  statusText: string
  responseBody: string
  responseHeaders: Record<string, string>
  time: number                  // response time ms
  size: number                  // response bytes
  timestamp: number             // epoch ms when sent
}
```

### Types

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type BodyType = "json" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary" | "none"

type AuthType = "none" | "bearer" | "basic" | "api-key"

interface AuthConfig {
  type: AuthType
  bearer: { token: string }
  basic: { username: string; password: string }
  apiKey: { key: string; value: string; addTo: "header" | "query" }
}

interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}
```

### `apiStore.ts` — IndexedDB Wrapper

Low-level functions wrapping `idb`:

```ts
// Database init
openDb(): Promise<IDBPDatabase>

// History
getHistory(limit?: number): Promise<HistoryEntry[]>
addHistory(entry: HistoryEntry): Promise<void>
deleteHistory(id: string): Promise<void>
clearHistory(): Promise<void>

// Collections
getCollections(): Promise<Collection[]>
addCollection(collection: Collection): Promise<void>
updateCollection(collection: Collection): Promise<void>
deleteCollection(id: string): Promise<void>

// Requests
getRequests(): Promise<StoredRequest[]>
getRequestsByCollection(collectionId: string): Promise<StoredRequest[]>
saveRequest(request: StoredRequest): Promise<void>
updateRequest(request: StoredRequest): Promise<void>
deleteRequest(id: string): Promise<void>
```

**Location:** `src/components/api/apiStore.ts`

### `useApiStore.ts` — React Hook

Wraps `apiStore.ts` with React state. Loads data on mount, provides mutation functions that update both IndexedDB and React state.

```ts
const {
  history, addHistory, clearHistory, deleteHistory,
  collections, addCollection, updateCollection, deleteCollection,
  requests, saveRequest, updateRequest, deleteRequest,
  getRequestsByCollection,
} = useApiStore()
```

**Location:** `src/components/api/useApiStore.ts`

### Environment Variables

Stored in localStorage via `useLocalStorage` (small, simple — not IndexedDB). Single environment, not multiple named ones.

```ts
const [envVars, setEnvVars] = useLocalStorage<Record<string, string>>("kutu-api-env", {})
```

### Variable Substitution

```ts
function resolveVariables(template: string, vars: Record<string, string>): string
```

Replaces `{{key}}` patterns in URL, header values, query param values, and body before sending. Does NOT modify the stored/displayed values — only the outgoing request.

**Location:** `src/components/api/apiUtils.ts`

---

## Phase 2: UI Decomposition

### File Structure

All files flat in `src/components/api/` (matching repo convention):

```
src/components/api/
├── ApiRequestBuilder.tsx    — main orchestrator (rewrite, ~150 lines)
├── RequestPanel.tsx          — request bar + tabbed request editor
├── ResponsePanel.tsx         — tabbed response viewer
├── QueryParamsEditor.tsx     — key-value editor synced with URL
├── HeadersEditor.tsx         — key-value editor with enable/disable
├── BodyEditor.tsx            — body type selector + editor per type
├── AuthEditor.tsx            — auth type dropdown + config fields
├── HistoryDrawer.tsx         — slide-out past requests list
├── CollectionsDrawer.tsx     — slide-out collections/requests manager
├── EnvDrawer.tsx             — slide-out environment variables editor
├── ImportModal.tsx           — OpenAPI spec import (extracted from monolith)
├── EndpointSidebar.tsx       — OpenAPI endpoint browser (extracted from monolith)
├── StatusBadge.tsx           — status code badge (extracted from monolith)
├── apiStore.ts               — IndexedDB wrapper
├── useApiStore.ts            — React hook over apiStore
├── apiTypes.ts               — all shared types
├── apiUtils.ts               — resolveVariables, detectLanguage, formatSize
├── apiPresets.ts             — presets (already exists as apiRequestPresets.ts, rename)
```

### `ApiRequestBuilder.tsx` — Main Orchestrator (~150 lines)

Responsibilities:
- Holds current request state (method, URL, headers, queryParams, body, bodyType, auth)
- Holds current response state
- Wires `useApiStore`, `useLocalStorage` (env vars), `useShareableUrl`, `useKeyboardShortcuts`
- Renders `ToolToolbar` with actions for History, Collections, Env, OpenAPI import
- Renders layout: optional sidebar + `RequestPanel` (top half) + `ResponsePanel` (bottom half)
- Handles the `send()` function: resolves variables, resolves auth → headers/query, makes fetch, saves to history
- Passes state down to child components via props

### `RequestPanel.tsx`

Contains:
- Request bar: method pills, URL input (with `{{variable}}` syntax highlighting via colored spans), Send button
- Tabs (using `src/components/ui/tabs.tsx`): Params | Headers | Body | Auth
- Each tab renders its respective editor component

### `ResponsePanel.tsx`

Contains:
- Status bar: StatusBadge, response time, response size
- Tabs: Body | Headers | Timing
- **Body tab:** Monaco editor (read-only, theme-aware, auto-detected language)
- **Headers tab:** table view of response headers, click row to copy value
- **Timing tab:** breakdown using `PerformanceResourceTiming` API where available (DNS, connect, TLS, waiting, download). Falls back to showing total time only if timing data not accessible.

### `QueryParamsEditor.tsx`

- Same key-value editor pattern as headers (key, value, enabled checkbox, remove button)
- **Bidirectional URL sync:**
  - Editing a param updates the URL query string
  - Editing the URL parses query params and updates the list
  - Sync is debounced to avoid cursor-jump issues
- Add button for new params

### `HeadersEditor.tsx`

- Extracted from current monolith (lines 746-783)
- Same key-value editor: checkbox, key input, value input, remove button
- Add header button
- No changes to existing behavior

### `BodyEditor.tsx`

- Top: body type selector pills (JSON, Form Data, URL Encoded, Raw, Binary, None)
- **JSON mode:** Monaco editor (theme-aware, language: json)
- **Form Data mode:** key-value editor with file upload column. Each row: key, value (text input or file picker toggle), type badge (text/file), remove
- **URL Encoded mode:** key-value editor (key, value, remove). Auto-generates `key=value&...` encoded string
- **Raw mode:** Monaco editor (theme-aware, language: plaintext)
- **Binary mode:** single file picker with file name display and size
- **None mode:** centered text "No body for {method} requests"
- Body type auto-defaults: GET/DELETE → none, POST/PUT/PATCH → json

### `AuthEditor.tsx`

- Dropdown selector: None | Bearer Token | Basic Auth | API Key
- **None:** no fields
- **Bearer:** single text input for token, with `{{variable}}` support
- **Basic:** username + password inputs
- **API Key:** key name input, value input, "Add to" dropdown (Header / Query Param)
- At send time, auth is resolved:
  - Bearer → `Authorization: Bearer <token>` header
  - Basic → `Authorization: Basic <base64(user:pass)>` header
  - API Key → either header or query param depending on `addTo`

### `HistoryDrawer.tsx`

- Slide-out from right (same pattern as `PresetsDrawer`)
- Search/filter input at top
- List of past requests, newest first
- Each row: method badge (colored), URL (truncated), status badge, time ago (relative)
- Click a row to load that request into the editor
- "Clear all" button in footer
- Delete individual entries (X button on hover)
- Auto-saved on every successful Send

### `CollectionsDrawer.tsx`

- Slide-out from right
- Top: "New Collection" button
- List of collections, each expandable to show its requests
- Collection row: name, request count, expand/collapse chevron, edit/delete buttons
- Request row (under collection): method badge, name/URL, click to load, delete button
- "Save current request" action: opens a mini-form (name input, collection dropdown, save button)
- Collections and requests are reorderable (drag handle or up/down buttons)

### `EnvDrawer.tsx`

- Slide-out from right
- Key-value editor for environment variables
- Each row: key input (the variable name), value input, remove button
- Add variable button
- Footer: shows count of variables used in current request (scans URL, headers, body for `{{...}}` patterns)
- Variables are highlighted when they match a `{{key}}` found in the current request

### `ImportModal.tsx`

- Extracted from current monolith (lines 120-238)
- No behavioral changes — same OpenAPI JSON paste/upload functionality

### `EndpointSidebar.tsx`

- Extracted from current monolith (lines 242-387)
- No behavioral changes — same tag-grouped, searchable endpoint list

### `StatusBadge.tsx`

- Extracted from current monolith (lines 102-116)
- No behavioral changes

---

## Phase 3: Features

### 3.1 Request History

- Auto-saved to IndexedDB on every Send (success or failure)
- History stores full request config + response (status, body, headers, timing)
- HistoryDrawer shows last 100 entries (configurable)
- Click to reload request into editor
- Clear all / delete individual
- Search by URL or method
- History is capped at 200 entries. When exceeded, oldest entries are deleted on the next save.
- Loading a request from history does NOT create a link to a saved collection request — it's a copy into the editor

### 3.2 Collections

- Named groups of saved requests
- Create collection → give it a name
- Save current request → pick a collection, give it a name
- Load a saved request → click in CollectionsDrawer
- Delete/rename collections
- Requests can belong to one collection or none
- Editing a request loaded from a collection does NOT auto-save — changes are local until the user explicitly clicks "Save" (overwrite) or "Save As" (new copy)

### 3.3 Auth Helpers

- Auth config is part of the request state — saved with collections/history
- At send time, auth is resolved into headers or query params
- Auth is separate from manual headers — users can still add their own Authorization header manually (auth helper won't overwrite it if type is "none")
- Variable substitution works in auth fields (`{{token}}`, `{{username}}`)

### 3.4 Query Params Editor

- Separate tab in RequestPanel
- Bidirectional sync with URL query string
- URL `?key=val&key2=val2` ↔ params list `[{key: "key", value: "val"}, ...]`
- Enable/disable individual params (disabled params are removed from URL)
- Variable substitution: `{{baseUrl}}/api?token={{apiKey}}`

### 3.5 Body Format Options

- 5 formats + none (see BodyEditor section above)
- Content-Type auto-set based on body type (user can override in headers)
- Form-data supports file uploads (read as base64 for display, sent as FormData)
- Binary supports single file upload

### 3.6 Environment Variables

- Single environment, stored in localStorage
- Key-value pairs: `baseUrl` → `https://api.example.com`, `token` → `sk-123...`
- Variable syntax: `{{variableName}}`
- Substituted at send time in: URL, header values, query param values, body, auth fields
- EnvDrawer shows which variables are referenced in current request
- Unreferenced variables are dimmed, missing variables (referenced but not defined) are highlighted in red

### 3.7 Response Tabs

- **Body:** Monaco editor, read-only, auto-detected language, theme-aware
- **Headers:** table with key/value columns, click to copy value, sorted alphabetically
- **Timing:** PerformanceResourceTiming breakdown when available:
  - DNS Lookup: `domainLookupEnd - domainLookupStart`
  - TCP Connect: `connectEnd - connectStart`
  - TLS: `secureConnectionStart > 0 ? connectEnd - secureConnectionStart : N/A`
  - Waiting (TTFB): `responseStart - requestStart`
  - Download: `responseEnd - responseStart`
  - Total: `responseEnd - startTime`
  - Displayed as horizontal bar chart with labeled segments
  - Falls back to "Total: Xms" if timing API is not available (CORS restrictions)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Mod+Enter` | Send request |
| `Mod+S` | Save request to collection |
| `Mod+H` | Toggle history drawer |
| `Mod+K` | Toggle collections drawer |
| `Mod+E` | Toggle environment drawer |
| `Mod+I` | Open import modal |

---

## Export Options (via ToolToolbar)

- Copy as cURL
- Copy response body
- Download response as file (`.json`, `.xml`, `.txt` based on detected type)
- Copy request as JSON (the full request config)

---

## Dependencies

**New:**
- `idb` — typed IndexedDB wrapper (~1KB gzipped)

**Existing (no changes):**
- `@monaco-editor/react`
- `lucide-react`
- All shared infrastructure hooks/components

---

## Migration Notes

- The existing `apiRequestPresets.ts` file is renamed to `apiPresets.ts` (file rename only — no functional change)
- The existing `ApiRequestBuilder.tsx` is fully rewritten (not surgically modified)
- Existing shared infra integration (ToolToolbar, useLocalStorage, useShareableUrl, useKeyboardShortcuts) is preserved
- The `useLocalStorage` key `api-request-builder` is kept for backward compatibility (env vars use a new key `kutu-api-env`)
- The OpenAPI parser (`src/utils/openApiParser.ts`) is unchanged
