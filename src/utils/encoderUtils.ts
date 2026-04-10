// Base64 encode/decode with proper Unicode support
export function base64Encode(input: string): string {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(input)
    const binary = Array.from(bytes, b => String.fromCharCode(b)).join("")
    return btoa(binary)
}

export function base64Decode(input: string): string {
    const binary = atob(input)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
}

// URL encode/decode
export function urlEncode(input: string, mode: "component" | "uri"): string {
    return mode === "component" ? encodeURIComponent(input) : encodeURI(input)
}

export function urlDecode(input: string, mode: "component" | "uri"): string {
    try {
        return mode === "component" ? decodeURIComponent(input) : decodeURI(input)
    } catch {
        throw new Error("Invalid encoded URI string")
    }
}

// HTML entity encode/decode
const HTML_ENTITY_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
}

const HTML_ENTITY_REVERSE_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(HTML_ENTITY_MAP).map(([k, v]) => [v, k])
)

export function htmlEntityEncode(input: string): string {
    return input.replace(/[&<>"'`=/]/g, ch => HTML_ENTITY_MAP[ch] ?? ch)
}

export function htmlEntityDecode(input: string): string {
    // Named and numeric entities
    return input.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z]+));/g, (match, hex, dec, named) => {
        if (hex) return String.fromCodePoint(parseInt(hex, 16))
        if (dec) return String.fromCodePoint(parseInt(dec, 10))
        const namedEntity = `&${named};`
        return HTML_ENTITY_REVERSE_MAP[namedEntity] ?? match
    })
}

// Base64 URL-safe variants
export function base64UrlSafeEncode(input: string): string {
    return base64Encode(input)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

export function base64UrlSafeDecode(input: string): string {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)
    return base64Decode(base64)
}

// JWT decode (header and payload only -- no signature verification)
function base64UrlDecode(str: string): string {
    // Base64url to Base64
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
    // Pad with '='
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)
    return base64Decode(base64)
}

export interface JwtDecoded {
    header: Record<string, unknown>
    payload: Record<string, unknown>
    signature: string
    expiry: { date: Date; expired: boolean } | null
    issuedAt: { date: Date } | null
}

export function decodeJwt(token: string): JwtDecoded {
    const parts = token.trim().split(".")
    if (parts.length !== 3) {
        throw new Error("Invalid JWT: expected 3 parts (header.payload.signature), got " + parts.length)
    }

    const headerJson = base64UrlDecode(parts[0])
    const payloadJson = base64UrlDecode(parts[1])

    let header: Record<string, unknown>
    let payload: Record<string, unknown>

    try {
        header = JSON.parse(headerJson)
    } catch {
        throw new Error("Invalid JWT header: not valid JSON")
    }

    try {
        payload = JSON.parse(payloadJson)
    } catch {
        throw new Error("Invalid JWT payload: not valid JSON")
    }

    let expiry: JwtDecoded["expiry"] = null
    if (typeof payload.exp === "number") {
        const date = new Date(payload.exp * 1000)
        expiry = { date, expired: date.getTime() < Date.now() }
    }

    let issuedAt: JwtDecoded["issuedAt"] = null
    if (typeof payload.iat === "number") {
        issuedAt = { date: new Date(payload.iat * 1000) }
    }

    return {
        header,
        payload,
        signature: parts[2],
        expiry,
        issuedAt,
    }
}

export function formatRelativeTime(date: Date): string {
    const now = Date.now()
    const diff = date.getTime() - now
    const absDiff = Math.abs(diff)

    const seconds = Math.floor(absDiff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

    if (days > 0) return rtf.format(diff > 0 ? days : -days, "day")
    if (hours > 0) return rtf.format(diff > 0 ? hours : -hours, "hour")
    if (minutes > 0) return rtf.format(diff > 0 ? minutes : -minutes, "minute")
    return rtf.format(diff > 0 ? seconds : -seconds, "second")
}
