"use client"

import { useState, useCallback } from "react"
import type { ShapePath, ClipboardEntry } from "@/types/shapemaker"
import {
  copyToClipboard as clipCopy,
  pasteFromClipboard as clipPaste,
  duplicatePathWithOffset,
} from "@/utils/shapemakerClipboard"

const DUPLICATE_OFFSET = 10

export interface ShapeMakerClipboardAPI {
  clipboard: ClipboardEntry | null
  copy: (paths: ShapePath[]) => void
  paste: () => { paths: ShapePath[] } | null
  duplicate: (paths: ShapePath[]) => ShapePath[]
}

export function useShapeMakerClipboard(): ShapeMakerClipboardAPI {
  const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null)

  const copy = useCallback((paths: ShapePath[]) => {
    if (paths.length === 0) return
    setClipboard(clipCopy(paths))
  }, [])

  const paste = useCallback((): { paths: ShapePath[] } | null => {
    if (!clipboard) return null
    const { paths, updatedClipboard } = clipPaste(clipboard)
    setClipboard(updatedClipboard)
    return { paths }
  }, [clipboard])

  const duplicate = useCallback((paths: ShapePath[]): ShapePath[] => {
    return paths.map((p) => duplicatePathWithOffset(p, DUPLICATE_OFFSET, DUPLICATE_OFFSET))
  }, [])

  return { clipboard, copy, paste, duplicate }
}
