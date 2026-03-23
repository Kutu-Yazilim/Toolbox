import type {
  BoardElement,
  Camera,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
  ElementType,
  ConnectionSide,
  SmartGuide,
} from "@/types/board"
import {
  DEFAULT_STYLE,
  getThemeStrokeColor,
  getThemeFillColor,
  getThemeTextColor,
  getThemeCanvasBg,
} from "@/types/board"

// ── Font Family Map ──────────────────────────────────────────────

const FONT_FAMILY_MAP: Record<string, string> = {
  "sans-serif": "Inter, system-ui, sans-serif",
  "serif": "Georgia, serif",
  "monospace": "monospace",
  "cursive": "Caveat, cursive",
}

function buildFontString(style: ElementStyle): string {
  const family = FONT_FAMILY_MAP[style.fontFamily] || style.fontFamily
  return `${style.fontStyle || "normal"} ${style.fontWeight || "normal"} ${style.fontSize}px ${family}`
}

// ── Image Cache ──────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement>()

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

// ── Rotation Helpers ────────────────────────────────────────────

function getElementCenter(el: BoardElement): Point {
  const bounds = getElementBounds(el)
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
}

function rotatePoint(px: number, py: number, cx: number, cy: number, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = px - cx
  const dy = py - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
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
    case "image":
      return {
        ...base,
        width: 200,
        height: 200,
        style: { ...baseStyle, fillColor: "transparent", strokeColor: "transparent" },
      }
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
  // If element has rotation, inverse-rotate the test point around element center
  let testX = px
  let testY = py
  if (el.rotation !== 0) {
    const center = getElementCenter(el)
    const unrotated = rotatePoint(px, py, center.x, center.y, -el.rotation)
    testX = unrotated.x
    testY = unrotated.y
  }

  const bounds = getElementBounds(el)

  switch (el.type) {
    case "line":
    case "arrow": {
      if (el.points.length < 2) return false
      // For curved arrows, check distance to bezier curve
      if (el.type === "arrow" && el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)) {
        const start = el.points[0]
        const end = el.points[el.points.length - 1]
        const mid = { x: (start.x + end.x) / 2 + el.controlPointOffset.x, y: (start.y + end.y) / 2 + el.controlPointOffset.y }
        return pointNearBezier(testX, testY, start, mid, end, tolerance + el.style.strokeWidth)
      }
      for (let i = 0; i < el.points.length - 1; i++) {
        if (pointNearLine(testX, testY, el.points[i], el.points[i + 1], tolerance + el.style.strokeWidth)) {
          return true
        }
      }
      return false
    }
    case "draw": {
      if (el.points.length < 2) return false
      for (let i = 0; i < el.points.length - 1; i++) {
        if (pointNearLine(testX, testY, el.points[i], el.points[i + 1], tolerance + el.style.strokeWidth + 2)) {
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
      const dx = (testX - cx) / rx
      const dy = (testY - cy) / ry
      const outside = dx * dx + dy * dy

      if (el.style.fillColor !== "transparent") {
        return outside <= 1
      }
      // Stroke only: check ring
      const rxInner = Math.max(0, bounds.width / 2 - tolerance)
      const ryInner = Math.max(0, bounds.height / 2 - tolerance)
      if (rxInner === 0 || ryInner === 0) return outside <= 1
      const dxInner = (testX - cx) / rxInner
      const dyInner = (testY - cy) / ryInner
      return outside <= 1 && dxInner * dxInner + dyInner * dyInner >= 1
    }
    case "diamond": {
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      const hw = bounds.width / 2 + tolerance
      const hh = bounds.height / 2 + tolerance
      if (hw === 0 || hh === 0) return false
      const dx = Math.abs(testX - cx) / hw
      const dy = Math.abs(testY - cy) / hh
      if (el.style.fillColor !== "transparent") {
        return dx + dy <= 1
      }
      const hwInner = Math.max(0, bounds.width / 2 - tolerance)
      const hhInner = Math.max(0, bounds.height / 2 - tolerance)
      if (hwInner === 0 || hhInner === 0) return dx + dy <= 1
      const dxInner = Math.abs(testX - cx) / hwInner
      const dyInner = Math.abs(testY - cy) / hhInner
      return dx + dy <= 1 && dxInner + dyInner >= 1
    }
    default: {
      // Rectangle, text, sticky, image - bounding box check
      const t = tolerance
      if (el.style.fillColor !== "transparent" || el.type === "text" || el.type === "sticky" || el.type === "image") {
        return (
          testX >= bounds.x - t &&
          testX <= bounds.x + bounds.width + t &&
          testY >= bounds.y - t &&
          testY <= bounds.y + bounds.height + t
        )
      }
      // Stroke-only rectangle
      return (
        testX >= bounds.x - t && testX <= bounds.x + bounds.width + t &&
        testY >= bounds.y - t && testY <= bounds.y + bounds.height + t &&
        !(
          testX >= bounds.x + t && testX <= bounds.x + bounds.width - t &&
          testY >= bounds.y + t && testY <= bounds.y + bounds.height - t
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

function pointNearBezier(px: number, py: number, start: Point, control: Point, end: Point, threshold: number): boolean {
  // Sample the bezier curve and check distance to segments
  const steps = 20
  let prevX = start.x
  let prevY = start.y
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const invT = 1 - t
    const bx = invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x
    const by = invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y
    if (pointNearLine(px, py, { x: prevX, y: prevY }, { x: bx, y: by }, threshold)) {
      return true
    }
    prevX = bx
    prevY = by
  }
  return false
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

  // If element is rotated, inverse-rotate the test point
  let testX = px
  let testY = py
  if (el.rotation !== 0) {
    const center = getElementCenter(el)
    const unrotated = rotatePoint(px, py, center.x, center.y, -el.rotation)
    testX = unrotated.x
    testY = unrotated.y
  }

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
      Math.abs(testX - h.x) <= handleSize &&
      Math.abs(testY - h.y) <= handleSize
    ) {
      return h.handle
    }
  }
  return null
}

// ── Rotation Handle Hit Test ────────────────────────────────────

const ROTATION_HANDLE_OFFSET = 24

export function getRotationHandleAtPoint(
  px: number,
  py: number,
  el: BoardElement,
  camera: Camera
): boolean {
  // Don't show rotation handles for lines/arrows/draw
  if (el.type === "line" || el.type === "arrow" || el.type === "draw") return false

  const bounds = getElementBounds(el)
  const center = getElementCenter(el)
  const handleSize = HANDLE_SIZE / camera.zoom
  const offset = ROTATION_HANDLE_OFFSET / camera.zoom

  // Rotation handle is above top-center, then rotated
  let handleX = bounds.x + bounds.width / 2
  let handleY = bounds.y - offset

  if (el.rotation !== 0) {
    const rotated = rotatePoint(handleX, handleY, center.x, center.y, el.rotation)
    handleX = rotated.x
    handleY = rotated.y
  }

  return Math.abs(px - handleX) <= handleSize && Math.abs(py - handleY) <= handleSize
}

// ── Arrow Control Point Handle Hit Test ─────────────────────────

export function getArrowControlHandleAtPoint(
  px: number,
  py: number,
  el: BoardElement,
  camera: Camera
): boolean {
  if (el.type !== "arrow" || el.points.length < 2) return false
  if (!el.controlPointOffset || (el.controlPointOffset.x === 0 && el.controlPointOffset.y === 0)) return false

  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const cpx = (start.x + end.x) / 2 + el.controlPointOffset.x
  const cpy = (start.y + end.y) / 2 + el.controlPointOffset.y
  const handleSize = HANDLE_SIZE / camera.zoom

  return Math.abs(px - cpx) <= handleSize && Math.abs(py - cpy) <= handleSize
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
    if (el.type === "line" || el.type === "arrow" || el.type === "draw" || el.type === "text" || el.type === "image") continue
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
  activeConnectionPoint: { elementId: string; side: ConnectionSide } | null = null,
  smartGuides: SmartGuide[] = []
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

  // Draw smart guides
  if (smartGuides.length > 0) {
    drawSmartGuides(ctx, smartGuides, camera, canvasWidth, canvasHeight)
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

  // Apply rotation transform
  if (el.rotation !== 0) {
    const center = getElementCenter(el)
    ctx.translate(center.x, center.y)
    ctx.rotate(el.rotation)
    ctx.translate(-center.x, -center.y)
  }

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
    case "image":
      drawImage(ctx, el)
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
  ctx.font = buildFontString(el.style)
  ctx.fillStyle = el.style.textColor || getThemeTextColor()
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

function drawArrowhead(ctx: CanvasRenderingContext2D, tip: Point, angle: number, headLen: number, color: string) {
  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.lineTo(
    tip.x - headLen * Math.cos(angle - Math.PI / 6),
    tip.y - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    tip.x - headLen * Math.cos(angle + Math.PI / 6),
    tip.y - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawArrow(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.points.length < 2) return

  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const hasCurve = el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)
  const headLen = 12 + el.style.strokeWidth * 2

  if (hasCurve) {
    // Draw quadratic bezier curve
    const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
    const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(cpx, cpy, end.x, end.y)
    ctx.stroke()

    // End arrowhead: tangent at t=1 for quadratic bezier is direction from control point to end
    const endAngle = Math.atan2(end.y - cpy, end.x - cpx)
    drawArrowhead(ctx, end, endAngle, headLen, el.style.strokeColor)

    // Bidirectional: start arrowhead
    if (el.bidirectional) {
      const startAngle = Math.atan2(start.y - cpy, start.x - cpx)
      drawArrowhead(ctx, start, startAngle, headLen, el.style.strokeColor)
    }
  } else {
    // Draw straight line
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i].x, el.points[i].y)
    }
    ctx.stroke()

    // End arrowhead
    const prev = el.points[el.points.length - 2]
    const endAngle = Math.atan2(end.y - prev.y, end.x - prev.x)
    drawArrowhead(ctx, end, endAngle, headLen, el.style.strokeColor)

    // Bidirectional: start arrowhead
    if (el.bidirectional) {
      const next = el.points[1]
      const startAngle = Math.atan2(start.y - next.y, start.x - next.x)
      drawArrowhead(ctx, start, startAngle, headLen, el.style.strokeColor)
    }
  }

  // Draw label
  if (el.label) {
    const midX = hasCurve
      ? ((start.x + end.x) / 2 + (start.x + end.x) / 2 + el.controlPointOffset!.x * 2) / 2
      : (start.x + end.x) / 2
    const midY = hasCurve
      ? ((start.y + end.y) / 2 + (start.y + end.y) / 2 + el.controlPointOffset!.y * 2) / 2
      : (start.y + end.y) / 2

    // For bezier, use the actual midpoint on the curve (t=0.5)
    let labelX = midX
    let labelY = midY
    if (hasCurve) {
      const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
      const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y
      labelX = 0.25 * start.x + 0.5 * cpx + 0.25 * end.x
      labelY = 0.25 * start.y + 0.5 * cpy + 0.25 * end.y
    }

    ctx.save()
    ctx.font = buildFontString(el.style)
    const metrics = ctx.measureText(el.label)
    const textW = metrics.width + 8
    const textH = el.style.fontSize + 6

    ctx.fillStyle = getThemeCanvasBg()
    ctx.globalAlpha = 0.85
    ctx.fillRect(labelX - textW / 2, labelY - textH / 2, textW, textH)
    ctx.globalAlpha = 1

    ctx.fillStyle = getThemeTextColor()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(el.label, labelX, labelY)
    ctx.restore()
  }
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
  ctx.font = buildFontString(el.style)
  // Use textColor if set, otherwise stroke color, otherwise theme text color
  ctx.fillStyle = el.style.textColor || (el.style.strokeColor === "transparent" ? getThemeTextColor() : el.style.strokeColor)
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
    ctx.font = buildFontString(el.style)
    ctx.fillStyle = el.style.textColor || "#1e1e1e"
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
  const center = getElementCenter(el)

  ctx.save()

  // Apply rotation for selection outline and handles
  if (el.rotation !== 0) {
    ctx.translate(center.x, center.y)
    ctx.rotate(el.rotation)
    ctx.translate(-center.x, -center.y)
  }

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
  if (el.type === "line" || el.type === "arrow" || el.type === "draw") {
    // For arrows with control point, draw the control handle
    if (el.type === "arrow" && el.points.length >= 2) {
      ctx.restore()
      // Draw outside rotation context since arrows use world coordinates
      drawArrowControlHandle(ctx, el, camera)
      return
    }
    ctx.restore()
    return
  }

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

  // Rotation handle: above top-center
  const rotHandleOffset = ROTATION_HANDLE_OFFSET / camera.zoom
  const rotHandleX = bounds.x + bounds.width / 2
  const rotHandleY = bounds.y - rotHandleOffset

  // Line from top-center to rotation handle
  ctx.beginPath()
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1 / camera.zoom
  ctx.moveTo(bounds.x + bounds.width / 2, bounds.y - padding)
  ctx.lineTo(rotHandleX, rotHandleY)
  ctx.stroke()

  // Rotation handle circle
  const rotRadius = 5 / camera.zoom
  ctx.beginPath()
  ctx.arc(rotHandleX, rotHandleY, rotRadius, 0, Math.PI * 2)
  ctx.fillStyle = "#FFFFFF"
  ctx.fill()
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1.5 / camera.zoom
  ctx.stroke()

  ctx.restore()
}

function drawArrowControlHandle(
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  camera: Camera
) {
  if (el.points.length < 2) return
  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const offset = el.controlPointOffset || { x: 0, y: 0 }
  const cpx = (start.x + end.x) / 2 + offset.x
  const cpy = (start.y + end.y) / 2 + offset.y

  const handleSize = 6 / camera.zoom

  // Draw a small diamond handle
  ctx.beginPath()
  ctx.moveTo(cpx, cpy - handleSize)
  ctx.lineTo(cpx + handleSize, cpy)
  ctx.lineTo(cpx, cpy + handleSize)
  ctx.lineTo(cpx - handleSize, cpy)
  ctx.closePath()
  ctx.fillStyle = "#FFFFFF"
  ctx.fill()
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1.5 / camera.zoom
  ctx.stroke()
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

// ── Draw Image Element ───────────────────────────────────────────

function drawImage(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (!el.imageData) return

  let img = imageCache.get(el.id)
  if (!img) {
    img = new Image()
    img.src = el.imageData
    imageCache.set(el.id, img)
    // Re-render when loaded (the render loop will pick it up)
    img.onload = () => {
      // Image will be drawn on next render cycle
    }
  }

  if (img.complete && img.naturalWidth > 0) {
    const x = Math.min(el.x, el.x + el.width)
    const y = Math.min(el.y, el.y + el.height)
    const w = Math.abs(el.width)
    const h = Math.abs(el.height)
    ctx.drawImage(img, x, y, w, h)
  }
}

// ── SVG Export ───────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function svgStrokeDasharray(style: ElementStyle): string {
  if (style.strokeStyle === "dashed") return `stroke-dasharray="8 4"`
  if (style.strokeStyle === "dotted") return `stroke-dasharray="2 4"`
  return ""
}

function svgTransform(el: BoardElement): string {
  if (el.rotation === 0) return ""
  const center = getElementCenter(el)
  const deg = (el.rotation * 180) / Math.PI
  return `transform="rotate(${deg} ${center.x} ${center.y})"`
}

function svgFontString(style: ElementStyle): string {
  const family = FONT_FAMILY_MAP[style.fontFamily] || style.fontFamily
  return `font-family="${escapeXml(family)}" font-size="${style.fontSize}" font-weight="${style.fontWeight || "normal"}" font-style="${style.fontStyle || "normal"}"`
}

function elementToSvg(el: BoardElement): string {
  const { style } = el
  const opacity = style.opacity !== 1 ? `opacity="${style.opacity}"` : ""
  const dash = svgStrokeDasharray(style)
  const transform = svgTransform(el)
  const strokeAttr = style.strokeColor !== "transparent" ? `stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"` : `stroke="none"`
  const fillAttr = style.fillColor !== "transparent" ? `fill="${style.fillColor}"` : `fill="none"`

  switch (el.type) {
    case "rectangle": {
      const x = Math.min(el.x, el.x + el.width)
      const y = Math.min(el.y, el.y + el.height)
      const w = Math.abs(el.width)
      const h = Math.abs(el.height)
      let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${style.borderRadius}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        svg += svgTextBlock(el, x, y, w, h)
      }
      return svg
    }
    case "ellipse": {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      const rx = Math.abs(el.width) / 2
      const ry = Math.abs(el.height) / 2
      let svg = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        const x = Math.min(el.x, el.x + el.width)
        const y = Math.min(el.y, el.y + el.height)
        svg += svgTextBlock(el, x, y, Math.abs(el.width), Math.abs(el.height))
      }
      return svg
    }
    case "diamond": {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      const hw = Math.abs(el.width) / 2
      const hh = Math.abs(el.height) / 2
      const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
      let svg = `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${dash} ${opacity} ${transform} />`
      if (el.text) {
        const x = Math.min(el.x, el.x + el.width)
        const y = Math.min(el.y, el.y + el.height)
        svg += svgTextBlock(el, x, y, Math.abs(el.width), Math.abs(el.height))
      }
      return svg
    }
    case "line": {
      if (el.points.length < 2) return ""
      const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ")
      return `<polyline points="${pts}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`
    }
    case "arrow": {
      if (el.points.length < 2) return ""
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      const hasCurve = el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)
      const headLen = 12 + style.strokeWidth * 2

      let pathD: string
      let endAngle: number
      let startAngle: number

      if (hasCurve) {
        const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
        const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y
        pathD = `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`
        endAngle = Math.atan2(end.y - cpy, end.x - cpx)
        startAngle = Math.atan2(start.y - cpy, start.x - cpx)
      } else {
        pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        endAngle = Math.atan2(end.y - start.y, end.x - start.x)
        startAngle = Math.atan2(start.y - end.y, start.x - end.x)
      }

      let svg = `<path d="${pathD}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`

      // End arrowhead
      const endHead = arrowheadSvg(end, endAngle, headLen, style.strokeColor)
      svg += endHead

      // Bidirectional arrowhead
      if (el.bidirectional) {
        svg += arrowheadSvg(start, startAngle, headLen, style.strokeColor)
      }

      return svg
    }
    case "draw": {
      if (el.points.length < 2) return ""
      let d = `M ${el.points[0].x} ${el.points[0].y}`
      for (let i = 1; i < el.points.length - 1; i++) {
        const xc = (el.points[i].x + el.points[i + 1].x) / 2
        const yc = (el.points[i].y + el.points[i + 1].y) / 2
        d += ` Q ${el.points[i].x} ${el.points[i].y} ${xc} ${yc}`
      }
      const last = el.points[el.points.length - 1]
      d += ` L ${last.x} ${last.y}`
      return `<path d="${d}" fill="none" ${strokeAttr} ${dash} ${opacity} ${transform} stroke-linecap="round" stroke-linejoin="round" />`
    }
    case "text": {
      if (!el.text) return ""
      const textColor = style.textColor || (style.strokeColor === "transparent" ? "#1e1e1e" : style.strokeColor)
      const lines = el.text.split("\n")
      const lineHeight = style.fontSize * 1.3
      let anchor = "start"
      let textX = el.x
      if (style.textAlign === "center") { anchor = "middle"; textX = el.x + el.width / 2 }
      else if (style.textAlign === "right") { anchor = "end"; textX = el.x + el.width }

      let svg = `<text x="${textX}" y="${el.y + style.fontSize}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${opacity} ${transform}>`
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
        } else {
          svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
        }
      }
      svg += `</text>`
      return svg
    }
    case "sticky": {
      const r = style.borderRadius
      const x = el.x
      const y = el.y
      const w = el.width
      const h = el.height
      let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${style.fillColor}" ${strokeAttr} ${opacity} ${transform} />`
      if (el.text) {
        const textColor = style.textColor || "#1e1e1e"
        const padding = 12
        const lineHeight = style.fontSize * 1.4
        const lines = el.text.split("\n")
        let anchor = "start"
        let textX = x + padding
        if (style.textAlign === "center") { anchor = "middle"; textX = x + w / 2 }
        else if (style.textAlign === "right") { anchor = "end"; textX = x + w - padding }

        svg += `<text x="${textX}" y="${y + padding + style.fontSize}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${opacity} ${transform}>`
        for (let i = 0; i < lines.length; i++) {
          if (i === 0) {
            svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
          } else {
            svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
          }
        }
        svg += `</text>`
      }
      return svg
    }
    case "image": {
      if (!el.imageData) return ""
      const x = Math.min(el.x, el.x + el.width)
      const y = Math.min(el.y, el.y + el.height)
      const w = Math.abs(el.width)
      const h = Math.abs(el.height)
      return `<image href="${el.imageData}" x="${x}" y="${y}" width="${w}" height="${h}" ${opacity} ${transform} />`
    }
    default:
      return ""
  }
}

function arrowheadSvg(tip: Point, angle: number, headLen: number, color: string): string {
  const p1x = tip.x - headLen * Math.cos(angle - Math.PI / 6)
  const p1y = tip.y - headLen * Math.sin(angle - Math.PI / 6)
  const p2x = tip.x - headLen * Math.cos(angle + Math.PI / 6)
  const p2y = tip.y - headLen * Math.sin(angle + Math.PI / 6)
  return `<polygon points="${tip.x},${tip.y} ${p1x},${p1y} ${p2x},${p2y}" fill="${color}" />`
}

function svgTextBlock(el: BoardElement, x: number, y: number, w: number, h: number): string {
  const { style } = el
  const textColor = style.textColor || "#1e1e1e"
  const padding = 8
  const lineHeight = style.fontSize * 1.3
  const lines = el.text.split("\n")
  const totalTextHeight = lines.length * lineHeight
  const startY = y + Math.max(padding, (h - totalTextHeight) / 2) + style.fontSize

  let anchor = "start"
  let textX = x + padding
  if (style.textAlign === "center") { anchor = "middle"; textX = x + w / 2 }
  else if (style.textAlign === "right") { anchor = "end"; textX = x + w - padding }

  const transform = svgTransform(el)
  let svg = `<text x="${textX}" y="${startY}" ${svgFontString(style)} fill="${textColor}" text-anchor="${anchor}" ${transform}>`
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      svg += `<tspan x="${textX}" dy="0">${escapeXml(lines[i])}</tspan>`
    } else {
      svg += `<tspan x="${textX}" dy="${lineHeight}">${escapeXml(lines[i])}</tspan>`
    }
  }
  svg += `</text>`
  return svg
}

export function exportBoardToSvg(elements: BoardElement[], padding = 20): string {
  if (elements.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#ffffff"/>
  <text x="200" y="150" text-anchor="middle" fill="#999999" font-size="16" font-family="sans-serif">Empty board</text>
</svg>`
  }

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
  const vbX = minX - padding
  const vbY = minY - padding

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${width} ${height}" width="${width}" height="${height}">\n`
  svg += `  <rect x="${vbX}" y="${vbY}" width="${width}" height="${height}" fill="#ffffff"/>\n`

  for (const el of elements) {
    svg += `  ${elementToSvg(el)}\n`
  }

  svg += `</svg>`
  return svg
}

// ── Smart Guides ─────────────────────────────────────────────────

export function computeSmartGuides(
  movingIds: string[],
  allElements: BoardElement[],
  camera: Camera
): SmartGuide[] {
  const threshold = 5 / camera.zoom
  const guides: SmartGuide[] = []
  const movingSet = new Set(movingIds)

  // Collect edges and centers of non-moving elements
  const staticEdges: { orientation: "horizontal" | "vertical"; value: number }[] = []
  for (const el of allElements) {
    if (movingSet.has(el.id)) continue
    const b = getElementBounds(el)
    // Vertical guide lines (x positions)
    staticEdges.push({ orientation: "vertical", value: b.x })
    staticEdges.push({ orientation: "vertical", value: b.x + b.width })
    staticEdges.push({ orientation: "vertical", value: b.x + b.width / 2 })
    // Horizontal guide lines (y positions)
    staticEdges.push({ orientation: "horizontal", value: b.y })
    staticEdges.push({ orientation: "horizontal", value: b.y + b.height })
    staticEdges.push({ orientation: "horizontal", value: b.y + b.height / 2 })
  }

  // Check moving elements against static edges
  for (const id of movingIds) {
    const el = allElements.find((e) => e.id === id)
    if (!el) continue
    const b = getElementBounds(el)

    const movingVerticals = [b.x, b.x + b.width, b.x + b.width / 2]
    const movingHorizontals = [b.y, b.y + b.height, b.y + b.height / 2]

    for (const edge of staticEdges) {
      if (edge.orientation === "vertical") {
        for (const mv of movingVerticals) {
          if (Math.abs(mv - edge.value) < threshold) {
            // Avoid duplicate guides
            if (!guides.some((g) => g.orientation === "vertical" && Math.abs(g.position - edge.value) < 0.5)) {
              guides.push({ orientation: "vertical", position: edge.value, snappedTo: edge.value })
            }
          }
        }
      } else {
        for (const mh of movingHorizontals) {
          if (Math.abs(mh - edge.value) < threshold) {
            if (!guides.some((g) => g.orientation === "horizontal" && Math.abs(g.position - edge.value) < 0.5)) {
              guides.push({ orientation: "horizontal", position: edge.value, snappedTo: edge.value })
            }
          }
        }
      }
    }
  }

  return guides
}

export function drawSmartGuides(
  ctx: CanvasRenderingContext2D,
  guides: SmartGuide[],
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
) {
  if (guides.length === 0) return

  ctx.save()
  ctx.strokeStyle = "#3B82F6"
  ctx.lineWidth = 1 / camera.zoom
  ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom])

  const topLeft = screenToWorld(0, 0, camera)
  const bottomRight = screenToWorld(canvasWidth, canvasHeight, camera)

  for (const guide of guides) {
    ctx.beginPath()
    if (guide.orientation === "vertical") {
      ctx.moveTo(guide.position, topLeft.y)
      ctx.lineTo(guide.position, bottomRight.y)
    } else {
      ctx.moveTo(topLeft.x, guide.position)
      ctx.lineTo(bottomRight.x, guide.position)
    }
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.restore()
}
