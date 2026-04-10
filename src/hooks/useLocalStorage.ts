"use client"

import { useState, useCallback, useEffect, useRef } from "react"

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(defaultValue)
    const isInitialized = useRef(false)

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const item = localStorage.getItem(key)
            if (item !== null) {
                setStoredValue(JSON.parse(item))
            }
        } catch {
            // Parse error — keep default
        }
        isInitialized.current = true
    }, [key])

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const nextValue = value instanceof Function ? value(prev) : value
            try {
                localStorage.setItem(key, JSON.stringify(nextValue))
            } catch {
                // Storage full or unavailable — continue with in-memory state
            }
            return nextValue
        })
    }, [key])

    return [storedValue, setValue]
}
