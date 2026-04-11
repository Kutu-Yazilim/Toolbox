"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { BoardElement } from "@/types/board"

const MAX_HISTORY = 80

interface BoardHistoryReturn {
  history: BoardElement[][]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  push: (elements: BoardElement[]) => void
  undo: (setElements: (elements: BoardElement[]) => void) => void
  redo: (setElements: (elements: BoardElement[]) => void) => void
  skipNextPush: () => void
  resetHistory: (elements: BoardElement[]) => void
}

export function useBoardHistory(elements: BoardElement[]): BoardHistoryReturn {
  const [history, setHistory] = useState<BoardElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const skipHistoryRef = useRef(false)

  // Push history when elements change
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      return
    }
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1)
      trimmed.push(elements)
      if (trimmed.length > MAX_HISTORY) trimmed.shift()
      return trimmed
    })
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [elements]) // eslint-disable-line react-hooks/exhaustive-deps

  const undo = useCallback(
    (setElements: (elements: BoardElement[]) => void) => {
      if (historyIndex > 0) {
        skipHistoryRef.current = true
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setElements(history[newIndex])
      }
    },
    [history, historyIndex]
  )

  const redo = useCallback(
    (setElements: (elements: BoardElement[]) => void) => {
      if (historyIndex < history.length - 1) {
        skipHistoryRef.current = true
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setElements(history[newIndex])
      }
    },
    [history, historyIndex]
  )

  const push = useCallback((_elements: BoardElement[]) => {
    // History push is handled by the useEffect
  }, [])

  const skipNextPush = useCallback(() => {
    skipHistoryRef.current = true
  }, [])

  const resetHistory = useCallback((elements: BoardElement[]) => {
    skipHistoryRef.current = true
    setHistory([elements])
    setHistoryIndex(0)
  }, [])

  return {
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    push,
    undo,
    redo,
    skipNextPush,
    resetHistory,
  }
}
