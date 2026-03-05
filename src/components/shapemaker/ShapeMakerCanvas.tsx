import { useRef, useEffect, useCallback, useState } from "react"
import type {
  Point,
  ShapePath,
  Layer,
  ToolMode,
  SelectedPoint,
  PathSegment,
} from "@/types/shapemaker"
import {
  renderGrid,
  renderLayer,
  renderControlPoints,
  screenToCanvas,
  hitTestSegmentPoints,
  snapToGrid,
} from "@/utils/shapemakerCanvas"

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
  curveMode: "line" | "quadratic" | "cubic"
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
  onAddSegment,
  onSelectPoint,
  onMovePoint,
  onPanChange,
  onZoomChange,
  onFinishShape,
  onSelectPath,
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

    // Control points for active path
    if (activePathId) {
      const activeLayer = layers.find((l) => l.id === activeLayerId)
      const activePath = activeLayer?.paths.find((p) => p.id === activePathId)
      if (activePath) {
        renderControlPoints(ctx, activePath, selectedPoint, zoom, panX, panY)
      }
    }

    // Shape preview (for rectangle/ellipse tools)
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
      // Middle mouse button or space + click = panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
        return
      }

      if (e.button !== 0) return

      const point = getCanvasPoint(e)
      setMousePos(point)

      if (tool === "select") {
        // Try to hit-test control points first
        if (activePathId) {
          const activeLayer = layers.find((l) => l.id === activeLayerId)
          const activePath = activeLayer?.paths.find(
            (p) => p.id === activePathId
          )
          if (activePath) {
            const hit = hitTestSegmentPoints(
              point,
              activePath,
              8 / zoom
            )
            if (hit) {
              onSelectPoint(hit)
              setIsDragging(true)
              return
            }
          }
        }

        // Try to hit test paths
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            // Check all layers for path hits
            for (const layer of layers) {
              if (!layer.visible || layer.locked) continue
              for (const path of [...layer.paths].reverse()) {
                if (!path.visible || path.locked) continue
                // Simple bounding check
                const points = getPathPoints(path)
                if (points.length > 0 && isPointNearPath(point, points, 10 / zoom)) {
                  onSelectPath(path.id)
                  onSelectPoint(null)
                  return
                }
              }
            }
          }
        }

        onSelectPath(null)
        onSelectPoint(null)
      } else if (tool === "pen") {
        onAddSegment(point)
      } else if (
        tool === "rectangle" ||
        tool === "ellipse" ||
        tool === "line"
      ) {
        setShapePreview({ start: point, current: point })
        setIsDragging(true)
      }
    },
    [
      tool,
      activePathId,
      activeLayerId,
      layers,
      zoom,
      panX,
      panY,
      getCanvasPoint,
      onAddSegment,
      onSelectPoint,
      onSelectPath,
    ]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasPoint(e)
      setMousePos(point)

      if (isPanning && dragStart) {
        onPanChange(e.clientX - dragStart.x, e.clientY - dragStart.y)
        return
      }

      if (isDragging && tool === "select" && selectedPoint) {
        onMovePoint(selectedPoint, point)
        return
      }

      if (isDragging && shapePreview) {
        setShapePreview((prev) =>
          prev ? { ...prev, current: point } : null
        )
      }
    },
    [
      getCanvasPoint,
      isPanning,
      isDragging,
      dragStart,
      tool,
      selectedPoint,
      shapePreview,
      onPanChange,
      onMovePoint,
    ]
  )

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      setDragStart(null)
      return
    }

    if (isDragging && shapePreview) {
      onFinishShape(shapePreview.start, shapePreview.current)
      setShapePreview(null)
    }

    setIsDragging(false)
  }, [isPanning, isDragging, shapePreview, onFinishShape])

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
    <div ref={containerRef} className="flex-1 min-h-0 relative cursor-crosshair overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

// Helper to get all points from a path for hit testing
function getPathPoints(path: ShapePath): Point[] {
  const points: Point[] = []
  for (const seg of path.segments) {
    if (seg.type === "moveTo" || seg.type === "lineTo") {
      points.push(seg.point)
    } else if (seg.type === "quadraticBezierTo") {
      points.push(seg.endPoint)
    } else if (seg.type === "cubicTo") {
      points.push(seg.endPoint)
    } else if (seg.type === "arcToPoint") {
      points.push(seg.endPoint)
    }
  }
  return points
}

function isPointNearPath(p: Point, pathPoints: Point[], threshold: number): boolean {
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i]
    const b = pathPoints[i + 1]
    const dist = distToSegment(p, a, b)
    if (dist < threshold) return true
  }
  // Also check if near any point
  for (const pt of pathPoints) {
    const dx = p.x - pt.x
    const dy = p.y - pt.y
    if (Math.sqrt(dx * dx + dy * dy) < threshold) return true
  }
  return false
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const px = a.x + t * dx
  const py = a.y + t * dy
  return Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2)
}
