import { useRef, useEffect, useCallback, useState } from "react"
import type {
  BoardElement,
  Camera,
  Tool,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
} from "@/types/board"
import {
  renderBoard,
  screenToWorld,
  pointInElement,
  elementsInSelectionBox,
  getResizeHandleAtPoint,
  resizeElement,
  createElement,
  getElementBounds,
  snapToGrid,
} from "@/utils/boardEngine"

interface BoardCanvasProps {
  elements: BoardElement[]
  selectedIds: string[]
  camera: Camera
  tool: Tool
  gridEnabled: boolean
  gridSize: number
  defaultStyle: ElementStyle
  onElementsChange: (elements: BoardElement[]) => void
  onSelectionChange: (ids: string[]) => void
  onCameraChange: (camera: Camera) => void
  onToolChange: (tool: Tool) => void
  onEditText: (id: string) => void
}

type InteractionState =
  | { type: "idle" }
  | { type: "panning"; startX: number; startY: number; startCamX: number; startCamY: number }
  | { type: "drawing"; element: BoardElement }
  | { type: "selecting"; startWorld: Point }
  | { type: "moving"; startWorld: Point; elementSnapshots: Map<string, { x: number; y: number; points: Point[] }> }
  | { type: "resizing"; handle: ResizeHandle; elementId: string; startWorld: Point; snapshot: BoardElement }

export function BoardCanvas({
  elements,
  selectedIds,
  camera,
  tool,
  gridEnabled,
  gridSize,
  defaultStyle,
  onElementsChange,
  onSelectionChange,
  onCameraChange,
  onToolChange,
  onEditText,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [interaction, setInteraction] = useState<InteractionState>({ type: "idle" })
  const [previewElement, setPreviewElement] = useState<BoardElement | null>(null)
  const [selectionBox, setSelectionBox] = useState<Bounds | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const spaceHeldRef = useRef(false)
  const interactionRef = useRef(interaction)
  interactionRef.current = interaction

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    ctx.scale(dpr, dpr)

    renderBoard(
      ctx,
      elements,
      camera,
      selectedIds,
      canvasSize.width,
      canvasSize.height,
      gridEnabled,
      gridSize,
      selectionBox,
      previewElement
    )
  }, [elements, camera, selectedIds, canvasSize, gridEnabled, gridSize, selectionBox, previewElement])

  // ── Mouse Handlers ──────────────────────────────────────────

  const getWorldPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      return screenToWorld(screenX, screenY, camera)
    },
    [camera]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      // Middle mouse button or space held → pan
      if (e.button === 1 || spaceHeldRef.current || tool === "hand") {
        setInteraction({
          type: "panning",
          startX: screenX,
          startY: screenY,
          startCamX: camera.x,
          startCamY: camera.y,
        })
        return
      }

      if (e.button !== 0) return

      // ── Select tool ─────────────────────────────────────────
      if (tool === "select") {
        // Check resize handles on selected elements first
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && !el.locked) {
            const handle = getResizeHandleAtPoint(world.x, world.y, el, camera)
            if (handle) {
              setInteraction({
                type: "resizing",
                handle,
                elementId: id,
                startWorld: world,
                snapshot: { ...el },
              })
              return
            }
          }
        }

        // Check if clicking on an element
        // Iterate from top (last) to bottom (first) for z-order
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i]
          if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
            if (e.shiftKey) {
              // Toggle selection
              const newIds = selectedIds.includes(el.id)
                ? selectedIds.filter((id) => id !== el.id)
                : [...selectedIds, el.id]
              onSelectionChange(newIds)
            } else if (!selectedIds.includes(el.id)) {
              onSelectionChange([el.id])
            }
            // Start moving
            const ids = selectedIds.includes(el.id) ? selectedIds : [el.id]
            if (!selectedIds.includes(el.id)) {
              onSelectionChange([el.id])
            }
            const snapshots = new Map<string, { x: number; y: number; points: Point[] }>()
            for (const id of ids) {
              const elem = elements.find((e) => e.id === id)
              if (elem && !elem.locked) {
                snapshots.set(id, { x: elem.x, y: elem.y, points: [...elem.points] })
              }
            }
            setInteraction({ type: "moving", startWorld: world, elementSnapshots: snapshots })
            return
          }
        }

        // Clicked on empty space → start selection box
        if (!e.shiftKey) {
          onSelectionChange([])
        }
        setInteraction({ type: "selecting", startWorld: world })
        return
      }

      // ── Text tool ───────────────────────────────────────────
      if (tool === "text") {
        const newEl = createElement("text", world.x, world.y, defaultStyle)
        newEl.text = ""
        onElementsChange([...elements, newEl])
        onSelectionChange([newEl.id])
        onToolChange("select")
        // Trigger text editing
        setTimeout(() => onEditText(newEl.id), 50)
        return
      }

      // ── Sticky tool ─────────────────────────────────────────
      if (tool === "sticky") {
        const snappedX = gridEnabled ? snapToGrid(world.x, gridSize) : world.x
        const snappedY = gridEnabled ? snapToGrid(world.y, gridSize) : world.y
        const newEl = createElement("sticky", snappedX - 100, snappedY - 100, defaultStyle)
        onElementsChange([...elements, newEl])
        onSelectionChange([newEl.id])
        onToolChange("select")
        setTimeout(() => onEditText(newEl.id), 50)
        return
      }

      // ── Shape / Line / Draw tools ───────────────────────────
      const drawingElement = createElement(
        tool as BoardElement["type"],
        world.x,
        world.y,
        defaultStyle
      )
      if (tool === "line" || tool === "arrow") {
        drawingElement.points = [{ x: world.x, y: world.y }, { x: world.x, y: world.y }]
      } else if (tool === "draw") {
        drawingElement.points = [{ x: world.x, y: world.y }]
      }
      setInteraction({ type: "drawing", element: drawingElement })
      setPreviewElement(drawingElement)
    },
    [tool, camera, elements, selectedIds, gridEnabled, gridSize, defaultStyle, getWorldPoint, onElementsChange, onSelectionChange, onToolChange, onEditText]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const current = interactionRef.current

      switch (current.type) {
        case "panning": {
          const dx = screenX - current.startX
          const dy = screenY - current.startY
          onCameraChange({
            ...camera,
            x: current.startCamX + dx,
            y: current.startCamY + dy,
          })
          break
        }
        case "drawing": {
          const el = current.element
          if (el.type === "line" || el.type === "arrow") {
            const points = [...el.points]
            points[points.length - 1] = { x: world.x, y: world.y }
            const updated = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else if (el.type === "draw") {
            const points = [...el.points, { x: world.x, y: world.y }]
            const updated = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else {
            // Shape tools - compute width/height from drag
            let w = world.x - el.x
            let h = world.y - el.y

            if (e.shiftKey) {
              // Constrain to square
              const size = Math.max(Math.abs(w), Math.abs(h))
              w = size * Math.sign(w)
              h = size * Math.sign(h)
            }

            if (gridEnabled) {
              w = snapToGrid(w, gridSize)
              h = snapToGrid(h, gridSize)
            }

            const updated = { ...el, width: w, height: h }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          }
          break
        }
        case "selecting": {
          const sx = Math.min(current.startWorld.x, world.x)
          const sy = Math.min(current.startWorld.y, world.y)
          const sw = Math.abs(world.x - current.startWorld.x)
          const sh = Math.abs(world.y - current.startWorld.y)
          setSelectionBox({ x: sx, y: sy, width: sw, height: sh })
          break
        }
        case "moving": {
          let dx = world.x - current.startWorld.x
          let dy = world.y - current.startWorld.y
          if (gridEnabled) {
            dx = snapToGrid(dx, gridSize)
            dy = snapToGrid(dy, gridSize)
          }
          const newElements = elements.map((el) => {
            const snap = current.elementSnapshots.get(el.id)
            if (!snap) return el
            if (el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")) {
              return {
                ...el,
                points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              }
            }
            return { ...el, x: snap.x + dx, y: snap.y + dy }
          })
          onElementsChange(newElements)
          break
        }
        case "resizing": {
          const dx = world.x - current.startWorld.x
          const dy = world.y - current.startWorld.y
          const updates = resizeElement(current.snapshot, current.handle, dx, dy)
          const newElements = elements.map((el) =>
            el.id === current.elementId ? { ...el, ...updates } : el
          )
          onElementsChange(newElements)
          break
        }
      }
    },
    [camera, elements, gridEnabled, gridSize, getWorldPoint, onCameraChange, onElementsChange]
  )

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      const current = interactionRef.current

      switch (current.type) {
        case "drawing": {
          const el = current.element
          // Only add if it has meaningful size
          const bounds = getElementBounds(el)
          if (
            bounds.width > 2 ||
            bounds.height > 2 ||
            el.type === "draw" ||
            ((el.type === "line" || el.type === "arrow") && el.points.length >= 2)
          ) {
            // Normalize negative widths/heights for shapes
            const normalized = { ...el }
            if (el.type !== "line" && el.type !== "arrow" && el.type !== "draw") {
              if (el.width < 0) {
                normalized.x = el.x + el.width
                normalized.width = -el.width
              }
              if (el.height < 0) {
                normalized.y = el.y + el.height
                normalized.height = -el.height
              }
            }
            onElementsChange([...elements, normalized])
            onSelectionChange([normalized.id])
          }
          setPreviewElement(null)
          break
        }
        case "selecting": {
          if (selectionBox) {
            const ids = elementsInSelectionBox(elements, selectionBox)
            onSelectionChange(ids)
            setSelectionBox(null)
          }
          break
        }
      }
      setInteraction({ type: "idle" })
    },
    [elements, selectionBox, onElementsChange, onSelectionChange]
  )

  // ── Wheel (Zoom) ────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
        const newZoom = Math.max(0.1, Math.min(10, camera.zoom * zoomFactor))

        // Zoom toward mouse position
        const worldBefore = screenToWorld(mouseX, mouseY, camera)
        const newCamera = { ...camera, zoom: newZoom }
        const worldAfter = screenToWorld(mouseX, mouseY, newCamera)

        newCamera.x += (worldAfter.x - worldBefore.x) * newZoom
        newCamera.y += (worldAfter.y - worldBefore.y) * newZoom

        onCameraChange(newCamera)
      } else {
        // Pan
        onCameraChange({
          ...camera,
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
        })
      }
    },
    [camera, onCameraChange]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // ── Keyboard ────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return

      if (e.key === " ") {
        e.preventDefault()
        spaceHeldRef.current = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceHeldRef.current = false
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // ── Double Click (Edit Text) ────────────────────────────────

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          if (el.type === "text" || el.type === "sticky" || el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") {
            onSelectionChange([el.id])
            onEditText(el.id)
            return
          }
        }
      }
    },
    [elements, camera, getWorldPoint, onSelectionChange, onEditText]
  )

  // ── Cursor ──────────────────────────────────────────────────

  const getCursor = (): string => {
    if (spaceHeldRef.current || tool === "hand") return interaction.type === "panning" ? "grabbing" : "grab"
    if (interaction.type === "panning") return "grabbing"
    if (tool === "select") return "default"
    if (tool === "text") return "text"
    return "crosshair"
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-900">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          cursor: getCursor(),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}
