import { useState, useCallback, useEffect, useRef } from "react"
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
  generateElementId,
  getElementBounds,
} from "@/utils/boardEngine"
import { downloadKutud, readKutudFile } from "@/utils/kutudFormat"

const MAX_HISTORY = 80

export function BoardEditor() {
  // ── State ─────────────────────────────────────────────────────
  const [elements, setElements] = useState<BoardElement[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [tool, setTool] = useState<Tool>("select")
  const [gridEnabled, setGridEnabled] = useState(true)
  const [gridSize] = useState(20)
  const [defaultStyle, setDefaultStyle] = useState<ElementStyle>(getThemedDefaultStyle())

  // ── Clipboard (Copy/Paste) ──────────────────────────────────
  const [clipboard, setClipboard] = useState<BoardElement[]>([])

  // ── History (Undo / Redo) ─────────────────────────────────────
  const [history, setHistory] = useState<BoardElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const skipHistoryRef = useRef(false)

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
    setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)))
    setSelectedIds([])
  }, [selectedIds])

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

  // ── Text Editing ──────────────────────────────────────────────

  const startEditText = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id)
      if (!el) return
      setEditingId(id)
      setEditText(el.text)
      setTimeout(() => textareaRef.current?.focus(), 50)
    },
    [elements]
  )

  const commitText = useCallback(() => {
    if (editingId) {
      setElements((prev) =>
        prev.map((el) => (el.id === editingId ? { ...el, text: editText } : el))
      )
      setEditingId(null)
    }
  }, [editingId, editText])

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

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault()
        copySelected()
        return
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault()
        pasteClipboard()
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
        setSelectedIds(elements.map((el) => el.id))
        return
      }

      // Escape
      if (e.key === "Escape") {
        setSelectedIds([])
        setTool("select")
        if (editingId) commitText()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedIds,
    elements,
    editingId,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteClipboard,
    undo,
    redo,
    commitText,
  ])

  // ── File Operations ───────────────────────────────────────────

  const handleExportPng = useCallback(async () => {
    const dataUrl = await exportBoardToPng(elements)
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "board.png"
    a.click()
  }, [elements])

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

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Canvas */}
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
      />

      {/* Toolbar (left) */}
      <BoardToolbar activeTool={tool} onToolChange={setTool} />

      {/* Top bar (center) */}
      <BoardTopBar
        camera={camera}
        gridEnabled={gridEnabled}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onCameraChange={setCamera}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onUndo={undo}
        onRedo={redo}
        onExportPng={handleExportPng}
        onSaveKutud={handleSaveKutud}
        onLoadKutud={handleLoadKutud}
        onFitToScreen={handleFitToScreen}
      />

      {/* Properties panel (right) */}
      <BoardProperties
        selectedElements={selectedElements}
        onUpdateElements={updateSelectedElements}
        onDeleteElements={deleteSelected}
        onDuplicateElements={duplicateSelected}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
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
        Scroll to pan | Ctrl+Scroll to zoom | Space+drag to pan | Double-click to edit text
      </div>
    </div>
  )
}
