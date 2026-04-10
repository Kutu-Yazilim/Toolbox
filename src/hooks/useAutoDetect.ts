"use client"

import { useMemo } from "react"

interface DetectionResult {
    type: "json" | "base64" | "url-encoded" | "html-entity" | "jwt" | "timestamp" | "dbml" | "regex" | "unknown"
    confidence: number
}

export function useAutoDetect(input: string): DetectionResult {
    return useMemo(() => detectFormat(input), [input])
}

export function detectFormat(input: string): DetectionResult {
    const trimmed = input.trim()
    if (!trimmed) return { type: "unknown", confidence: 0 }

    // JSON — try parse
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed)
            return { type: "json", confidence: 0.95 }
        } catch {
            // Might still be malformed JSON
            return { type: "json", confidence: 0.3 }
        }
    }

    // JWT — three dot-separated base64 segments
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
        try {
            const header = JSON.parse(atob(trimmed.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")))
            if (header.alg) return { type: "jwt", confidence: 0.95 }
        } catch {
            // Not a valid JWT
        }
    }

    // Base64 — valid charset and length divisible by 4 (with padding)
    if (/^[A-Za-z0-9+/]+=*$/.test(trimmed) && trimmed.length >= 4) {
        if (trimmed.length % 4 === 0 || trimmed.endsWith("=")) {
            return { type: "base64", confidence: trimmed.length > 20 ? 0.85 : 0.5 }
        }
        return { type: "base64", confidence: 0.4 }
    }

    // URL-encoded — contains %XX patterns
    if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
        const percentCount = (trimmed.match(/%[0-9A-Fa-f]{2}/g) || []).length
        const ratio = percentCount / trimmed.length
        return { type: "url-encoded", confidence: Math.min(0.95, 0.5 + ratio * 10) }
    }

    // HTML entities
    if (/&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(trimmed)) {
        return { type: "html-entity", confidence: 0.8 }
    }

    // DBML — contains Table/Ref keywords
    if (/\bTable\s+\w+\s*\{/.test(trimmed) || /\bRef\s*:/.test(trimmed)) {
        return { type: "dbml", confidence: 0.9 }
    }

    // Timestamp — pure digits of appropriate length
    if (/^\d{10,13}$/.test(trimmed)) {
        return { type: "timestamp", confidence: 0.85 }
    }

    // Regex — slash-delimited with optional flags
    if (/^\/.*\/[gimsuy]*$/.test(trimmed)) {
        return { type: "regex", confidence: 0.8 }
    }

    return { type: "unknown", confidence: 0 }
}
