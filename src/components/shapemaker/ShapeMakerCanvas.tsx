"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import type {
  Point,
  Layer,
  ToolMode,
  SelectedPoint,
  PathSegment,
  InteractionState,
  InteractionAction,
} from "@/types/shapemaker"
import {
  renderGrid,
  renderLayer,
  renderControlPoints,
  renderBoundingBox,
  screenToCanvas,
  snapToGrid,
} from "@/utils/shapemakerCanvas"
import { performHitTest } from "@/utils/shapemakerHitTest"
import { processEvent } from "@/utils/shapemakerInteraction"

type Props = {
  layers: Layer[]
  activeLayerId: string
  activePathId: string | null
  tool: ToolMode
  snapEnabled: boolean
  gridSize: number
  showGrid: boolean
  zoom: number
  panX: number
  panY: number
  selectedPoint: SelectedPoint | null
  backgroundColor: string
  onUpdatePath: (layerId: string, pathId: string, segments: PathSegment[]) => void
  onAddSegment: (point: Point) => void
  onSelectPoint: (sp: SelectedPoint | null) => void
  onMovePoint: (sp: SelectedPoint, newPos: Point) => void
  onPanChange: (x: number, y: number) => void
  onZoomChange: (zoom: number) => void
  onFinishShape: (startPoint: Point, endPoint: Point) => void
  onSelectPath: (pathId: string | null) => void
  onDragStart: () => void
  curveMode: "line" | "quadratic" | "cubic"
  interactionState: InteractionState
  onInteractionStateChange: (state: InteractionState) => void
  onDispatchActions: (actions: InteractionAction[]) => void
}

export function ShapeMakerCanvas({
  layers,
  activeLayerId,
  activePathId,
  tool,
  snapEnabled,
  gridSize,
  showGrid,
  zoom,
  panX,
  panY,
  selectedPoint,
  backgroundColor,
  onAddSegment: _onAddSegment,
  onSelectPoint: _onSelectPoint,
  onMovePoint,
  onPanChange,
  onZoomChange,
  onFinishShape,
  onSelectPath: _onSelectPath,
  onDragStart: _onDragStart,
  interactionState,
  onInteractionStateChange,
  onDispatchActions,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [shapePreview, setShapePreview] = useState<{
    start: Point
    current: Point
  } | null>(null)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [cursor, setCursor] = useState("crosshair")

  // Helper to get screen point from mouse event
  const getScreenPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    },
    []
  )

  // Helper to perform hit test using canvas context
  const doHitTest = useCallback(
    (canvasPoint: Point, screenPoint: Point) => {
      const canvas = canvasRef.current
      if (!canvas) return { type: "none" as const }
      const ctx = canvas.getContext("2d")
      if (!ctx) return { type: "none" as const }

      const nodeMode = interactionState.type === "shape-selected" && interactionState.mode === "node"

      return performHitTest({
        ctx,
        layers,
        selectedPathId: activePathId,
        zoom,
        panX,
        panY,
        canvasPoint,
        screenPoint,
        nodeMode,
      })
    },
    [layers, activePathId, zoom, panX, panY, interactionState]
  )

  // Helper to extract cursor actions and dispatch the rest
  const handleProcessResult = useCallback(
    (result: { newState: InteractionState; actions: InteractionAction[] }) => {
      onInteractionStateChange(result.newState)
      const nonCursorActions: InteractionAction[] = []
      for (const action of result.actions) {
        if (action.type === "set-cursor") {
          setCursor(action.cursor)
        } else {
          nonCursorActions.push(action)
        }
      }
      if (nonCursorActions.length > 0) {
        onDispatchActions(nonCursorActions)
      }
    },
    [onInteractionStateChange, onDispatchActions]
  )

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, W, H)

    // Grid
    if (showGrid) {
      renderGrid(ctx, W, H, zoom, panX, panY)
    }

    // Render all layers
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    for (const layer of layers) {
      renderLayer(ctx, layer)
    }

    ctx.restore()

    // Bounding box for shape-selected mode
    if (
      interactionState.type === "shape-selected" &&
      interactionState.mode === "shape" &&
      activePathId
    ) {
      const activeLayer = layers.find((l) => l.id === activeLayerId)
      const activePath = activeLayer?.paths.find((p) => p.id === activePathId)
      if (activePath && activePath.segments.length > 0) {
        renderBoundingBox(ctx, activePath, zoom, panX, panY)
      }
    }

    // Control points for active path (node mode or drawing tools)
    if (activePathId) {
      const showControlPoints =
        (interactionState.type === "shape-selected" && interactionState.mode === "node") ||
        interactionState.type === "dragging-node" ||
        interactionState.type === "drawing-pen" ||
        interactionState.type === "idle" ||
        tool === "pen"

      if (showControlPoints) {
        const activeLayer = layers.find((l) => l.id === activeLayerId)
        const activePath = activeLayer?.paths.find((p) => p.id === activePathId)
        if (activePath) {
          renderControlPoints(ctx, activePath, selectedPoint, zoom, panX, panY)
        }
      }
    }

    // Shape preview (for rectangle/ellipse/line tools during drawing)
    if (shapePreview) {
      ctx.save()
      ctx.translate(panX, panY)
      ctx.scale(zoom, zoom)
      ctx.strokeStyle = "#2196F3"
      ctx.lineWidth = 1.5 / zoom
      ctx.setLineDash([6 / zoom, 4 / zoom])

      if (tool === "rectangle") {
        const x = Math.min(shapePreview.start.x, shapePreview.current.x)
        const y = Math.min(shapePreview.start.y, shapePreview.current.y)
        const w = Math.abs(shapePreview.current.x - shapePreview.start.x)
        const h = Math.abs(shapePreview.current.y - shapePreview.start.y)
        ctx.strokeRect(x, y, w, h)
      } else if (tool === "ellipse") {
        const cx =
          (shapePreview.start.x + shapePreview.current.x) / 2
        const cy =
          (shapePreview.start.y + shapePreview.current.y) / 2
        const rx =
          Math.abs(shapePreview.current.x - shapePreview.start.x) / 2
        const ry =
          Math.abs(shapePreview.current.y - shapePreview.start.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (tool === "line") {
        ctx.beginPath()
        ctx.moveTo(shapePreview.start.x, shapePreview.start.y)
        ctx.lineTo(shapePreview.current.x, shapePreview.current.y)
        ctx.stroke()
      }

      ctx.setLineDash([])
      ctx.restore()
    }
  }, [
    layers,
    activeLayerId,
    activePathId,
    selectedPoint,
    zoom,
    panX,
    panY,
    showGrid,
    backgroundColor,
    shapePreview,
    tool,
    interactionState,
  ])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = container.clientWidth * dpr
      canvas.height = container.clientHeight * dpr
      canvas.style.width = `${container.clientWidth}px`
      canvas.style.height = `${container.clientHeight}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.scale(dpr, dpr)
      render()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  // Re-render on state change
  useEffect(() => {
    render()
  }, [render])

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      let p = screenToCanvas(e.clientX, e.clientY, zoom, panX, panY, rect)
      if (snapEnabled) {
        p = snapToGrid(p, gridSize)
      }
      return p
    },
    [zoom, panX, panY, snapEnabled, gridSize]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or Alt + click = panning (parallel concern)
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
        return
      }

      if (e.button !== 0) return

      const point = getCanvasPoint(e)
      const screenPoint = getScreenPoint(e)
      setMousePos(point)

      if (tool === "select") {
        // Route through state machine
        const hitTest = doHitTest(point, screenPoint)
        const result = processEvent(
          interactionState,
          {
            type: "mousedown",
            point,
            screenPoint,
            button: e.button,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest,
            activePathId,
          },
        )
        handleProcessResult(result)
        return
      }

      if (tool === "pen") {
        // Route through state machine for pen tool
        const result = processEvent(
          interactionState,
          {
            type: "mousedown",
            point,
            screenPoint,
            button: e.button,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest: { type: "none" },
            activePathId,
          },
        )
        handleProcessResult(result)
        return
      }

      if (
        tool === "rectangle" ||
        tool === "ellipse" ||
        tool === "line"
      ) {
        // Route through state machine for shape tools
        const result = processEvent(
          interactionState,
          {
            type: "mousedown",
            point,
            screenPoint,
            button: e.button,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest: { type: "none" },
            activePathId,
          },
        )
        handleProcessResult(result)
        // Also set shape preview for visual feedback
        setShapePreview({ start: point, current: point })
        setIsDragging(true)
      }
    },
    [
      tool,
      activePathId,
      layers,
      zoom,
      panX,
      panY,
      snapEnabled,
      gridSize,
      getCanvasPoint,
      getScreenPoint,
      interactionState,
      doHitTest,
      handleProcessResult,
    ]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e)
      const screenPoint = getScreenPoint(e)
      setMousePos(point)

      if (isPanning && dragStart) {
        onPanChange(e.clientX - dragStart.x, e.clientY - dragStart.y)
        return
      }

      // Route through state machine for active interaction states
      const activeStates = ["dragging-shape", "rotating", "resizing", "dragging-node"]
      if (activeStates.includes(interactionState.type)) {
        const result = processEvent(
          interactionState,
          {
            type: "mousemove",
            point,
            screenPoint,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest: { type: "none" },
            activePathId,
          },
        )
        handleProcessResult(result)
        return
      }

      // Cursor updates when shape is selected (hover)
      if (interactionState.type === "shape-selected" && interactionState.mode === "shape" && tool === "select") {
        const hitTest = doHitTest(point, screenPoint)
        const result = processEvent(
          interactionState,
          {
            type: "mousemove",
            point,
            screenPoint,
            shiftKey: e.shiftKey,
          },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest,
            activePathId,
          },
        )
        handleProcessResult(result)
        return
      }

      // Legacy: dragging node via old selectedPoint (backward compat)
      if (isDragging && tool === "select" && selectedPoint) {
        onMovePoint(selectedPoint, point)
        return
      }

      // Shape preview during drawing
      if (isDragging && shapePreview) {
        setShapePreview((prev) =>
          prev ? { ...prev, current: point } : null
        )
      }
    },
    [
      getCanvasPoint,
      getScreenPoint,
      isPanning,
      isDragging,
      dragStart,
      tool,
      selectedPoint,
      shapePreview,
      onPanChange,
      onMovePoint,
      interactionState,
      layers,
      zoom,
      panX,
      panY,
      snapEnabled,
      gridSize,
      activePathId,
      doHitTest,
      handleProcessResult,
    ]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent | undefined) => {
      if (isPanning) {
        setIsPanning(false)
        setDragStart(null)
        return
      }

      // Route through state machine for active states
      const activeStates = ["dragging-shape", "rotating", "resizing", "dragging-node", "drawing-shape"]
      if (activeStates.includes(interactionState.type)) {
        const point = e ? getCanvasPoint(e) : mousePos
        const result = processEvent(
          interactionState,
          { type: "mouseup", point },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest: { type: "none" },
            activePathId,
          },
        )
        handleProcessResult(result)

        // Clean up shape preview
        if (shapePreview) {
          setShapePreview(null)
        }
        setIsDragging(false)
        return
      }

      if (isDragging && shapePreview) {
        onFinishShape(shapePreview.start, shapePreview.current)
        setShapePreview(null)
      }

      setIsDragging(false)
    },
    [
      isPanning,
      isDragging,
      shapePreview,
      onFinishShape,
      interactionState,
      layers,
      tool,
      zoom,
      panX,
      panY,
      snapEnabled,
      gridSize,
      activePathId,
      getCanvasPoint,
      mousePos,
      handleProcessResult,
    ]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e)
      const screenPoint = getScreenPoint(e)

      if (interactionState.type === "shape-selected") {
        const hitTest = doHitTest(point, screenPoint)
        const result = processEvent(
          interactionState,
          { type: "dblclick", point, screenPoint },
          {
            layers,
            tool,
            zoom,
            panX,
            panY,
            snapEnabled,
            gridSize,
            hitTest,
            activePathId,
          },
        )
        handleProcessResult(result)
      }
    },
    [
      getCanvasPoint,
      getScreenPoint,
      interactionState,
      layers,
      tool,
      zoom,
      panX,
      panY,
      snapEnabled,
      gridSize,
      activePathId,
      doHitTest,
      handleProcessResult,
    ]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 10)

      // Zoom toward mouse position
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const newPanX = mx - ((mx - panX) * newZoom) / zoom
        const newPanY = my - ((my - panY) * newZoom) / zoom
        onPanChange(newPanX, newPanY)
      }

      onZoomChange(newZoom)
    },
    [zoom, panX, panY, onPanChange, onZoomChange]
  )

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={(e) => handleMouseUp(e)}
        onMouseLeave={() => handleMouseUp(undefined)}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Coordinate display */}
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 border border-border text-xs text-muted-foreground font-mono">
        {mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)} | {(zoom * 100).toFixed(0)}%
      </div>
    </div>
  )
}
