"use client"

import { useState, useCallback, useRef } from "react"
import type { Layer, HistoryEntry } from "@/types/shapemaker"

const MAX_HISTORY = 50

export interface ShapeMakerHistoryAPI {
  push: (layers: Layer[], activeLayerId: string, activePathId: string | null) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  canUndo: boolean
  canRedo: boolean
}

export function useShapeMakerHistory(): ShapeMakerHistoryAPI {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const skipRef = useRef(false)

  const push = useCallback(
    (layers: Layer[], activeLayerId: string, activePathId: string | null) => {
      if (skipRef.current) {
        skipRef.current = false
        return
      }
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIdx + 1)
        newHistory.push({
          layers: JSON.parse(JSON.stringify(layers)),
          activeLayerId,
          activePathId,
        })
        if (newHistory.length > MAX_HISTORY) newHistory.shift()
        return newHistory
      })
      setHistoryIdx((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
    },
    [historyIdx],
  )

  const undo = useCallback((): HistoryEntry | null => {
    if (historyIdx < 0) return null
    const entry = history[historyIdx]
    if (!entry) return null
    skipRef.current = true
    setHistoryIdx((prev) => prev - 1)
    return JSON.parse(JSON.stringify(entry))
  }, [history, historyIdx])

  const redo = useCallback((): HistoryEntry | null => {
    if (historyIdx >= history.length - 1) return null
    const entry = history[historyIdx + 1]
    if (!entry) return null
    skipRef.current = true
    setHistoryIdx((prev) => prev + 1)
    return JSON.parse(JSON.stringify(entry))
  }, [history, historyIdx])

  return {
    push,
    undo,
    redo,
    canUndo: historyIdx >= 0,
    canRedo: historyIdx < history.length - 1,
  }
}
