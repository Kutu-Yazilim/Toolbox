"use client"

import { useRef, useCallback } from "react"
import { fetchColorNames } from "@/services/colorApi"

const DEBOUNCE_MS = 150

export function useColorNames(): {
    getName: (hex: string) => string | null
    preloadNames: (hexes: string[]) => void
} {
    const cacheRef = useRef(new Map<string, string>())
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const getName = useCallback((hex: string): string | null => {
        return cacheRef.current.get(hex.toUpperCase()) ?? null
    }, [])

    const preloadNames = useCallback((hexes: string[]) => {
        const uncached = hexes
            .map((h) => h.toUpperCase())
            .filter((h) => !cacheRef.current.has(h))

        if (uncached.length === 0) return

        // Clear any pending debounce
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(() => {
            fetchColorNames(uncached).then((names) => {
                for (const [hex, name] of Object.entries(names)) {
                    cacheRef.current.set(hex.toUpperCase(), name)
                }
            })
        }, DEBOUNCE_MS)
    }, [])

    return { getName, preloadNames }
}
