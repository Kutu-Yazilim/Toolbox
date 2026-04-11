"use client"

import { useRef, useState, useCallback } from "react"

interface UseColorHistoryResult<T> {
    pushState: (state: T) => void
    undo: () => T | null
    redo: () => T | null
    canUndo: boolean
    canRedo: boolean
}

export function useColorHistory<T>(maxHistory = 50): UseColorHistoryResult<T> {
    const historyRef = useRef<T[]>([])
    const indexRef = useRef(-1)
    // Trigger re-renders when canUndo/canRedo change
    const [, setTick] = useState(0)
    const tick = useCallback(() => setTick((t) => t + 1), [])

    const pushState = useCallback(
        (state: T) => {
            const history = historyRef.current
            // Truncate future states if we're not at the end
            historyRef.current = history.slice(0, indexRef.current + 1)
            historyRef.current.push(state)

            // Enforce max size
            if (historyRef.current.length > maxHistory) {
                historyRef.current.shift()
            } else {
                indexRef.current += 1
            }

            // Keep index at the end after shift
            indexRef.current = historyRef.current.length - 1
            tick()
        },
        [maxHistory, tick],
    )

    const undo = useCallback((): T | null => {
        if (indexRef.current <= 0) return null
        indexRef.current -= 1
        tick()
        return historyRef.current[indexRef.current]
    }, [tick])

    const redo = useCallback((): T | null => {
        if (indexRef.current >= historyRef.current.length - 1) return null
        indexRef.current += 1
        tick()
        return historyRef.current[indexRef.current]
    }, [tick])

    return {
        pushState,
        undo,
        redo,
        canUndo: indexRef.current > 0,
        canRedo: indexRef.current < historyRef.current.length - 1,
    }
}
