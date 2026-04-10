"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import type {
  BoardElement,
  Camera,
  Tool,
  ElementStyle,
} from "@/types/board"
import { getThemedDefaultStyle } from "@/types/board"
import { BoardCanvas } from "./BoardCanvas"
import { BoardToolbar } from "./BoardToolbar"
import { BoardTopBar } from "./BoardTopBar"
import { BoardProperties } from "./BoardProperties"
import {
  exportBoardToPng,
  exportBoardToSvg,
  generateElementId,
  getElementBounds,
  copyBoardToPngClipboard,
  computeGroupBounds,
  getGroupNestingDepth,
  getGroupDescendantIds,
} from "@/utils/boardEngine"
import { downloadKutud, readKutudFile } from "@/utils/kutudFormat"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useFileImport } from "@/hooks/useFileImport"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { BOARD_PRESETS } from "./presets"

const MAX_HISTORY = 80

export function BoardEditor() {
  // ── State ─────────────────────────────────────────────────────
  const [savedElements, setSavedElements] = useLocalStorage<BoardElement[]>("board-editor-elements", [])
  const [elements, setElements] = useState<BoardElement[]>(savedElements)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [tool, setTool] = useState<Tool>("select")
  const [gridEnabled, setGridEnabled] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [defaultStyle, setDefaultStyle] = useState<ElementStyle>(getThemedDefaultStyle())

  // ── Clipboard (Copy/Paste) ──────────────────────────────────
  const [clipboard, setClipboard] = useState<BoardElement[]>([])

  // ── History (Undo / Redo) ─────────────────────────────────────
  const [history, setHistory] = useState<BoardElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const skipHistoryRef = useRef(false)

  // ── Grouping ────────────────────────────────────────────────────
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  // ── Export ──────────────────────────────────────────────────────
  const [transparentBg, setTransparentBg] = useState(false)

  // ── Text Editing ──────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Push history when elements change ─────────────────────────
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
  }, [elements])

  // ── Update default style when theme changes ─────────────────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDefaultStyle(getThemedDefaultStyle())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      skipHistoryRef.current = true
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      skipHistoryRef.current = true
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  // ── Element Operations ────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    // Collect all IDs to delete including group descendants
    const allDeleteIds = new Set<string>()
    for (const id of selectedIds) {
      allDeleteIds.add(id)
      const el = elements.find((e) => e.id === id)
      if (el?.isGroup) {
        for (const did of getGroupDescendantIds(id, elements)) {
          allDeleteIds.add(did)
        }
      }
    }
    setElements((prev) => prev.filter((el) => !allDeleteIds.has(el.id)))
    setSelectedIds([])
  }, [elements, selectedIds])

  const duplicateSelected = useCallback(() => {
    const newElements: BoardElement[] = []
    const newIds: string[] = []
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id)
      if (el) {
        const newEl = {
          ...el,
          id: generateElementId(),
          x: el.x + 20,
          y: el.y + 20,
          points: el.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
        }
        newElements.push(newEl)
        newIds.push(newEl.id)
      }
    }
    setElements((prev) => [...prev, ...newElements])
    setSelectedIds(newIds)
  }, [elements, selectedIds])

  const copySelected = useCallback(() => {
    const toCopy = elements.filter((el) => selectedIds.includes(el.id))
    if (toCopy.length > 0) setClipboard(toCopy)
  }, [elements, selectedIds])

  const pasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return
    const newElements: BoardElement[] = []
    const newIds: string[] = []
    for (const el of clipboard) {
      const newEl = {
        ...el,
        id: generateElementId(),
        x: el.x + 20,
        y: el.y + 20,
        points: el.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
        startConnection: undefined,
        endConnection: undefined,
      }
      newElements.push(newEl)
      newIds.push(newEl.id)
    }
    setElements((prev) => [...prev, ...newElements])
    setSelectedIds(newIds)
    // Update clipboard positions so subsequent pastes cascade
    setClipboard(newElements)
  }, [clipboard])

  const cutSelected = useCallback(() => {
    copySelected()
    deleteSelected()
  }, [copySelected, deleteSelected])

  const bringToFront = useCallback(() => {
    setElements((prev) => {
      const selected = prev.filter((el) => selectedIds.includes(el.id))
      const rest = prev.filter((el) => !selectedIds.includes(el.id))
      return [...rest, ...selected]
    })
  }, [selectedIds])

  const sendToBack = useCallback(() => {
    setElements((prev) => {
      const selected = prev.filter((el) => selectedIds.includes(el.id))
      const rest = prev.filter((el) => !selectedIds.includes(el.id))
      return [...selected, ...rest]
    })
  }, [selectedIds])

  const bringForward = useCallback(() => {
    setElements((prev) => {
      const newArr = [...prev]
      // Move each selected element one step forward (higher index)
      for (let i = newArr.length - 2; i >= 0; i--) {
        if (selectedIds.includes(newArr[i].id) && !selectedIds.includes(newArr[i + 1].id)) {
          const temp = newArr[i]
          newArr[i] = newArr[i + 1]
          newArr[i + 1] = temp
        }
      }
      return newArr
    })
  }, [selectedIds])

  const sendBackward = useCallback(() => {
    setElements((prev) => {
      const newArr = [...prev]
      // Move each selected element one step backward (lower index)
      for (let i = 1; i < newArr.length; i++) {
        if (selectedIds.includes(newArr[i].id) && !selectedIds.includes(newArr[i - 1].id)) {
          const temp = newArr[i]
          newArr[i] = newArr[i - 1]
          newArr[i - 1] = temp
        }
      }
      return newArr
    })
  }, [selectedIds])

  const selectAll = useCallback(() => {
    setSelectedIds(elements.map((el) => el.id))
  }, [elements])

  const toggleLock = useCallback(() => {
    if (selectedIds.length === 0) return
    const firstEl = elements.find((e) => e.id === selectedIds[0])
    if (!firstEl) return
    const newLocked = !firstEl.locked
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, locked: newLocked } : el
      )
    )
  }, [elements, selectedIds])

  // ── Grouping Operations ──────────────────────────────────────

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return
    // Check max nesting depth
    for (const id of selectedIds) {
      if (getGroupNestingDepth(id, elements) >= 2) return // max 3 levels (0,1,2 → depth 2 means the child is already 2 levels deep)
    }

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id)
      if (!el) continue
      const b = el.isGroup ? computeGroupBounds(el, elements) : getElementBounds(el)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    const groupEl: BoardElement = {
      id: generateElementId(),
      type: "group",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      points: [],
      text: "",
      style: { ...defaultStyle, fillColor: "transparent", strokeColor: "transparent" },
      locked: false,
      isGroup: true,
      childIds: [...selectedIds],
    }

    setElements((prev) => {
      const updated = prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId: groupEl.id } : el
      )
      return [...updated, groupEl]
    })
    setSelectedIds([groupEl.id])
  }, [elements, selectedIds, defaultStyle])

  const ungroupSelected = useCallback(() => {
    const groupIds = selectedIds.filter((id) => {
      const el = elements.find((e) => e.id === id)
      return el?.isGroup
    })
    if (groupIds.length === 0) return

    const newSelectedIds: string[] = []
    setElements((prev) => {
      let updated = [...prev]
      for (const gid of groupIds) {
        const group = updated.find((e) => e.id === gid)
        if (!group?.childIds) continue
        // Remove groupId from children
        updated = updated.map((el) =>
          group.childIds!.includes(el.id) ? { ...el, groupId: undefined } : el
        )
        newSelectedIds.push(...group.childIds)
        // Remove the group element
        updated = updated.filter((el) => el.id !== gid)
      }
      return updated
    })
    setSelectedIds(newSelectedIds)
    setEditingGroupId(null)
  }, [elements, selectedIds])

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0) return
      // Collect all IDs to move (including group descendants)
      const allMoveIds = new Set<string>()
      for (const id of selectedIds) {
        allMoveIds.add(id)
        const el = elements.find((e) => e.id === id)
        if (el?.isGroup) {
          for (const did of getGroupDescendantIds(id, elements)) {
            allMoveIds.add(did)
          }
        }
      }
      setElements((prev) =>
        prev.map((el) => {
          if (!allMoveIds.has(el.id)) return el
          if (el.locked) return el
          if (el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")) {
            return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
          }
          return { ...el, x: el.x + dx, y: el.y + dy }
        })
      )
    },
    [elements, selectedIds]
  )

  const copyCanvasToClipboard = useCallback(async () => {
    try {
      await copyBoardToPngClipboard(elements, transparentBg)
    } catch {
      // Fallback: ignore silently
    }
  }, [elements, transparentBg])

  const updateSelectedElements = useCallback(
    (updates: Partial<BoardElement>) => {
      setElements((prev) =>
        prev.map((el) => {
          if (!selectedIds.includes(el.id)) return el
          if (updates.style) {
            return { ...el, ...updates, style: { ...el.style, ...updates.style } }
          }
          return { ...el, ...updates }
        })
      )
    },
    [selectedIds]
  )

  // ── Alignment & Distribution ───────────────────────────────────

  const alignElements = useCallback(
    (direction: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedIds.length < 2) return
      const selected = elements.filter((el) => selectedIds.includes(el.id))
      const bounds = selected.map((el) => getElementBounds(el))

      setElements((prev) =>
        prev.map((el) => {
          const idx = selected.findIndex((s) => s.id === el.id)
          if (idx === -1) return el
          const b = bounds[idx]
          const isPointBased = el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")

          switch (direction) {
            case "left": {
              const minX = Math.min(...bounds.map((bb) => bb.x))
              const dx = minX - b.x
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y })) }
              return { ...el, x: el.x + dx }
            }
            case "center": {
              const minX = Math.min(...bounds.map((bb) => bb.x))
              const maxX = Math.max(...bounds.map((bb) => bb.x + bb.width))
              const centerX = (minX + maxX) / 2
              const dx = centerX - (b.x + b.width / 2)
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y })) }
              return { ...el, x: el.x + dx }
            }
            case "right": {
              const maxX = Math.max(...bounds.map((bb) => bb.x + bb.width))
              const dx = maxX - (b.x + b.width)
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y })) }
              return { ...el, x: el.x + dx }
            }
            case "top": {
              const minY = Math.min(...bounds.map((bb) => bb.y))
              const dy = minY - b.y
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x, y: p.y + dy })) }
              return { ...el, y: el.y + dy }
            }
            case "middle": {
              const minY = Math.min(...bounds.map((bb) => bb.y))
              const maxY = Math.max(...bounds.map((bb) => bb.y + bb.height))
              const centerY = (minY + maxY) / 2
              const dy = centerY - (b.y + b.height / 2)
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x, y: p.y + dy })) }
              return { ...el, y: el.y + dy }
            }
            case "bottom": {
              const maxY = Math.max(...bounds.map((bb) => bb.y + bb.height))
              const dy = maxY - (b.y + b.height)
              if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x, y: p.y + dy })) }
              return { ...el, y: el.y + dy }
            }
          }
        })
      )
    },
    [elements, selectedIds]
  )

  const distributeElements = useCallback(
    (axis: "horizontal" | "vertical") => {
      if (selectedIds.length < 3) return
      const selected = elements.filter((el) => selectedIds.includes(el.id))
      const boundsMap = new Map(selected.map((el) => [el.id, getElementBounds(el)]))

      const sorted = [...selected].sort((a, b) => {
        const ba = boundsMap.get(a.id)!
        const bb = boundsMap.get(b.id)!
        return axis === "horizontal" ? ba.x - bb.x : ba.y - bb.y
      })

      const first = boundsMap.get(sorted[0].id)!
      const last = boundsMap.get(sorted[sorted.length - 1].id)!

      if (axis === "horizontal") {
        const totalWidth = sorted.reduce((sum, el) => sum + boundsMap.get(el.id)!.width, 0)
        const totalSpace = (last.x + last.width) - first.x - totalWidth
        const gap = totalSpace / (sorted.length - 1)
        let currentX = first.x

        const positions = new Map<string, number>()
        for (const el of sorted) {
          const b = boundsMap.get(el.id)!
          positions.set(el.id, currentX - b.x)
          currentX += b.width + gap
        }

        setElements((prev) =>
          prev.map((el) => {
            const dx = positions.get(el.id)
            if (dx === undefined) return el
            const isPointBased = el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")
            if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y })) }
            return { ...el, x: el.x + dx }
          })
        )
      } else {
        const totalHeight = sorted.reduce((sum, el) => sum + boundsMap.get(el.id)!.height, 0)
        const totalSpace = (last.y + last.height) - first.y - totalHeight
        const gap = totalSpace / (sorted.length - 1)
        let currentY = first.y

        const positions = new Map<string, number>()
        for (const el of sorted) {
          const b = boundsMap.get(el.id)!
          positions.set(el.id, currentY - b.y)
          currentY += b.height + gap
        }

        setElements((prev) =>
          prev.map((el) => {
            const dy = positions.get(el.id)
            if (dy === undefined) return el
            const isPointBased = el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")
            if (isPointBased) return { ...el, points: el.points.map((p) => ({ x: p.x, y: p.y + dy })) }
            return { ...el, y: el.y + dy }
          })
        )
      }
    },
    [elements, selectedIds]
  )

  // ── Text Editing ──────────────────────────────────────────────

  const startEditText = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id)
      if (!el) return
      // For arrows, edit the label field
      if (el.type === "arrow") {
        setEditingId(id)
        setEditText(el.label || "")
        setTimeout(() => textareaRef.current?.focus(), 50)
        return
      }
      setEditingId(id)
      setEditText(el.text)
      setTimeout(() => textareaRef.current?.focus(), 50)
    },
    [elements]
  )

  const commitText = useCallback(() => {
    if (editingId) {
      const el = elements.find((e) => e.id === editingId)
      if (el && el.type === "arrow") {
        // Commit arrow label
        setElements((prev) =>
          prev.map((el) => (el.id === editingId ? { ...el, label: editText } : el))
        )
      } else {
        setElements((prev) =>
          prev.map((el) => (el.id === editingId ? { ...el, text: editText } : el))
        )
      }
      setEditingId(null)
    }
  }, [editingId, editText, elements])

  // ── Keyboard Shortcuts ────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      // Tool shortcuts
      const toolMap: Record<string, Tool> = {
        v: "select",
        h: "hand",
        r: "rectangle",
        o: "ellipse",
        d: "diamond",
        l: "line",
        a: "arrow",
        p: "draw",
        t: "text",
        s: "sticky",
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const newTool = toolMap[e.key.toLowerCase()]
        if (newTool) {
          setTool(newTool)
          return
        }
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault()
          deleteSelected()
        }
        return
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault()
        redo()
        return
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault()
        cutSelected()
        return
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault()
        copySelected()
        return
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault()
        // Check clipboard for image data first
        if (navigator.clipboard && navigator.clipboard.read) {
          navigator.clipboard.read().then((items) => {
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
                      // Place at canvas center
                      const container = containerRef.current
                      const rect = container?.getBoundingClientRect()
                      const cx = rect ? (rect.width / 2 - camera.x) / camera.zoom : 0
                      const cy = rect ? (rect.height / 2 - camera.y) / camera.zoom : 0

                      const newEl: BoardElement = {
                        id: generateElementId(),
                        type: "image",
                        x: cx - w / 2,
                        y: cy - h / 2,
                        width: w,
                        height: h,
                        rotation: 0,
                        points: [],
                        text: "",
                        style: { ...defaultStyle, fillColor: "transparent", strokeColor: "transparent" },
                        locked: false,
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
          }).catch(() => {
            pasteClipboard()
          })
        } else {
          pasteClipboard()
        }
        return
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        duplicateSelected()
        return
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        selectAll()
        return
      }

      // Copy canvas as PNG to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault()
        copyCanvasToClipboard()
        return
      }

      // Group (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "g") {
        e.preventDefault()
        groupSelected()
        return
      }

      // Ungroup (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "G") {
        e.preventDefault()
        ungroupSelected()
        return
      }

      // Arrow keys: nudge
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (selectedIds.length > 0) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
          nudgeSelected(dx, dy)
        }
        return
      }

      // Z-order: ] bring forward, [ send backward
      if (e.key === "]") {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          bringToFront()
        } else {
          bringForward()
        }
        return
      }
      if (e.key === "[") {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          sendToBack()
        } else {
          sendBackward()
        }
        return
      }

      // Escape
      if (e.key === "Escape") {
        if (editingGroupId) {
          setEditingGroupId(null)
        } else {
          setSelectedIds([])
          setTool("select")
        }
        if (editingId) commitText()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedIds,
    elements,
    editingId,
    editingGroupId,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    selectAll,
    undo,
    redo,
    commitText,
    camera,
    defaultStyle,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    copyCanvasToClipboard,
  ])

  // ── File Operations ───────────────────────────────────────────

  const handleExportPng = useCallback(async () => {
    const dataUrl = await exportBoardToPng(elements, 40, transparentBg)
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "board.png"
    a.click()
  }, [elements, transparentBg])

  const handleExportSvg = useCallback(() => {
    const svgString = exportBoardToSvg(elements, 20, transparentBg)
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "board.svg"
    a.click()
    URL.revokeObjectURL(url)
  }, [elements, transparentBg])

  const handleSaveKutud = useCallback(() => {
    downloadKutud({
      elements,
      camera,
      gridEnabled,
      gridSize,
    })
  }, [elements, camera, gridEnabled, gridSize])

  const handleLoadKutud = useCallback(async (file: File) => {
    try {
      const data = await readKutudFile(file)
      skipHistoryRef.current = true
      setElements(data.elements)
      setCamera(data.camera)
      setGridEnabled(data.gridEnabled)
      setSelectedIds([])
      setHistory([data.elements])
      setHistoryIndex(0)
    } catch (err) {
      console.error("Failed to load .kutud file:", err)
      alert("Failed to load file. Make sure it's a valid .kutud file.")
    }
  }, [])

  const handleFitToScreen = useCallback(() => {
    if (elements.length === 0) {
      setCamera({ x: 0, y: 0, zoom: 1 })
      return
    }

    const container = containerRef.current
    if (!container) return

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of elements) {
      const b = getElementBounds(el)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const rect = container.getBoundingClientRect()
    const padding = 80

    const scaleX = (rect.width - padding * 2) / contentWidth
    const scaleY = (rect.height - padding * 2) / contentHeight
    const zoom = Math.min(scaleX, scaleY, 2) // Cap at 2x

    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    setCamera({
      x: rect.width / 2 - cx * zoom,
      y: rect.height / 2 - cy * zoom,
      zoom,
    })
  }, [elements])

  // ── Text Overlay Position ─────────────────────────────────────

  const getTextOverlayStyle = useCallback((): React.CSSProperties | null => {
    if (!editingId) return null
    const el = elements.find((e) => e.id === editingId)
    if (!el) return null

    // For arrow labels, position at arrow midpoint
    if (el.type === "arrow" && el.points.length >= 2) {
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      let labelX = (start.x + end.x) / 2
      let labelY = (start.y + end.y) / 2
      if (el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)) {
        const cpx = (start.x + end.x) / 2 + el.controlPointOffset.x
        const cpy = (start.y + end.y) / 2 + el.controlPointOffset.y
        labelX = 0.25 * start.x + 0.5 * cpx + 0.25 * end.x
        labelY = 0.25 * start.y + 0.5 * cpy + 0.25 * end.y
      }
      const screenX = labelX * camera.zoom + camera.x
      const screenY = labelY * camera.zoom + camera.y
      const w = 150 * camera.zoom

      return {
        position: "absolute" as const,
        left: screenX - w / 2,
        top: screenY - 15 * camera.zoom,
        width: w,
        height: 30 * camera.zoom,
        fontSize: el.style.fontSize * camera.zoom,
        fontFamily: el.style.fontFamily,
        textAlign: "center" as const,
        color: el.style.strokeColor,
        background: "transparent",
        border: "none",
        outline: "2px solid #3B82F6",
        borderRadius: 4,
        padding: 4,
        resize: "none" as const,
        overflow: "hidden",
        zIndex: 30,
        lineHeight: "1.4",
      }
    }

    const bounds = getElementBounds(el)
    const screenX = bounds.x * camera.zoom + camera.x
    const screenY = bounds.y * camera.zoom + camera.y
    const screenW = bounds.width * camera.zoom
    const screenH = bounds.height * camera.zoom

    const padding = el.type === "sticky" ? 12 * camera.zoom : 4 * camera.zoom

    return {
      position: "absolute" as const,
      left: screenX + padding,
      top: screenY + padding,
      width: Math.max(60, screenW - padding * 2),
      height: Math.max(30, screenH - padding * 2),
      fontSize: el.style.fontSize * camera.zoom,
      fontFamily: el.style.fontFamily,
      textAlign: el.style.textAlign,
      color: el.type === "sticky" ? "#1e1e1e" : el.style.strokeColor,
      background: "transparent",
      border: "none",
      outline: "2px solid #3B82F6",
      borderRadius: 4,
      padding: 4,
      resize: "none" as const,
      overflow: "hidden",
      zIndex: 30,
      lineHeight: "1.4",
    }
  }, [editingId, elements, camera])

  // ── Selected elements for properties panel ────────────────────

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id))

  // ── Persist to localStorage ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't persist image data to avoid localStorage size limits
      const lightElements = elements.map(el => {
        if (el.imageData && el.imageData.length > 10000) {
          return { ...el, imageData: undefined }
        }
        return el
      })
      setSavedElements(lightElements)
    }, 1000)
    return () => clearTimeout(timer)
  }, [elements, setSavedElements])

  // ── File import (.kutud) ──────────────────────────────────────
  const { dropzoneProps: boardDropzone, isDragging: isBoardDragging } = useFileImport({
    accept: [".kutud", ".json"],
    onImport: useCallback((content: string, filename: string) => {
      try {
        if (filename.endsWith(".kutud") || filename.endsWith(".json")) {
          const data = JSON.parse(content)
          if (data.elements) {
            setElements(data.elements)
            if (data.camera) setCamera(data.camera)
            if (data.gridEnabled !== undefined) setGridEnabled(data.gridEnabled)
            setSelectedIds([])
          }
        }
      } catch {
        // Invalid file
      }
    }, []),
  })

  // ── Presets ────────────────────────────────────────────────────
  const handleBoardPresetSelect = useCallback((_preset: Preset) => {
    // Presets for board are template starters — for now just clear the board
    // A full implementation would generate template elements
    setElements([])
    setSelectedIds([])
  }, [])

  // ── Export options ─────────────────────────────────────────────
  const boardExportOptions = useMemo(() => [
    { label: "Export PNG", action: handleExportPng },
    { label: "Export SVG", action: handleExportSvg },
    { label: "Save .kutud", action: handleSaveKutud },
    { label: "Copy as PNG", action: copyCanvasToClipboard },
  ], [handleExportPng, handleExportSvg, handleSaveKutud, copyCanvasToClipboard])

  // ── Board toolbar shortcuts ───────────────────────────────────
  const boardToolbarShortcuts = useMemo(() => [
    { key: "mod+shift+e", label: "Export PNG", action: handleExportPng },
    { key: "mod+shift+s", label: "Save .kutud", action: handleSaveKutud },
  ], [handleExportPng, handleSaveKutud])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden flex flex-col" {...boardDropzone}>
      {isBoardDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <span className="text-sm font-medium text-primary">Drop .kutud or .json file here</span>
        </div>
      )}
      <ToolToolbar
        title="Board Editor"
        exportOptions={boardExportOptions}
        presets={BOARD_PRESETS}
        onPresetSelect={handleBoardPresetSelect}
        shortcuts={boardToolbarShortcuts}
        status={elements.length > 0 ? { type: "info", label: `${elements.length} elements` } : null}
      />
      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
      <BoardCanvas
        elements={elements}
        selectedIds={selectedIds}
        camera={camera}
        tool={tool}
        gridEnabled={gridEnabled}
        gridSize={gridSize}
        defaultStyle={defaultStyle}
        onElementsChange={setElements}
        onSelectionChange={setSelectedIds}
        onCameraChange={setCamera}
        onToolChange={setTool}
        onEditText={startEditText}
        onCommitText={commitText}
        onCut={cutSelected}
        onCopy={copySelected}
        onPaste={pasteClipboard}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onBringToFront={bringToFront}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onSendToBack={sendToBack}
        onSelectAll={selectAll}
        onToggleLock={toggleLock}
        editingGroupId={editingGroupId}
        onEditingGroupChange={setEditingGroupId}
      />

      {/* Toolbar (left) */}
      <BoardToolbar activeTool={tool} onToolChange={setTool} />

      {/* Top bar (center) */}
      <BoardTopBar
        camera={camera}
        gridEnabled={gridEnabled}
        gridSize={gridSize}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        transparentBg={transparentBg}
        onCameraChange={setCamera}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onGridSizeChange={setGridSize}
        onUndo={undo}
        onRedo={redo}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onSaveKutud={handleSaveKutud}
        onLoadKutud={handleLoadKutud}
        onFitToScreen={handleFitToScreen}
        onToggleTransparentBg={() => setTransparentBg(!transparentBg)}
      />

      {/* Properties panel (right) */}
      <BoardProperties
        selectedElements={selectedElements}
        onUpdateElements={updateSelectedElements}
        onDeleteElements={deleteSelected}
        onDuplicateElements={duplicateSelected}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onAlignElements={alignElements}
        onDistributeElements={distributeElements}
        onGroupSelected={groupSelected}
        onUngroupSelected={ungroupSelected}
      />

      {/* Text editing overlay */}
      {editingId && (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              commitText()
            }
            // Allow Enter for multiline, Shift+Enter or just Enter
            e.stopPropagation()
          }}
          style={getTextOverlayStyle() || undefined}
          className="whitespace-pre-wrap"
          autoFocus
        />
      )}

      {/* Bottom-right hints */}
      <div className="hidden md:block absolute bottom-3 right-3 z-10 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
        Scroll to pan | Ctrl+Scroll to zoom | Space+drag to pan | Double-click to edit text | Ctrl+G group | Arrows to nudge
      </div>
      </div>
    </div>
  )
}
