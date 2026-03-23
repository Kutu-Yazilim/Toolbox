import { useRef, useEffect, useCallback, useState } from "react"
import type {
  BoardElement,
  Camera,
  Tool,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
  ConnectionSide,
} from "@/types/board"
import {
  renderBoard,
  screenToWorld,
  pointInElement,
  elementsInSelectionBox,
  getResizeHandleAtPoint,
  getRotationHandleAtPoint,
  getArrowControlHandleAtPoint,
  resizeElement,
  createElement,
  getElementBounds,
  snapToGrid,
  getConnectionPointAtMouse,
  updateArrowConnections,
} from "@/utils/boardEngine"

interface ContextMenuState {
  x: number
  y: number
}

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
  onCommitText: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  onSelectAll: () => void
  onToggleLock: () => void
}

type InteractionState =
  | { type: "idle" }
  | { type: "panning"; startX: number; startY: number; startCamX: number; startCamY: number }
  | { type: "drawing"; element: BoardElement }
  | { type: "selecting"; startWorld: Point }
  | { type: "moving"; startWorld: Point; elementSnapshots: Map<string, { x: number; y: number; points: Point[] }> }
  | { type: "resizing"; handle: ResizeHandle; elementId: string; startWorld: Point; snapshot: BoardElement }
  | { type: "connecting"; fromElementId: string; fromSide: ConnectionSide; arrow: BoardElement }
  | { type: "rotating"; elementId: string; startAngle: number; startRotation: number }
  | { type: "curving"; arrowId: string; startOffset: Point }

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
  onCommitText,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onSelectAll,
  onToggleLock,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [interaction, setInteraction] = useState<InteractionState>({ type: "idle" })
  const [previewElement, setPreviewElement] = useState<BoardElement | null>(null)
  const [selectionBox, setSelectionBox] = useState<Bounds | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<{ elementId: string; side: ConnectionSide } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
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
      previewElement,
      hoveredElementId,
      activeConnectionPoint
    )
  }, [elements, camera, selectedIds, canvasSize, gridEnabled, gridSize, selectionBox, previewElement, hoveredElementId, activeConnectionPoint])

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

  // Close context menu on any click
  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const world = getWorldPoint(e)

      // Select the element under cursor if not already selected
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          if (!selectedIds.includes(el.id)) {
            onSelectionChange([el.id])
          }
          break
        }
      }

      setContextMenu({ x: e.clientX, y: e.clientY })
    },
    [elements, camera, selectedIds, getWorldPoint, onSelectionChange]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      closeContextMenu()
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      // Commit any active text editing when clicking on canvas
      onCommitText()

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

      // ── Check if clicking a connection point (to start arrow drag) ──
      if (tool === "select") {
        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        if (cp) {
          // Start dragging an arrow from this connection point
          const arrow = createElement("arrow", cp.point.x, cp.point.y, defaultStyle)
          arrow.points = [{ ...cp.point }, { ...cp.point }]
          arrow.startConnection = { elementId: cp.elementId, side: cp.side }
          setInteraction({ type: "connecting", fromElementId: cp.elementId, fromSide: cp.side, arrow })
          setPreviewElement(arrow)
          return
        }
      }

      // ── Select tool ─────────────────────────────────────────
      if (tool === "select") {
        // Check rotation handle on selected elements first
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && !el.locked) {
            if (getRotationHandleAtPoint(world.x, world.y, el, camera)) {
              const center = {
                x: getElementBounds(el).x + getElementBounds(el).width / 2,
                y: getElementBounds(el).y + getElementBounds(el).height / 2,
              }
              const startAngle = Math.atan2(world.y - center.y, world.x - center.x)
              setInteraction({
                type: "rotating",
                elementId: id,
                startAngle,
                startRotation: el.rotation,
              })
              return
            }
          }
        }

        // Check arrow control point handle
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (el && el.type === "arrow" && !el.locked) {
            if (getArrowControlHandleAtPoint(world.x, world.y, el, camera)) {
              setInteraction({
                type: "curving",
                arrowId: id,
                startOffset: el.controlPointOffset || { x: 0, y: 0 },
              })
              return
            }
          }
        }

        // Check resize handles on selected elements
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
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i]
          if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
            if (e.shiftKey) {
              const newIds = selectedIds.includes(el.id)
                ? selectedIds.filter((id) => id !== el.id)
                : [...selectedIds, el.id]
              onSelectionChange(newIds)
            } else if (!selectedIds.includes(el.id)) {
              onSelectionChange([el.id])
            }
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

      // ── Arrow tool - check for connection point at start ────
      if (tool === "arrow") {
        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        const arrow = createElement("arrow", world.x, world.y, defaultStyle)
        if (cp) {
          arrow.points = [{ ...cp.point }, { ...cp.point }]
          arrow.startConnection = { elementId: cp.elementId, side: cp.side }
        } else {
          arrow.points = [{ x: world.x, y: world.y }, { x: world.x, y: world.y }]
        }
        setInteraction({ type: "drawing", element: arrow })
        setPreviewElement(arrow)
        return
      }

      // ── Shape / Line / Draw tools ───────────────────────────
      const drawingElement = createElement(
        tool as BoardElement["type"],
        world.x,
        world.y,
        defaultStyle
      )
      if (tool === "line") {
        drawingElement.points = [{ x: world.x, y: world.y }, { x: world.x, y: world.y }]
      } else if (tool === "draw") {
        drawingElement.points = [{ x: world.x, y: world.y }]
      }
      setInteraction({ type: "drawing", element: drawingElement })
      setPreviewElement(drawingElement)
    },
    [tool, camera, elements, selectedIds, gridEnabled, gridSize, defaultStyle, getWorldPoint, onElementsChange, onSelectionChange, onToolChange, onEditText, onCommitText, closeContextMenu]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)
      const rect = canvasRef.current!.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const current = interactionRef.current

      // Track hovered element for connection points (only during idle or select tool)
      if (current.type === "idle" && (tool === "select" || tool === "arrow")) {
        let foundHover: string | null = null
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i]
          if (el.type === "line" || el.type === "arrow" || el.type === "draw" || el.type === "text") continue
          const bounds = getElementBounds(el)
          const margin = 20 / camera.zoom
          if (
            world.x >= bounds.x - margin && world.x <= bounds.x + bounds.width + margin &&
            world.y >= bounds.y - margin && world.y <= bounds.y + bounds.height + margin
          ) {
            foundHover = el.id
            break
          }
        }
        setHoveredElementId(foundHover)

        // Check if hovering over a specific connection point
        const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
        setActiveConnectionPoint(cp ? { elementId: cp.elementId, side: cp.side } : null)
      }

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
        case "connecting": {
          // Dragging arrow from connection point
          const arrow = current.arrow
          const points = [...arrow.points]
          // Snap to connection points on target elements
          const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera, [current.fromElementId])
          if (cp) {
            points[points.length - 1] = { ...cp.point }
            setActiveConnectionPoint({ elementId: cp.elementId, side: cp.side })
          } else {
            points[points.length - 1] = { x: world.x, y: world.y }
            setActiveConnectionPoint(null)
          }
          const updated = { ...arrow, points }
          setInteraction({ ...current, arrow: updated })
          setPreviewElement(updated)
          break
        }
        case "rotating": {
          const el = elements.find((el) => el.id === current.elementId)
          if (!el) break
          const bounds = getElementBounds(el)
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2
          const currentAngle = Math.atan2(world.y - centerY, world.x - centerX)
          let newRotation = current.startRotation + (currentAngle - current.startAngle)

          // Shift constrains to 15 degree increments
          if (e.shiftKey) {
            const step = (Math.PI / 180) * 15
            newRotation = Math.round(newRotation / step) * step
          }

          onElementsChange(
            elements.map((el) =>
              el.id === current.elementId ? { ...el, rotation: newRotation } : el
            )
          )
          break
        }
        case "curving": {
          const el = elements.find((el) => el.id === current.arrowId)
          if (!el || el.points.length < 2) break
          const start = el.points[0]
          const end = el.points[el.points.length - 1]
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const newOffset = { x: world.x - midX, y: world.y - midY }
          onElementsChange(
            elements.map((el) =>
              el.id === current.arrowId ? { ...el, controlPointOffset: newOffset } : el
            )
          )
          break
        }
        case "drawing": {
          const el = current.element
          if (el.type === "arrow") {
            const points = [...el.points]
            // Snap to connection points
            const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera)
            if (cp) {
              points[points.length - 1] = { ...cp.point }
              setActiveConnectionPoint({ elementId: cp.elementId, side: cp.side })
            } else {
              // Shift constrains arrow to 45 degree increments
              if (e.shiftKey) {
                const start = points[0]
                const dx = world.x - start.x
                const dy = world.y - start.y
                const angle = Math.atan2(dy, dx)
                const step = Math.PI / 4
                const snappedAngle = Math.round(angle / step) * step
                const dist = Math.sqrt(dx * dx + dy * dy)
                points[points.length - 1] = {
                  x: start.x + dist * Math.cos(snappedAngle),
                  y: start.y + dist * Math.sin(snappedAngle),
                }
              } else {
                points[points.length - 1] = { x: world.x, y: world.y }
              }
              setActiveConnectionPoint(null)
            }
            const updated = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else if (el.type === "line") {
            const points = [...el.points]
            if (e.shiftKey) {
              const start = points[0]
              const dx = world.x - start.x
              const dy = world.y - start.y
              const angle = Math.atan2(dy, dx)
              const step = Math.PI / 4
              const snappedAngle = Math.round(angle / step) * step
              const dist = Math.sqrt(dx * dx + dy * dy)
              points[points.length - 1] = {
                x: start.x + dist * Math.cos(snappedAngle),
                y: start.y + dist * Math.sin(snappedAngle),
              }
            } else {
              points[points.length - 1] = { x: world.x, y: world.y }
            }
            const updated = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else if (el.type === "draw") {
            const points = [...el.points, { x: world.x, y: world.y }]
            const updated = { ...el, points }
            setInteraction({ type: "drawing", element: updated })
            setPreviewElement(updated)
          } else {
            let w = world.x - el.x
            let h = world.y - el.y

            if (e.shiftKey) {
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
          const movedIds = new Set<string>()
          let newElements = elements.map((el) => {
            const snap = current.elementSnapshots.get(el.id)
            if (!snap) return el
            movedIds.add(el.id)
            if (el.points.length > 0 && (el.type === "line" || el.type === "arrow" || el.type === "draw")) {
              return {
                ...el,
                points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              }
            }
            return { ...el, x: snap.x + dx, y: snap.y + dy }
          })
          // Update any connected arrows when shapes are moved
          newElements = newElements.map((el) => {
            if (el.type !== "arrow") return el
            if (movedIds.has(el.id)) return el // arrow itself is being moved
            const hasStartConn = el.startConnection && movedIds.has(el.startConnection.elementId)
            const hasEndConn = el.endConnection && movedIds.has(el.endConnection.elementId)
            if (hasStartConn || hasEndConn) {
              return updateArrowConnections(el, newElements)
            }
            return el
          })
          onElementsChange(newElements)
          break
        }
        case "resizing": {
          const dx = world.x - current.startWorld.x
          const dy = world.y - current.startWorld.y
          const updates = resizeElement(current.snapshot, current.handle, dx, dy)
          let newElements = elements.map((el) =>
            el.id === current.elementId ? { ...el, ...updates } : el
          )
          // Update connected arrows when resizing
          newElements = newElements.map((el) => {
            if (el.type !== "arrow") return el
            const hasConn = (el.startConnection?.elementId === current.elementId) ||
                            (el.endConnection?.elementId === current.elementId)
            if (hasConn) return updateArrowConnections(el, newElements)
            return el
          })
          onElementsChange(newElements)
          break
        }
      }
    },
    [camera, elements, gridEnabled, gridSize, tool, getWorldPoint, onCameraChange, onElementsChange]
  )

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      const current = interactionRef.current

      switch (current.type) {
        case "connecting": {
          // Finalize the arrow from connection point drag
          const arrow = current.arrow
          const world = arrow.points[arrow.points.length - 1]
          // Check if dropped on a connection point
          const cp = getConnectionPointAtMouse(elements, world.x, world.y, camera, [current.fromElementId])
          const finalArrow = { ...arrow }
          if (cp) {
            finalArrow.endConnection = { elementId: cp.elementId, side: cp.side }
            const pts = [...finalArrow.points]
            pts[pts.length - 1] = { ...cp.point }
            finalArrow.points = pts
          }
          // Only add if arrow has meaningful length
          const dx = finalArrow.points[0].x - finalArrow.points[finalArrow.points.length - 1].x
          const dy = finalArrow.points[0].y - finalArrow.points[finalArrow.points.length - 1].y
          if (Math.sqrt(dx * dx + dy * dy) > 5) {
            onElementsChange([...elements, finalArrow])
            onSelectionChange([finalArrow.id])
          }
          setPreviewElement(null)
          setActiveConnectionPoint(null)
          break
        }
        case "drawing": {
          const el = current.element
          const bounds = getElementBounds(el)

          // For arrows, check for end connection
          if (el.type === "arrow") {
            const lastPt = el.points[el.points.length - 1]
            const cp = getConnectionPointAtMouse(elements, lastPt.x, lastPt.y, camera)
            const finalArrow = { ...el }
            if (cp) {
              finalArrow.endConnection = { elementId: cp.elementId, side: cp.side }
              const pts = [...finalArrow.points]
              pts[pts.length - 1] = { ...cp.point }
              finalArrow.points = pts
            }
            if (el.points.length >= 2) {
              const dx2 = el.points[0].x - el.points[el.points.length - 1].x
              const dy2 = el.points[0].y - el.points[el.points.length - 1].y
              if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > 5) {
                onElementsChange([...elements, finalArrow])
                onSelectionChange([finalArrow.id])
              }
            }
            setPreviewElement(null)
            setActiveConnectionPoint(null)
            break
          }

          if (
            bounds.width > 2 ||
            bounds.height > 2 ||
            el.type === "draw" ||
            ((el.type === "line") && el.points.length >= 2)
          ) {
            const normalized = { ...el }
            if (el.type !== "line" && el.type !== "draw") {
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

            // Auto-trigger text editing for shapes (like Miro)
            if (normalized.type === "rectangle" || normalized.type === "ellipse" || normalized.type === "diamond") {
              onToolChange("select")
              setTimeout(() => onEditText(normalized.id), 50)
            }
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
    [elements, selectionBox, camera, onElementsChange, onSelectionChange, onToolChange, onEditText]
  )

  // ── Wheel (Zoom) ────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
        const newZoom = Math.max(0.1, Math.min(10, camera.zoom * zoomFactor))
        const worldBefore = screenToWorld(mouseX, mouseY, camera)
        const newCamera = { ...camera, zoom: newZoom }
        const worldAfter = screenToWorld(mouseX, mouseY, newCamera)
        newCamera.x += (worldAfter.x - worldBefore.x) * newZoom
        newCamera.y += (worldAfter.y - worldBefore.y) * newZoom
        onCameraChange(newCamera)
      } else {
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

  // Close context menu when clicking elsewhere
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [contextMenu])

  // ── Double Click (Edit Text) ────────────────────────────────

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const world = getWorldPoint(e)
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (pointInElement(world.x, world.y, el, 6 / camera.zoom)) {
          if (el.type === "arrow") {
            // Double-click on arrow: start editing the label
            onSelectionChange([el.id])
            onEditText(el.id)
            return
          }
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
    if (interaction.type === "connecting") return "crosshair"
    if (interaction.type === "rotating") return "grab"
    if (interaction.type === "curving") return "move"
    if (activeConnectionPoint) return "crosshair"
    if (tool === "select") return "default"
    if (tool === "text") return "text"
    return "crosshair"
  }

  const selectedElement = selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : null
  const isLocked = selectedElement?.locked ?? false

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: getCursor(),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextMenuItem label="Cut" shortcut="Ctrl+X" disabled={selectedIds.length === 0} onClick={() => { onCut(); closeContextMenu() }} />
          <ContextMenuItem label="Copy" shortcut="Ctrl+C" disabled={selectedIds.length === 0} onClick={() => { onCopy(); closeContextMenu() }} />
          <ContextMenuItem label="Paste" shortcut="Ctrl+V" onClick={() => { onPaste(); closeContextMenu() }} />
          <ContextMenuItem label="Duplicate" shortcut="Ctrl+D" disabled={selectedIds.length === 0} onClick={() => { onDuplicate(); closeContextMenu() }} />
          <ContextMenuSeparator />
          <ContextMenuItem label="Bring to Front" disabled={selectedIds.length === 0} onClick={() => { onBringToFront(); closeContextMenu() }} />
          <ContextMenuItem label="Bring Forward" disabled={selectedIds.length === 0} onClick={() => { onBringForward(); closeContextMenu() }} />
          <ContextMenuItem label="Send Backward" disabled={selectedIds.length === 0} onClick={() => { onSendBackward(); closeContextMenu() }} />
          <ContextMenuItem label="Send to Back" disabled={selectedIds.length === 0} onClick={() => { onSendToBack(); closeContextMenu() }} />
          <ContextMenuSeparator />
          <ContextMenuItem
            label={isLocked ? "Unlock" : "Lock"}
            disabled={selectedIds.length === 0}
            onClick={() => { onToggleLock(); closeContextMenu() }}
          />
          <ContextMenuItem label="Delete" disabled={selectedIds.length === 0} onClick={() => { onDelete(); closeContextMenu() }} />
          <ContextMenuSeparator />
          <ContextMenuItem label="Select All" shortcut="Ctrl+A" onClick={() => { onSelectAll(); closeContextMenu() }} />
        </div>
      )}
    </div>
  )
}

function ContextMenuItem({ label, shortcut, disabled, onClick }: {
  label: string
  shortcut?: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
      disabled={disabled}
      onClick={onClick}
    >
      <span>{label}</span>
      {shortcut && <span className="text-xs text-muted-foreground ml-4">{shortcut}</span>}
    </button>
  )
}

function ContextMenuSeparator() {
  return <div className="h-px bg-border my-1" />
}
