"use client"

import { useCallback, useEffect, useRef } from "react"
import LZString from "lz-string"

interface UseShareableUrlResult {
    shareUrl: () => Promise<void>
    loadFromUrl: () => { found: boolean; state: unknown }
    hasUrlState: boolean
}

export function useShareableUrl<T>(
    toolId: string,
    state: T,
    onRestore: (state: T) => void,
): UseShareableUrlResult {
    const restoredRef = useRef(false)
    const hasUrlState = typeof window !== "undefined" && window.location.hash.startsWith("#s=")

    // Restore state from URL hash on mount
    useEffect(() => {
        if (restoredRef.current) return
        restoredRef.current = true

        const result = decodeFromHash<T>()
        if (result.found && result.state !== null) {
            onRestore(result.state as T)
        }
    }, [onRestore])

    const shareUrl = useCallback(async () => {
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify({ t: toolId, s: state }))
        const url = `${window.location.origin}${window.location.pathname}#s=${compressed}`

        // Update URL without reload
        window.history.replaceState(null, "", url)
        await navigator.clipboard.writeText(url)
    }, [toolId, state])

    const loadFromUrl = useCallback(() => {
        return decodeFromHash<T>()
    }, [])

    return { shareUrl, loadFromUrl, hasUrlState }
}

function decodeFromHash<T>(): { found: boolean; state: T | null } {
    if (typeof window === "undefined") return { found: false, state: null }

    const hash = window.location.hash
    if (!hash.startsWith("#s=")) return { found: false, state: null }

    try {
        const compressed = hash.slice(3)
        const json = LZString.decompressFromEncodedURIComponent(compressed)
        if (!json) return { found: false, state: null }
        const parsed = JSON.parse(json)
        return { found: true, state: parsed.s as T }
    } catch {
        return { found: false, state: null }
    }
}
