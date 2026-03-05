import type {
  Point,
  ShapePath,
  PathSegment,
  PaintStyle,
  Layer,
  GradientDef,
  SelectedPoint,
} from "@/types/shapemaker"

// ─── Render helpers ─────────────────────────────────────────────

function applyGradient(
  ctx: CanvasRenderingContext2D,
  gradient: GradientDef
): CanvasGradient | null {
  let grad: CanvasGradient

  if (gradient.type === "linear") {
    grad = ctx.createLinearGradient(
      gradient.startPoint.x,
      gradient.startPoint.y,
      gradient.endPoint.x,
      gradient.endPoint.y
    )
  } else if (gradient.type === "radial") {
    grad = ctx.createRadialGradient(
      gradient.center.x,
      gradient.center.y,
      0,
      gradient.center.x,
      gradient.center.y,
      gradient.radius
    )
  } else {
    // Sweep gradient approximated as radial
    grad = ctx.createRadialGradient(
      gradient.center.x,
      gradient.center.y,
      0,
      gradient.center.x,
      gradient.center.y,
      200
    )
  }

  for (const stop of gradient.stops) {
    grad.addColorStop(stop.offset, stop.color)
  }

  return grad
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

function applyPaint(ctx: CanvasRenderingContext2D, paint: PaintStyle) {
  if (paint.gradient) {
    const grad = applyGradient(ctx, paint.gradient)
    if (grad) {
      ctx.fillStyle = grad
      ctx.strokeStyle = grad
    }
  } else {
    ctx.fillStyle = hexToRgba(paint.fillColor, paint.fillOpacity)
    ctx.strokeStyle = hexToRgba(paint.strokeColor, paint.strokeOpacity)
  }

  ctx.lineWidth = paint.strokeWidth
  ctx.lineCap = paint.strokeCap
  ctx.lineJoin = paint.strokeJoin

  if (paint.blurRadius > 0) {
    ctx.shadowBlur = paint.blurRadius
    ctx.shadowColor = paint.shadowColor
    ctx.shadowOffsetX = paint.shadowOffset.x
    ctx.shadowOffsetY = paint.shadowOffset.y
  } else {
    ctx.shadowBlur = 0
    ctx.shadowColor = "transparent"
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
}

function tracePath(ctx: CanvasRenderingContext2D, segments: PathSegment[]) {
  ctx.beginPath()

  for (const seg of segments) {
    switch (seg.type) {
      case "moveTo":
        ctx.moveTo(seg.point.x, seg.point.y)
        break
      case "lineTo":
        ctx.lineTo(seg.point.x, seg.point.y)
        break
      case "quadraticBezierTo":
        ctx.quadraticCurveTo(
          seg.controlPoint.x,
          seg.controlPoint.y,
          seg.endPoint.x,
          seg.endPoint.y
        )
        break
      case "cubicTo":
        ctx.bezierCurveTo(
          seg.controlPoint1.x,
          seg.controlPoint1.y,
          seg.controlPoint2.x,
          seg.controlPoint2.y,
          seg.endPoint.x,
          seg.endPoint.y
        )
        break
      case "arcToPoint": {
        // Approximate with canvas arc
        // Canvas doesn't have arcToPoint directly, use ellipse approximation
        const rx = seg.radius.x
        const ry = seg.radius.y
        if (rx === ry) {
          // Circular arc - use arcTo
          ctx.arcTo(
            seg.endPoint.x,
            seg.endPoint.y,
            seg.endPoint.x,
            seg.endPoint.y,
            rx
          )
        } else {
          // Fallback to lineTo for elliptical arcs
          ctx.lineTo(seg.endPoint.x, seg.endPoint.y)
        }
        break
      }
      case "close":
        ctx.closePath()
        break
    }
  }
}

export function renderPath(
  ctx: CanvasRenderingContext2D,
  path: ShapePath
) {
  if (!path.visible || path.segments.length === 0) return

  ctx.save()
  applyPaint(ctx, path.paint)
  tracePath(ctx, path.segments)

  if (
    path.paint.paintingStyle === "fill" ||
    path.paint.paintingStyle === "fillAndStroke"
  ) {
    ctx.fill()
  }

  if (
    path.paint.paintingStyle === "stroke" ||
    path.paint.paintingStyle === "fillAndStroke"
  ) {
    if (!path.paint.gradient) {
      ctx.strokeStyle = hexToRgba(
        path.paint.strokeColor,
        path.paint.strokeOpacity
      )
    }
    ctx.stroke()
  }

  ctx.restore()
}

export function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer
) {
  if (!layer.visible) return
  for (const path of layer.paths) {
    renderPath(ctx, path)
  }
}

// ─── Grid ───────────────────────────────────────────────────────

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const gridSize = 20
  const effectiveGrid = gridSize * zoom

  ctx.save()
  ctx.strokeStyle = "rgba(128, 128, 128, 0.12)"
  ctx.lineWidth = 1

  // Minor grid
  const startX = (panX % effectiveGrid) - effectiveGrid
  const startY = (panY % effectiveGrid) - effectiveGrid

  for (let x = startX; x < width; x += effectiveGrid) {
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, height)
    ctx.stroke()
  }
  for (let y = startY; y < height; y += effectiveGrid) {
    ctx.beginPath()
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(width, Math.round(y) + 0.5)
    ctx.stroke()
  }

  // Major grid (every 5)
  const majorGrid = effectiveGrid * 5
  ctx.strokeStyle = "rgba(128, 128, 128, 0.25)"

  const startMX = (panX % majorGrid) - majorGrid
  const startMY = (panY % majorGrid) - majorGrid

  for (let x = startMX; x < width; x += majorGrid) {
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, height)
    ctx.stroke()
  }
  for (let y = startMY; y < height; y += majorGrid) {
    ctx.beginPath()
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(width, Math.round(y) + 0.5)
    ctx.stroke()
  }

  ctx.restore()
}

// ─── Control points overlay ────────────────────────────────────

export function renderControlPoints(
  ctx: CanvasRenderingContext2D,
  path: ShapePath,
  selectedPoint: SelectedPoint | null,
  zoom: number,
  panX: number,
  panY: number
) {
  if (path.segments.length === 0) return

  const pointSize = 5 / zoom
  const ctrlSize = 4 / zoom

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // Draw control lines and points for each segment
  let prevPoint: Point | null = null

  for (let i = 0; i < path.segments.length; i++) {
    const seg = path.segments[i]
    const isSelected =
      selectedPoint?.pathId === path.id && selectedPoint?.segmentIndex === i

    if (seg.type === "moveTo") {
      drawPoint(
        ctx,
        seg.point,
        pointSize,
        isSelected && selectedPoint?.pointType === "point"
      )
      prevPoint = seg.point
    } else if (seg.type === "lineTo") {
      drawPoint(
        ctx,
        seg.point,
        pointSize,
        isSelected && selectedPoint?.pointType === "point"
      )
      prevPoint = seg.point
    } else if (seg.type === "quadraticBezierTo") {
      // Control line
      if (prevPoint) {
        drawControlLine(ctx, prevPoint, seg.controlPoint)
      }
      drawControlLine(ctx, seg.controlPoint, seg.endPoint)

      drawControlPoint(
        ctx,
        seg.controlPoint,
        ctrlSize,
        isSelected && selectedPoint?.pointType === "controlPoint1"
      )
      drawPoint(
        ctx,
        seg.endPoint,
        pointSize,
        isSelected && selectedPoint?.pointType === "endPoint"
      )
      prevPoint = seg.endPoint
    } else if (seg.type === "cubicTo") {
      if (prevPoint) {
        drawControlLine(ctx, prevPoint, seg.controlPoint1)
      }
      drawControlLine(ctx, seg.controlPoint2, seg.endPoint)

      drawControlPoint(
        ctx,
        seg.controlPoint1,
        ctrlSize,
        isSelected && selectedPoint?.pointType === "controlPoint1"
      )
      drawControlPoint(
        ctx,
        seg.controlPoint2,
        ctrlSize,
        isSelected && selectedPoint?.pointType === "controlPoint2"
      )
      drawPoint(
        ctx,
        seg.endPoint,
        pointSize,
        isSelected && selectedPoint?.pointType === "endPoint"
      )
      prevPoint = seg.endPoint
    } else if (seg.type === "arcToPoint") {
      drawPoint(
        ctx,
        seg.endPoint,
        pointSize,
        isSelected && selectedPoint?.pointType === "endPoint"
      )
      prevPoint = seg.endPoint
    }
  }

  ctx.restore()
}

function drawPoint(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  selected: boolean
) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
  ctx.fillStyle = selected ? "#ff4444" : "#ffffff"
  ctx.strokeStyle = selected ? "#ff4444" : "#2196F3"
  ctx.lineWidth = 2 / (ctx.getTransform().a || 1)
  ctx.fill()
  ctx.stroke()
}

function drawControlPoint(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  selected: boolean
) {
  ctx.beginPath()
  ctx.rect(p.x - size, p.y - size, size * 2, size * 2)
  ctx.fillStyle = selected ? "#ff4444" : "#ffffff"
  ctx.strokeStyle = selected ? "#ff4444" : "#ff9800"
  ctx.lineWidth = 1.5 / (ctx.getTransform().a || 1)
  ctx.fill()
  ctx.stroke()
}

function drawControlLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point
) {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = "rgba(255, 152, 0, 0.5)"
  ctx.lineWidth = 1 / (ctx.getTransform().a || 1)
  ctx.setLineDash([4 / (ctx.getTransform().a || 1), 4 / (ctx.getTransform().a || 1)])
  ctx.stroke()
  ctx.setLineDash([])
}

// ─── Hit testing ────────────────────────────────────────────────

export function hitTestPoint(
  p: Point,
  target: Point,
  threshold: number
): boolean {
  const dx = p.x - target.x
  const dy = p.y - target.y
  return dx * dx + dy * dy <= threshold * threshold
}

export function hitTestSegmentPoints(
  mousePos: Point,
  path: ShapePath,
  threshold: number
): SelectedPoint | null {
  for (let i = 0; i < path.segments.length; i++) {
    const seg = path.segments[i]

    if (seg.type === "moveTo" || seg.type === "lineTo") {
      if (hitTestPoint(mousePos, seg.point, threshold)) {
        return { pathId: path.id, segmentIndex: i, pointType: "point" }
      }
    } else if (seg.type === "quadraticBezierTo") {
      if (hitTestPoint(mousePos, seg.controlPoint, threshold)) {
        return {
          pathId: path.id,
          segmentIndex: i,
          pointType: "controlPoint1",
        }
      }
      if (hitTestPoint(mousePos, seg.endPoint, threshold)) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "cubicTo") {
      if (hitTestPoint(mousePos, seg.controlPoint1, threshold)) {
        return {
          pathId: path.id,
          segmentIndex: i,
          pointType: "controlPoint1",
        }
      }
      if (hitTestPoint(mousePos, seg.controlPoint2, threshold)) {
        return {
          pathId: path.id,
          segmentIndex: i,
          pointType: "controlPoint2",
        }
      }
      if (hitTestPoint(mousePos, seg.endPoint, threshold)) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "arcToPoint") {
      if (hitTestPoint(mousePos, seg.endPoint, threshold)) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    }
  }
  return null
}

// ─── Snap to grid ───────────────────────────────────────────────

export function snapToGrid(p: Point, gridSize: number): Point {
  return {
    x: Math.round(p.x / gridSize) * gridSize,
    y: Math.round(p.y / gridSize) * gridSize,
  }
}

// ─── Screen <-> Canvas coordinate transforms ───────────────────

export function screenToCanvas(
  screenX: number,
  screenY: number,
  zoom: number,
  panX: number,
  panY: number,
  canvasRect: DOMRect
): Point {
  return {
    x: (screenX - canvasRect.left - panX) / zoom,
    y: (screenY - canvasRect.top - panY) / zoom,
  }
}
