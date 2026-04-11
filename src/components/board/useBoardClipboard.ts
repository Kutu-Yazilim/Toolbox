"use client"

import { useState, useCallback } from "react"
import type { BoardElement, ImageElement, Camera, ElementStyle } from "@/types/board"
import { generateElementId, getGroupDescendantIds } from "@/utils/board"

const PASTE_OFFSET = 20

interface ClipboardParams {
  elements: BoardElement[]
  selectedIds: string[]
  camera: Camera
  defaultStyle: ElementStyle
  setElements: React.Dispatch<React.SetStateAction<BoardElement[]>>
  setSelectedIds: (ids: string[]) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface ClipboardReturn {
  clipboard: BoardElement[]
  copySelected: () => void
  cutSelected: () => void
  pasteClipboard: () => void
  duplicateSelected: () => void
  deleteSelected: () => void
}

export function useBoardClipboard(params: ClipboardParams): ClipboardReturn {
  const { elements, selectedIds, camera, defaultStyle, setElements, setSelectedIds, containerRef } = params
  const [clipboard, setClipboard] = useState<BoardElement[]>([])

  const deleteSelected = useCallback(() => {
    const allDeleteIds = new Set<string>()
    for (const id of selectedIds) {
      allDeleteIds.add(id)
      const el = elements.find((e) => e.id === id)
      if (el?.type === "group") {
        for (const did of getGroupDescendantIds(id, elements)) {
          allDeleteIds.add(did)
        }
      }
    }
    setElements((prev) => prev.filter((el) => !allDeleteIds.has(el.id)))
    setSelectedIds([])
  }, [elements, selectedIds, setElements, setSelectedIds])

  const duplicateSelected = useCallback(() => {
    const newElements: BoardElement[] = []
    const newIds: string[] = []
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id)
      if (el) {
        let newEl: BoardElement
        if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
          newEl = {
            ...el,
            id: generateElementId(),
            x: el.x + PASTE_OFFSET,
            y: el.y + PASTE_OFFSET,
            points: el.points.map((p) => ({ x: p.x + PASTE_OFFSET, y: p.y + PASTE_OFFSET })),
          } as BoardElement
        } else {
          newEl = {
            ...el,
            id: generateElementId(),
            x: el.x + PASTE_OFFSET,
            y: el.y + PASTE_OFFSET,
          }
        }
        newElements.push(newEl)
        newIds.push(newEl.id)
      }
    }
    setElements((prev) => [...prev, ...newElements])
    setSelectedIds(newIds)
  }, [elements, selectedIds, setElements, setSelectedIds])

  const copySelected = useCallback(() => {
    const toCopy = elements.filter((el) => selectedIds.includes(el.id))
    if (toCopy.length > 0) setClipboard(toCopy)
  }, [elements, selectedIds])

  const pasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return
    const newElements: BoardElement[] = []
    const newIds: string[] = []
    for (const el of clipboard) {
      let newEl: BoardElement
      if (el.type === "arrow") {
        newEl = {
          ...el,
          id: generateElementId(),
          x: el.x + PASTE_OFFSET,
          y: el.y + PASTE_OFFSET,
          points: el.points.map((p) => ({
            x: p.x + PASTE_OFFSET,
            y: p.y + PASTE_OFFSET,
          })) as [typeof el.points[0], typeof el.points[1]],
          startConnection: null,
          endConnection: null,
        }
      } else if (el.type === "line") {
        newEl = {
          ...el,
          id: generateElementId(),
          x: el.x + PASTE_OFFSET,
          y: el.y + PASTE_OFFSET,
          points: el.points.map((p) => ({
            x: p.x + PASTE_OFFSET,
            y: p.y + PASTE_OFFSET,
          })) as [typeof el.points[0], typeof el.points[1]],
        }
      } else if (el.type === "draw") {
        newEl = {
          ...el,
          id: generateElementId(),
          x: el.x + PASTE_OFFSET,
          y: el.y + PASTE_OFFSET,
          points: el.points.map((p) => ({
            x: p.x + PASTE_OFFSET,
            y: p.y + PASTE_OFFSET,
          })),
        }
      } else {
        newEl = {
          ...el,
          id: generateElementId(),
          x: el.x + PASTE_OFFSET,
          y: el.y + PASTE_OFFSET,
        }
      }
      newElements.push(newEl)
      newIds.push(newEl.id)
    }
    setElements((prev) => [...prev, ...newElements])
    setSelectedIds(newIds)
    // Update clipboard positions so subsequent pastes cascade
    setClipboard(newElements)
  }, [clipboard, setElements, setSelectedIds])

  const cutSelected = useCallback(() => {
    copySelected()
    deleteSelected()
  }, [copySelected, deleteSelected])

  // Handle image paste from system clipboard (called from keyboard hook)
  const handleImagePaste = useCallback(() => {
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard
        .read()
        .then((items) => {
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"))
            if (imageType) {
              item.getType(imageType).then((blob) => {
                const reader = new FileReader()
                reader.onload = () => {
                  const dataUrl = reader.result as string
                  const img = new Image()
                  img.onload = () => {
                    let w = img.naturalWidth
                    let h = img.naturalHeight
                    const maxDim = 800
                    if (w > maxDim || h > maxDim) {
                      const scale = maxDim / Math.max(w, h)
                      w = Math.round(w * scale)
                      h = Math.round(h * scale)
                    }
                    const container = containerRef.current
                    const rect = container?.getBoundingClientRect()
                    const cx = rect ? (rect.width / 2 - camera.x) / camera.zoom : 0
                    const cy = rect ? (rect.height / 2 - camera.y) / camera.zoom : 0

                    const newEl: ImageElement = {
                      id: generateElementId(),
                      type: "image",
                      x: cx - w / 2,
                      y: cy - h / 2,
                      width: w,
                      height: h,
                      rotation: 0,
                      style: { ...defaultStyle, fillColor: "transparent", strokeColor: "transparent" },
                      locked: false,
                      visible: true,
                      name: null,
                      groupId: null,
                      imageData: dataUrl,
                    }
                    setElements((prev) => [...prev, newEl])
                    setSelectedIds([newEl.id])
                  }
                  img.src = dataUrl
                }
                reader.readAsDataURL(blob)
              })
              return
            }
          }
          // No image found, paste board elements
          pasteClipboard()
        })
        .catch(() => {
          pasteClipboard()
        })
    } else {
      pasteClipboard()
    }
  }, [camera, defaultStyle, containerRef, setElements, setSelectedIds, pasteClipboard])

  // Expose handleImagePaste as pasteClipboard replacement for keyboard hook
  return {
    clipboard,
    copySelected,
    cutSelected,
    pasteClipboard: handleImagePaste,
    duplicateSelected,
    deleteSelected,
  }
}
