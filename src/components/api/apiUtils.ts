import { type AuthConfig, type KeyValuePair } from "./apiTypes"

export function resolveVariables(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return key in vars ? vars[key] : match
    })
}

export function detectLanguage(body: string): string {
    try {
        JSON.parse(body)
        return "json"
    } catch {
        if (body.trimStart().startsWith("<")) {
            return "html"
        }
        return "plaintext"
    }
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diffMs = now - timestamp
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
        return "just now"
    }
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`
    }
    if (diffHours < 24) {
        return `${diffHours}h ago`
    }
    if (diffDays <= 30) {
        return `${diffDays}d ago`
    }
    return new Date(timestamp).toLocaleDateString()
}

export function resolveAuth(
    auth: AuthConfig,
    vars: Record<string, string>
): { headers: Record<string, string>; queryParams: Record<string, string> } {
    const headers: Record<string, string> = {}
    const queryParams: Record<string, string> = {}

    if (auth.type === "bearer") {
        const token = resolveVariables(auth.bearer.token, vars)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
    } else if (auth.type === "basic") {
        const username = resolveVariables(auth.basic.username, vars)
        const password = resolveVariables(auth.basic.password, vars)
        if (username || password) {
            const encoded = btoa(`${username}:${password}`)
            headers["Authorization"] = `Basic ${encoded}`
        }
    } else if (auth.type === "api-key") {
        const key = resolveVariables(auth.apiKey.key, vars)
        const value = resolveVariables(auth.apiKey.value, vars)
        if (key) {
            if (auth.apiKey.addTo === "query") {
                queryParams[key] = value
            } else {
                headers[key] = value
            }
        }
    }

    return { headers, queryParams }
}

export function buildUrlWithParams(
    baseUrl: string,
    queryParams: KeyValuePair[],
    extraParams?: Record<string, string>
): string {
    let url = baseUrl.trim()
    if (url && !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
        url = `https://${url}`
    }

    let base: string
    let existingSearch: string

    try {
        const parsed = new URL(url)
        base = `${parsed.origin}${parsed.pathname}`
        existingSearch = parsed.search
    } catch {
        base = url
        existingSearch = ""
    }

    const params = new URLSearchParams(existingSearch)

    for (const pair of queryParams) {
        if (pair.enabled && pair.key.trim() !== "") {
            params.set(pair.key, pair.value)
        }
    }

    if (extraParams) {
        for (const [key, value] of Object.entries(extraParams)) {
            if (key) {
                params.set(key, value)
            }
        }
    }

    const search = params.toString()
    return search ? `${base}?${search}` : base
}

export function parseQueryParams(url: string): KeyValuePair[] {
    try {
        const parsed = new URL(url.includes("://") ? url : `https://${url}`)
        const pairs: KeyValuePair[] = []
        parsed.searchParams.forEach((value, key) => {
            pairs.push({ key, value, enabled: true })
        })
        return pairs
    } catch {
        return []
    }
}

export function getUrlWithoutParams(url: string): string {
    try {
        const parsed = new URL(url.includes("://") ? url : `https://${url}`)
        return `${parsed.origin}${parsed.pathname}`
    } catch {
        return url.split("?")[0]
    }
}

export function findVariableRefs(text: string): string[] {
    const matches = text.matchAll(/\{\{(\w+)\}\}/g)
    const seen = new Set<string>()
    for (const match of matches) {
        seen.add(match[1])
    }
    return Array.from(seen)
}

export function generateCurl(
    method: string,
    url: string,
    headers: KeyValuePair[],
    body: string,
    bodyType: string
): string {
    const parts: string[] = [`curl -X ${method}`]

    for (const header of headers) {
        if (header.enabled && header.key.trim() !== "") {
            parts.push(`  -H "${header.key}: ${header.value}"`)
        }
    }

    if (body && bodyType !== "none" && method !== "GET") {
        const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
        parts.push(`  -d "${escaped}"`)
    }

    parts.push(`  "${url}"`)

    return parts.join(" \\\n")
}
