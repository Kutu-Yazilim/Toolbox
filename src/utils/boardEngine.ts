import type {
  BoardElement,
  Camera,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
  ElementType,
  ConnectionSide,
  Connection,
} from "@/types/board"
import {
  DEFAULT_STYLE,
  getThemeStrokeColor,
  getThemeFillColor,
  getThemeTextColor,
  getThemeCanvasBg,
} from "@/types/board"

// ── ID Generation ───────────────────────────────────────────────

let counter = 0
export function generateElementId(): string {
  return `el-${Date.now()}-${counter++}`
}

// ── Coordinate Transforms ───────────────────────────────────────

export function screenToWorld(screenX: number, screenY: number, camera: Camera): Point {
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  }
}

export function worldToScreen(worldX: number, worldY: number, camera: Camera): Point {
  return {
    x: worldX * camera.zoom + camera.x,
    y: worldY * camera.zoom + camera.y,
  }
}

// ── Element Factory ─────────────────────────────────────────────

export function createElement(
  type: ElementType,
  x: number,
  y: number,
  style?: Partial<ElementStyle>
): BoardElement {
  // Apply theme-aware defaults
  const themedStroke = getThemeStrokeColor()
  const themedFill = getThemeFillColor()
  const baseStyle = { ...DEFAULT_STYLE, strokeColor: themedStroke, ...style }

  const base: BoardElement = {
    id: generateElementId(),
    type,
    x,
    y,
    width: 0,
    height: 0,
    rotation: 0,
    points: [],
    text: "",
    style: baseStyle,
    locked: false,
  }

  switch (type) {
    case "text":
      return {
        ...base,
        width: 200,
        height: 30,
        text: "",
        style: { ...baseStyle, fillColor: "transparent", strokeColor: getThemeTextColor() },
      }
    case "sticky":
      return {
        ...base,
        width: 200,
        height: 200,
        text: "",
        style: {
          ...baseStyle,
          fillColor: "#FEF3C7",
          strokeColor: "#F59E0B",
          strokeWidth: 1,
          fontSize: 14,
          borderRadius: 8,
        },
      }
    case "rectangle":
      return {
        ...base,
        style: { ...baseStyle, fillColor: themedFill, borderRadius: 4 },
      }
    case "ellipse":
    case "diamond":
      return {
        ...base,
        style: { ...baseStyle, fillColor: themedFill },
      }
    case "line":
    case "arrow":
      return { ...base, points: [{ x, y }], style: { ...baseStyle, fillColor: "transparent" } }
    case "draw":
      return { ...base, points: [{ x, y }], style: { ...baseStyle, fillColor: "transparent" } }
    default:
      return base
  }
}

// ── Element Bounds ──────────────────────────────────────────────

export function getElementBounds(el: BoardElement): Bounds {
  if ((el.type === "line" || el.type === "arrow" || el.type === "draw") && el.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of el.points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
  return {
    x: Math.min(el.x, el.x + el.width),
    y: Math.min(el.y, el.y + el.height),
    width: Math.abs(el.width),
    height: Math.abs(el.height),
  }
}

// ── Hit Testing ─────────────────────────────────────────────────

export function pointInElement(px: number, py: number, el: BoardElement, tolerance = 4): boolean {
  const bounds = getElementBounds(el)

  switch (el.type) {
    case "line":
    case "arrow": {
      if (el.points.length < 2) return false
      for (let i = 0; i < el.points.length - 1; i++) {
        if (pointNearLine(px, py, el.points[i], el.points[i + 1], tolerance + el.style.strokeWidth)) {
          return true
        }
      }
      return false
    }
    case "draw": {
      if (el.points.length < 2) return false
      for (let i = 0; i < el.points.length - 1; i++) {
        if (pointNearLine(px, py, el.points[i], el.points[i + 1], tolerance + el.style.strokeWidth + 2)) {
          return true
        }
      }
      return false
    }
    case "ellipse": {
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      const rx = bounds.width / 2 + tolerance
      const ry = bounds.height / 2 + tolerance
      if (rx === 0 || ry === 0) return false
      const dx = (px - cx) / rx
      const dy = (py - cy) / ry
      const outside = dx * dx + dy * dy

      if (el.style.fillColor !== "transparent") {
        return outside <= 1
      }
      // Stroke only: check ring
      const rxInner = Math.max(0, bounds.width / 2 - tolerance)
      const ryInner = Math.max(0, bounds.height / 2 - tolerance)
      if (rxInner === 0 || ryInner === 0) return outside <= 1
      const dxInner = (px - cx) / rxInner
      const dyInner = (py - cy) / ryInner
      return outside <= 1 && dxInner * dxInner + dyInner * dyInner >= 1
    }
    case "diamond": {
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      const hw = bounds.width / 2 + tolerance
      const hh = bounds.height / 2 + tolerance
      if (hw === 0 || hh === 0) return false
      const dx = Math.abs(px - cx) / hw
      const dy = Math.abs(py - cy) / hh
      if (el.style.fillColor !== "transparent") {
        return dx + dy <= 1
      }
      const hwInner = Math.max(0, bounds.width / 2 - tolerance)
      const hhInner = Math.max(0, bounds.height / 2 - tolerance)
      if (hwInner === 0 || hhInner === 0) return dx + dy <= 1
      const dxInner = Math.abs(px - cx) / hwInner
      const dyInner = Math.abs(py - cy) / hhInner
      return dx + dy <= 1 && dxInner + dyInner >= 1
    }
    default: {
      // Rectangle, text, sticky - bounding box check
      const t = tolerance
      if (el.style.fillColor !== "transparent" || el.type === "text" || el.type === "sticky") {
        return (
          px >= bounds.x - t &&
          px <= bounds.x + bounds.width + t &&
          py >= bounds.y - t &&
          py <= bounds.y + bounds.height + t
        )
      }
      // Stroke-only rectangle
      return (
        px >= bounds.x - t && px <= bounds.x + bounds.width + t &&
        py >= bounds.y - t && py <= bounds.y + bounds.height + t &&
        !(
          px >= bounds.x + t && px <= bounds.x + bounds.width - t &&
          py >= bounds.y + t && py <= bounds.y + bounds.height - t
        )
      )
    }
  }
}

function pointNearLine(px: number, py: number, a: Point, b: Point, threshold: number): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    const d = Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2)
    return d <= threshold
  }
  let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const closestX = a.x + t * dx
  const closestY = a.y + t * dy
  const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
  return dist <= threshold
}

// ── Selection Box Hit Test ──────────────────────────────────────

export function elementsInSelectionBox(
  elements: BoardElement[],
  selectionBounds: Bounds
): string[] {
  const sx = selectionBounds.x
  const sy = selectionBounds.y
  const sw = selectionBounds.width
  const sh = selectionBounds.height
  const sRight = sx + sw
  const sBottom = sy + sh

  return elements
    .filter((el) => {
      const b = getElementBounds(el)
      return (
        b.x < sRight &&
        b.x + b.width > sx &&
        b.y < sBottom &&
        b.y + b.height > sy
      )
    })
    .map((el) => el.id)
}

// ── Resize Handle Hit Test ──────────────────────────────────────

const HANDLE_SIZE = 8

export function getResizeHandleAtPoint(
  px: number,
  py: number,
  el: BoardElement,
  camera: Camera
): ResizeHandle | null {
  const bounds = getElementBounds(el)
  const handleSize = HANDLE_SIZE / camera.zoom

  const handles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: "nw", x: bounds.x, y: bounds.y },
    { handle: "n", x: bounds.x + bounds.width / 2, y: bounds.y },
    { handle: "ne", x: bounds.x + bounds.width, y: bounds.y },
    { handle: "w", x: bounds.x, y: bounds.y + bounds.height / 2 },
    { handle: "e", x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { handle: "sw", x: bounds.x, y: bounds.y + bounds.height },
    { handle: "s", x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { handle: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ]

  for (const h of handles) {
    if (
      Math.abs(px - h.x) <= handleSize &&
      Math.abs(py - h.y) <= handleSize
    ) {
      return h.handle
    }
  }
  return null
}

// ── Snap to Grid ────────────────────────────────────────────────

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// ── Connection Points ───────────────────────────────────────────

export function getConnectionPoint(el: BoardElement, side: ConnectionSide): Point {
  const bounds = getElementBounds(el)
  const cx = bounds.x + bounds.width / 2
  const cy = bounds.y + bounds.height / 2
  switch (side) {
    case "top": return { x: cx, y: bounds.y }
    case "bottom": return { x: cx, y: bounds.y + bounds.height }
    case "left": return { x: bounds.x, y: cy }
    case "right": return { x: bounds.x + bounds.width, y: cy }
  }
}

export function getConnectionPoints(el: BoardElement): { side: ConnectionSide; point: Point }[] {
  const sides: ConnectionSide[] = ["top", "right", "bottom", "left"]
  return sides.map((side) => ({ side, point: getConnectionPoint(el, side) }))
}

export function getNearestConnectionSide(el: BoardElement, px: number, py: number): ConnectionSide {
  const points = getConnectionPoints(el)
  let best = points[0]
  let bestDist = Infinity
  for (const cp of points) {
    const d = Math.sqrt((px - cp.point.x) ** 2 + (py - cp.point.y) ** 2)
    if (d < bestDist) {
      bestDist = d
      best = cp
    }
  }
  return best.side
}

/** Check if mouse is near any connection point of an element */
export function getConnectionPointAtMouse(
  elements: BoardElement[],
  px: number,
  py: number,
  camera: Camera,
  excludeIds: string[] = []
): { elementId: string; side: ConnectionSide; point: Point } | null {
  const threshold = 14 / camera.zoom
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]
    if (excludeIds.includes(el.id)) continue
    // Only connect to shapes (not lines/arrows/draw/text)
    if (el.type === "line" || el.type === "arrow" || el.type === "draw" || el.type === "text") continue
    const cps = getConnectionPoints(el)
    for (const cp of cps) {
      const d = Math.sqrt((px - cp.point.x) ** 2 + (py - cp.point.y) ** 2)
      if (d <= threshold) {
        return { elementId: el.id, side: cp.side, point: cp.point }
      }
    }
  }
  return null
}

/** Update arrow endpoints based on connections */
export function updateArrowConnections(
  arrow: BoardElement,
  elements: BoardElement[]
): BoardElement {
  if (arrow.type !== "arrow" || arrow.points.length < 2) return arrow
  const newPoints = [...arrow.points]
  if (arrow.startConnection) {
    const el = elements.find((e) => e.id === arrow.startConnection!.elementId)
    if (el) {
      newPoints[0] = getConnectionPoint(el, arrow.startConnection!.side)
    }
  }
  if (arrow.endConnection) {
    const el = elements.find((e) => e.id === arrow.endConnection!.elementId)
    if (el) {
      newPoints[newPoints.length - 1] = getConnectionPoint(el, arrow.endConnection!.side)
    }
  }
  return { ...arrow, points: newPoints }
}

// ── Canvas Rendering ────────────────────────────────────────────

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  elements: BoardElement[],
  camera: Camera,
  selectedIds: string[],
  canvasWidth: number,
  canvasHeight: number,
  gridEnabled: boolean,
  gridSize: number,
  selectionBox: Bounds | null,
  previewElement: BoardElement | null,
  hoveredElementId: string | null = null,
  activeConnectionPoint: { elementId: string; side: ConnectionSide } | null = null
) {
  // Theme-aware background
  const bgColor = getThemeCanvasBg()
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  ctx.save()

  // Apply camera transform
  ctx.translate(camera.x, camera.y)
  ctx.scale(camera.zoom, camera.zoom)

  // Draw grid
  if (gridEnabled) {
    drawGrid(ctx, camera, canvasWidth, canvasHeight, gridSize)
  }

  // Draw elements
  for (const el of elements) {
    drawElement(ctx, el, false)
  }

  // Draw preview element (being created)
  if (previewElement) {
    ctx.globalAlpha = 0.6
    drawElement(ctx, previewElement, false)
    ctx.globalAlpha = 1
  }

  // Draw selection highlights
  for (const id of selectedIds) {
    const el = elements.find((e) => e.id === id)
    if (el) drawSelectionHandles(ctx, el, camera)
  }

  // Draw connection points on hovered element
  if (hoveredElementId) {
    const el = elements.find((e) => e.id === hoveredElementId)
    if (el && el.type !== "line" && el.type !== "arrow" && el.type !== "draw" && el.type !== "text") {
      drawConnectionPoints(ctx, el, camera, activeConnectionPoint)
    }
  }
  // Also draw connection points on selected elements
  for (const id of selectedIds) {
    if (id === hoveredElementId) continue
    const el = elements.find((e) => e.id === id)
    if (el && el.type !== "line" && el.type !== "arrow" && el.type !== "draw" && el.type !== "text") {
      drawConnectionPoints(ctx, el, camera, activeConnectionPoint)
    }
  }

  // Draw selection box
  if (selectionBox) {
    ctx.strokeStyle = "#3B82F6"
    ctx.lineWidth = 1 / camera.zoom
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
    ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])
    ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height)
    ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height)
    ctx.setLineDash([])
  }

  ctx.restore()
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number
) {
  const topLeft = screenToWorld(0, 0, camera)
  const bottomRight = screenToWorld(canvasWidth, canvasHeight, camera)

  const startX = Math.floor(topLeft.x / gridSize) * gridSize
  const startY = Math.floor(topLeft.y / gridSize) * gridSize

  ctx.strokeStyle = "rgba(128, 128, 128, 0.15)"
  ctx.lineWidth = 1 / camera.zoom

  ctx.beginPath()
  for (let x = startX; x <= bottomRight.x; x += gridSize) {
    ctx.moveTo(x, topLeft.y)
    ctx.lineTo(x, bottomRight.y)
  }
  for (let y = startY; y <= bottomRight.y; y += gridSize) {
    ctx.moveTo(topLeft.x, y)
    ctx.lineTo(bottomRight.x, y)
  }
  ctx.stroke()
}

function drawElement(ctx: CanvasRenderingContext2D, el: BoardElement, _isSelected: boolean) {
  ctx.save()
  ctx.globalAlpha = el.style.opacity

  // Set stroke style
  if (el.style.strokeStyle === "dashed") {
    ctx.setLineDash([8, 4])
  } else if (el.style.strokeStyle === "dotted") {
    ctx.setLineDash([2, 4])
  }

  ctx.strokeStyle = el.style.strokeColor
  ctx.fillStyle = el.style.fillColor
  ctx.lineWidth = el.style.strokeWidth
  ctx.lineJoin = "round"
  ctx.lineCap = "round"

  switch (el.type) {
    case "rectangle":
      drawRectangle(ctx, el)
      break
    case "ellipse":
      drawEllipse(ctx, el)
      break
    case "diamond":
      drawDiamond(ctx, el)
      break
    case "line":
      drawLine(ctx, el)
      break
    case "arrow":
      drawArrow(ctx, el)
      break
    case "draw":
      drawFreehand(ctx, el)
      break
    case "text":
      drawText(ctx, el)
      break
    case "sticky":
      drawSticky(ctx, el)
      break
  }

  ctx.setLineDash([])
  ctx.restore()
}

function drawRectangle(ctx: CanvasRenderingContext2D, el: BoardElement) {
  const x = Math.min(el.x, el.x + el.width)
  const y = Math.min(el.y, el.y + el.height)
  const w = Math.abs(el.width)
  const h = Math.abs(el.height)
  const r = el.style.borderRadius

  if (r > 0) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    if (el.style.fillColor !== "transparent") ctx.fill()
    if (el.style.strokeColor !== "transparent") ctx.stroke()
  } else {
    if (el.style.fillColor !== "transparent") ctx.fillRect(x, y, w, h)
    if (el.style.strokeColor !== "transparent") ctx.strokeRect(x, y, w, h)
  }

  // Render text inside shape
  if (el.text) {
    drawShapeText(ctx, el, x, y, w, h)
  }
}

function drawShapeText(ctx: CanvasRenderingContext2D, el: BoardElement, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.font = `${el.style.fontSize}px ${el.style.fontFamily}`
  ctx.fillStyle = getThemeTextColor()
  ctx.textAlign = el.style.textAlign
  ctx.textBaseline = "top"

  const padding = 8
  const maxWidth = w - padding * 2
  if (maxWidth <= 0) { ctx.restore(); return }
  const lines = wrapText(ctx, el.text, maxWidth)
  const lineHeight = el.style.fontSize * 1.3
  const totalTextHeight = lines.length * lineHeight
  const startY = y + Math.max(padding, (h - totalTextHeight) / 2)

  let textX = x + padding
  if (el.style.textAlign === "center") textX = x + w / 2
  else if (el.style.textAlign === "right") textX = x + w - padding

  for (let i = 0; i < lines.length; i++) {
    const ty = startY + i * lineHeight
    if (ty + lineHeight > y + h) break
    ctx.fillText(lines[i], textX, ty, maxWidth)
  }
  ctx.restore()
}

function drawEllipse(ctx: CanvasRenderingContext2D, el: BoardElement) {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const rx = Math.abs(el.width) / 2
  const ry = Math.abs(el.height) / 2

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  if (el.style.fillColor !== "transparent") ctx.fill()
  if (el.style.strokeColor !== "transparent") ctx.stroke()

  if (el.text) {
    const x = Math.min(el.x, el.x + el.width)
    const y = Math.min(el.y, el.y + el.height)
    drawShapeText(ctx, el, x, y, Math.abs(el.width), Math.abs(el.height))
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, el: BoardElement) {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const hw = Math.abs(el.width) / 2
  const hh = Math.abs(el.height) / 2

  ctx.beginPath()
  ctx.moveTo(cx, cy - hh)
  ctx.lineTo(cx + hw, cy)
  ctx.lineTo(cx, cy + hh)
  ctx.lineTo(cx - hw, cy)
  ctx.closePath()
  if (el.style.fillColor !== "transparent") ctx.fill()
  if (el.style.strokeColor !== "transparent") ctx.stroke()

  if (el.text) {
    const x = Math.min(el.x, el.x + el.width)
    const y = Math.min(el.y, el.y + el.height)
    drawShapeText(ctx, el, x, y, Math.abs(el.width), Math.abs(el.height))
  }
}

function drawLine(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(el.points[0].x, el.points[0].y)
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.points[i].x, el.points[i].y)
  }
  ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.points.length < 2) return

  // Draw the line
  ctx.beginPath()
  ctx.moveTo(el.points[0].x, el.points[0].y)
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.points[i].x, el.points[i].y)
  }
  ctx.stroke()

  // Draw arrowhead
  const last = el.points[el.points.length - 1]
  const prev = el.points[el.points.length - 2]
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
  const headLen = 12 + el.style.strokeWidth * 2

  ctx.beginPath()
  ctx.moveTo(last.x, last.y)
  ctx.lineTo(
    last.x - headLen * Math.cos(angle - Math.PI / 6),
    last.y - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    last.x - headLen * Math.cos(angle + Math.PI / 6),
    last.y - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fillStyle = el.style.strokeColor
  ctx.fill()
}

function drawFreehand(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(el.points[0].x, el.points[0].y)

  // Smooth freehand with quadratic curves
  for (let i = 1; i < el.points.length - 1; i++) {
    const xc = (el.points[i].x + el.points[i + 1].x) / 2
    const yc = (el.points[i].y + el.points[i + 1].y) / 2
    ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc)
  }
  const last = el.points[el.points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function drawText(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (!el.text) return
  ctx.font = `${el.style.fontSize}px ${el.style.fontFamily}`
  // Use theme text color if stroke is transparent (i.e. pure text elements)
  ctx.fillStyle = el.style.strokeColor === "transparent" ? getThemeTextColor() : el.style.strokeColor
  ctx.textAlign = el.style.textAlign
  ctx.textBaseline = "top"

  const lines = el.text.split("\n")
  const lineHeight = el.style.fontSize * 1.3

  let textX = el.x
  if (el.style.textAlign === "center") textX = el.x + el.width / 2
  else if (el.style.textAlign === "right") textX = el.x + el.width

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textX, el.y + i * lineHeight)
  }
}

function drawSticky(ctx: CanvasRenderingContext2D, el: BoardElement) {
  // Background
  const r = el.style.borderRadius
  const x = el.x
  const y = el.y
  const w = el.width
  const h = el.height

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.15)"
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.fillStyle = el.style.fillColor
  if (r > 0) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Border
  if (el.style.strokeColor !== "transparent") {
    ctx.strokeStyle = el.style.strokeColor
    ctx.lineWidth = el.style.strokeWidth
    if (r > 0) {
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, w, h)
    }
  }

  // Text
  if (el.text) {
    ctx.font = `${el.style.fontSize}px ${el.style.fontFamily}`
    ctx.fillStyle = "#1e1e1e"
    ctx.textAlign = el.style.textAlign
    ctx.textBaseline = "top"

    const padding = 12
    const maxWidth = w - padding * 2
    const lines = wrapText(ctx, el.text, maxWidth)
    const lineHeight = el.style.fontSize * 1.4

    let textX = x + padding
    if (el.style.textAlign === "center") textX = x + w / 2
    else if (el.style.textAlign === "right") textX = x + w - padding

    for (let i = 0; i < lines.length; i++) {
      const textY = y + padding + i * lineHeight
      if (textY + lineHeight > y + h - padding) break
      ctx.fillText(lines[i], textX, textY, maxWidth)
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n")
  const lines: string[] = []

  for (const para of paragraphs) {
    const words = para.split(" ")
    let line = ""
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = testLine
      }
    }
    lines.push(line)
  }
  return lines
}

function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  camera: Camera
) {
  const bounds = getElementBounds(el)
  const handleSize = HANDLE_SIZE / camera.zoom
  const padding = 4 / camera.zoom

  // Selection outline
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1.5 / camera.zoom
  ctx.setLineDash([])
  ctx.strokeRect(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + padding * 2,
    bounds.height + padding * 2
  )

  // Don't draw resize handles for lines/arrows/freehand
  if (el.type === "line" || el.type === "arrow" || el.type === "draw") return

  // Handle positions
  const handles: Point[] = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width / 2, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height / 2 },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ]

  ctx.fillStyle = "#FFFFFF"
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1.5 / camera.zoom

  for (const h of handles) {
    ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
  }
}

function drawConnectionPoints(
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  camera: Camera,
  activePoint: { elementId: string; side: ConnectionSide } | null
) {
  const cps = getConnectionPoints(el)
  const dotSize = 6 / camera.zoom

  for (const cp of cps) {
    const isActive = activePoint && activePoint.elementId === el.id && activePoint.side === cp.side
    ctx.beginPath()
    ctx.arc(cp.point.x, cp.point.y, dotSize, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? "#2563EB" : "#3B82F6"
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 1.5 / camera.zoom
    ctx.stroke()
  }
}

// ── Resize Logic ────────────────────────────────────────────────

export function resizeElement(
  el: BoardElement,
  handle: ResizeHandle,
  dx: number,
  dy: number
): Partial<BoardElement> {
  const updates: Partial<BoardElement> = {}

  switch (handle) {
    case "nw":
      updates.x = el.x + dx
      updates.y = el.y + dy
      updates.width = el.width - dx
      updates.height = el.height - dy
      break
    case "n":
      updates.y = el.y + dy
      updates.height = el.height - dy
      break
    case "ne":
      updates.y = el.y + dy
      updates.width = el.width + dx
      updates.height = el.height - dy
      break
    case "w":
      updates.x = el.x + dx
      updates.width = el.width - dx
      break
    case "e":
      updates.width = el.width + dx
      break
    case "sw":
      updates.x = el.x + dx
      updates.width = el.width - dx
      updates.height = el.height + dy
      break
    case "s":
      updates.height = el.height + dy
      break
    case "se":
      updates.width = el.width + dx
      updates.height = el.height + dy
      break
  }

  return updates
}

// ── Export to PNG ────────────────────────────────────────────────

export function exportBoardToPng(
  elements: BoardElement[],
  padding = 40
): Promise<string> {
  return new Promise((resolve) => {
    if (elements.length === 0) {
      // Empty canvas
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 400, 300)
      ctx.fillStyle = "#999999"
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Empty board", 200, 150)
      resolve(canvas.toDataURL("image/png"))
      return
    }

    // Calculate bounds of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of elements) {
      const b = getElementBounds(el)
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    const canvas = document.createElement("canvas")
    canvas.width = width * 2 // Retina
    canvas.height = height * 2
    const ctx = canvas.getContext("2d")!
    ctx.scale(2, 2)

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Render with offset camera
    const exportCamera: Camera = {
      x: (-minX + padding),
      y: (-minY + padding),
      zoom: 1,
    }
    ctx.translate(exportCamera.x, exportCamera.y)

    for (const el of elements) {
      drawElement(ctx, el, false)
    }

    resolve(canvas.toDataURL("image/png"))
  })
}
