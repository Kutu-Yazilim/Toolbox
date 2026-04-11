"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import type {
  BoardElement,
  GroupElement,
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
} from "@/utils/board"
import { downloadKutud, readKutudFile } from "@/utils/kutudFormat"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useFileImport } from "@/hooks/useFileImport"
import { ToolToolbar } from "@/components/shared/ToolToolbar"
import { type Preset } from "@/components/shared/PresetsDrawer"
import { BOARD_PRESETS } from "./presets"
import { useBoardHistory } from "./useBoardHistory"
import { useBoardClipboard } from "./useBoardClipboard"
import { useBoardKeyboard } from "./useBoardKeyboard"

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

  // ── Grouping ────────────────────────────────────────────────────
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  // ── Export ──────────────────────────────────────────────────────
  const [transparentBg, setTransparentBg] = useState(false)

  // ── Text Editing ──────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── History Hook ──────────────────────────────────────────────
  const boardHistory = useBoardHistory(elements)

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
    boardHistory.undo(setElements)
  }, [boardHistory])

  const redo = useCallback(() => {
    boardHistory.redo(setElements)
  }, [boardHistory])

  // ── Element Operations ────────────────────────────────────────

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

  // ── Clipboard Hook ────────────────────────────────────────────
  const {
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
  } = useBoardClipboard({
    elements,
    selectedIds,
    camera,
    defaultStyle,
    setElements,
    setSelectedIds,
    containerRef,
  })

  // ── Grouping Operations ──────────────────────────────────────

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return
    for (const id of selectedIds) {
      if (getGroupNestingDepth(id, elements) >= 2) return
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id)
      if (!el) continue
      const b = el.type === "group" ? computeGroupBounds(el, elements) : getElementBounds(el)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    const groupEl: GroupElement = {
      id: generateElementId(),
      type: "group",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      style: { ...defaultStyle, fillColor: "transparent", strokeColor: "transparent" },
      locked: false,
      visible: true,
      name: null,
      groupId: null,
      isGroup: true,
      childIds: [...selectedIds],
    }

    setElements((prev) => {
      const updated = prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId: groupEl.id } as BoardElement : el
      )
      return [...updated, groupEl]
    })
    setSelectedIds([groupEl.id])
  }, [elements, selectedIds, defaultStyle])

  const ungroupSelected = useCallback(() => {
    const groupIds = selectedIds.filter((id) => {
      const el = elements.find((e) => e.id === id)
      return el?.type === "group"
    })
    if (groupIds.length === 0) return

    const newSelectedIds: string[] = []
    setElements((prev) => {
      let updated = [...prev]
      for (const gid of groupIds) {
        const group = updated.find((e) => e.id === gid)
        if (!group || group.type !== "group") continue
        const childIds = group.childIds
        updated = updated.map((el) =>
          childIds.includes(el.id) ? { ...el, groupId: null } as BoardElement : el
        )
        newSelectedIds.push(...childIds)
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
      const allMoveIds = new Set<string>()
      for (const id of selectedIds) {
        allMoveIds.add(id)
        const el = elements.find((e) => e.id === id)
        if (el?.type === "group") {
          for (const did of getGroupDescendantIds(id, elements)) {
            allMoveIds.add(did)
          }
        }
      }
      setElements((prev) =>
        prev.map((el) => {
          if (!allMoveIds.has(el.id)) return el
          if (el.locked) return el
          if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
            return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } as BoardElement
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
    (updates: Record<string, unknown>) => {
      setElements((prev) =>
        prev.map((el) => {
          if (!selectedIds.includes(el.id)) return el
          if (updates.style) {
            return { ...el, ...updates, style: { ...el.style, ...(updates.style as Partial<ElementStyle>) } } as BoardElement
          }
          return { ...el, ...updates } as BoardElement
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

      const moveElement = (el: BoardElement, dx: number, dy: number): BoardElement => {
        if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
          return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } as BoardElement
        }
        return { ...el, x: el.x + dx, y: el.y + dy }
      }

      setElements((prev) =>
        prev.map((el) => {
          const idx = selected.findIndex((s) => s.id === el.id)
          if (idx === -1) return el
          const b = bounds[idx]

          switch (direction) {
            case "left": {
              const minX = Math.min(...bounds.map((bb) => bb.x))
              return moveElement(el, minX - b.x, 0)
            }
            case "center": {
              const minX = Math.min(...bounds.map((bb) => bb.x))
              const maxX = Math.max(...bounds.map((bb) => bb.x + bb.width))
              return moveElement(el, (minX + maxX) / 2 - (b.x + b.width / 2), 0)
            }
            case "right": {
              const maxX = Math.max(...bounds.map((bb) => bb.x + bb.width))
              return moveElement(el, maxX - (b.x + b.width), 0)
            }
            case "top": {
              const minY = Math.min(...bounds.map((bb) => bb.y))
              return moveElement(el, 0, minY - b.y)
            }
            case "middle": {
              const minY = Math.min(...bounds.map((bb) => bb.y))
              const maxY = Math.max(...bounds.map((bb) => bb.y + bb.height))
              return moveElement(el, 0, (minY + maxY) / 2 - (b.y + b.height / 2))
            }
            case "bottom": {
              const maxY = Math.max(...bounds.map((bb) => bb.y + bb.height))
              return moveElement(el, 0, maxY - (b.y + b.height))
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
            if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
              return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y })) } as BoardElement
            }
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
            if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
              return { ...el, points: el.points.map((p) => ({ x: p.x, y: p.y + dy })) } as BoardElement
            }
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
      if (el.type === "arrow") {
        setEditingId(id)
        setEditText(el.label || "")
        setTimeout(() => textareaRef.current?.focus(), 50)
        return
      }
      setEditingId(id)
      setEditText("text" in el ? el.text : "")
      setTimeout(() => textareaRef.current?.focus(), 50)
    },
    [elements]
  )

  const commitText = useCallback(() => {
    if (editingId) {
      const el = elements.find((e) => e.id === editingId)
      if (el && el.type === "arrow") {
        setElements((prev) =>
          prev.map((el) => (el.id === editingId && el.type === "arrow" ? { ...el, label: editText } : el))
        )
      } else {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== editingId) return el
            if ("text" in el) return { ...el, text: editText }
            return el
          })
        )
      }
      setEditingId(null)
    }
  }, [editingId, editText, elements])

  // ── Keyboard Hook ─────────────────────────────────────────────

  useBoardKeyboard({
    selectedIds,
    editingId,
    editingGroupId,
    setTool,
    setSelectedIds,
    setEditingGroupId,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    selectAll,
    undo,
    redo,
    commitText,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    copyCanvasToClipboard,
  })

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
      boardHistory.skipNextPush()
      setElements(data.elements)
      setCamera(data.camera)
      setGridEnabled(data.gridEnabled)
      setSelectedIds([])
      boardHistory.resetHistory(data.elements)
    } catch (err) {
      console.error("Failed to load .kutud file:", err)
      alert("Failed to load file. Make sure it's a valid .kutud file.")
    }
  }, [boardHistory])

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
    const zoom = Math.min(scaleX, scaleY, 2)

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
      const lightElements = elements.map(el => {
        if (el.type === "image" && el.imageData && el.imageData.length > 10000) {
          return { ...el, imageData: "" }
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
        canUndo={boardHistory.canUndo}
        canRedo={boardHistory.canRedo}
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
