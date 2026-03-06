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
  onDragStart: () => void
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
  onDragStart,
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
        const hitThreshold = 10 / zoom

        // 1. Try to hit-test control points on the active path first
        if (activePathId) {
          const activeLayer = layers.find((l) => l.id === activeLayerId)
          const activePath = activeLayer?.paths.find(
            (p) => p.id === activePathId
          )
          if (activePath) {
            const hit = hitTestSegmentPoints(point, activePath, hitThreshold)
            if (hit) {
              onDragStart()
              onSelectPoint(hit)
              setIsDragging(true)
              return
            }
          }
        }

        // 2. Try to hit-test control points on any visible path
        for (const layer of layers) {
          if (!layer.visible || layer.locked) continue
          for (const path of [...layer.paths].reverse()) {
            if (!path.visible || path.locked || path.id === activePathId) continue
            const hit = hitTestSegmentPoints(point, path, hitThreshold)
            if (hit) {
              onDragStart()
              onSelectPath(path.id)
              onSelectPoint(hit)
              setIsDragging(true)
              return
            }
          }
        }

        // 3. Try to hit test path bodies
        for (const layer of layers) {
          if (!layer.visible || layer.locked) continue
          for (const path of [...layer.paths].reverse()) {
            if (!path.visible || path.locked) continue
            if (path.segments.length > 0 && isPointNearPath(point, path, 12 / zoom)) {
              onSelectPath(path.id)
              onSelectPoint(null)
              return
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
      onDragStart,
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

// Sample points along a quadratic bezier curve
function sampleQuadratic(start: Point, cp: Point, end: Point, steps: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    pts.push({
      x: u * u * start.x + 2 * u * t * cp.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * cp.y + t * t * end.y,
    })
  }
  return pts
}

// Sample points along a cubic bezier curve
function sampleCubic(start: Point, cp1: Point, cp2: Point, end: Point, steps: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    pts.push({
      x: u * u * u * start.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * end.x,
      y: u * u * u * start.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * end.y,
    })
  }
  return pts
}

// Test if a point is near any path segment, including actual bezier curves
function isPointNearPath(p: Point, path: ShapePath, threshold: number): boolean {
  let currentPoint: Point | null = null
  const CURVE_SAMPLES = 20

  for (const seg of path.segments) {
    if (seg.type === "moveTo") {
      if (distToPoint(p, seg.point) < threshold) return true
      currentPoint = seg.point
    } else if (seg.type === "lineTo") {
      if (currentPoint && distToLineSegment(p, currentPoint, seg.point) < threshold) return true
      currentPoint = seg.point
    } else if (seg.type === "quadraticBezierTo") {
      if (currentPoint) {
        const samples = sampleQuadratic(currentPoint, seg.controlPoint, seg.endPoint, CURVE_SAMPLES)
        for (let i = 0; i < samples.length - 1; i++) {
          if (distToLineSegment(p, samples[i], samples[i + 1]) < threshold) return true
        }
      }
      currentPoint = seg.endPoint
    } else if (seg.type === "cubicTo") {
      if (currentPoint) {
        const samples = sampleCubic(currentPoint, seg.controlPoint1, seg.controlPoint2, seg.endPoint, CURVE_SAMPLES)
        for (let i = 0; i < samples.length - 1; i++) {
          if (distToLineSegment(p, samples[i], samples[i + 1]) < threshold) return true
        }
      }
      currentPoint = seg.endPoint
    } else if (seg.type === "arcToPoint") {
      if (currentPoint && distToLineSegment(p, currentPoint, seg.endPoint) < threshold) return true
      currentPoint = seg.endPoint
    } else if (seg.type === "close") {
      // Close goes back to the first moveTo point - skip hit testing the closing line
    }
  }
  return false
}

function distToPoint(p: Point, target: Point): number {
  const dx = p.x - target.x
  const dy = p.y - target.y
  return Math.sqrt(dx * dx + dy * dy)
}

function distToLineSegment(p: Point, a: Point, b: Point): number {
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
