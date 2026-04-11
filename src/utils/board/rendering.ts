import type {
  BoardElement,
  Camera,
  Point,
  ConnectionSide,
  ElementStyle,
  SmartGuide,
  Bounds,
  ArrowElement,
  RectangleElement,
  DrawElement,
  LineElement,
} from "@/types/board"
import {
  getThemeCanvasBg,
  getThemeTextColor,
} from "@/types/board"
import { getElementBounds, getElementCenter, screenToWorld } from "./transforms"
import { getConnectionPoints } from "./connections"
import {
  HANDLE_SIZE,
  ROTATION_HANDLE_OFFSET,
  ROTATION_HANDLE_RADIUS,
  SELECTION_PADDING,
  SELECTION_LINE_WIDTH,
  SELECTION_COLOR,
  SELECTION_BOX_FILL,
  SELECTION_BOX_DASH,
  VIEWPORT_MARGIN,
  GRID_LINE_OPACITY,
  ARROW_HEAD_BASE_SIZE,
  ARROW_HEAD_STROKE_MULTIPLIER,
  ARROWHEAD_ANGLE,
  TEXT_PADDING,
  STICKY_PADDING,
  LINE_HEIGHT_MULTIPLIER,
  STICKY_LINE_HEIGHT_MULTIPLIER,
  DASH_PATTERN,
  DOT_PATTERN,
  SMART_GUIDE_DASH,
  GROUP_DASH_ON,
  GROUP_DASH_OFF,
  ARROW_CONTROL_HANDLE_SIZE,
  ARROW_LABEL_PADDING_X,
  ARROW_LABEL_PADDING_Y,
  ARROW_LABEL_BG_OPACITY,
  STICKY_SHADOW_COLOR,
  STICKY_SHADOW_BLUR,
  STICKY_SHADOW_OFFSET_X,
  STICKY_SHADOW_OFFSET_Y,
  FONT_FAMILY_MAP,
  CONNECTION_POINT_RADIUS,
} from "./constants"

// ── Font ────────────────────────────────────────────────────────

export function buildFontString(style: ElementStyle): string {
  const family = FONT_FAMILY_MAP[style.fontFamily] || style.fontFamily
  return `${style.fontStyle || "normal"} ${style.fontWeight || "normal"} ${style.fontSize}px ${family}`
}

// ── Image Cache ──────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement>()

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

  // Viewport culling: calculate visible area in world coordinates
  const vpTopLeft = screenToWorld(0, 0, camera)
  const vpBottomRight = screenToWorld(canvasWidth, canvasHeight, camera)
  const vpMargin = VIEWPORT_MARGIN / camera.zoom

  // Draw elements (with viewport culling)
  for (const el of elements) {
    if (!el.visible) continue
    const b = getElementBounds(el)
    // Skip elements entirely outside viewport
    if (
      b.x + b.width < vpTopLeft.x - vpMargin ||
      b.x > vpBottomRight.x + vpMargin ||
      b.y + b.height < vpTopLeft.y - vpMargin ||
      b.y > vpBottomRight.y + vpMargin
    ) {
      continue
    }
    drawElement(ctx, el)
  }

  // Draw preview element (being created)
  if (previewElement) {
    ctx.globalAlpha = 0.6
    drawElement(ctx, previewElement)
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
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = 1 / camera.zoom
    ctx.fillStyle = SELECTION_BOX_FILL
    ctx.setLineDash([SELECTION_BOX_DASH[0] / camera.zoom, SELECTION_BOX_DASH[1] / camera.zoom])
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

  ctx.strokeStyle = GRID_LINE_OPACITY
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

export function drawElement(ctx: CanvasRenderingContext2D, el: BoardElement) {
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
    ctx.setLineDash(DASH_PATTERN)
  } else if (el.style.strokeStyle === "dotted") {
    ctx.setLineDash(DOT_PATTERN)
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
    case "group":
      // Groups are transparent containers, children are drawn separately
      break
  }

  ctx.setLineDash([])
  ctx.restore()
}

function drawRectangle(ctx: CanvasRenderingContext2D, el: RectangleElement) {
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
    drawShapeText(ctx, el.style, el.text, x, y, w, h)
  }
}

function drawShapeText(ctx: CanvasRenderingContext2D, style: ElementStyle, text: string, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.font = buildFontString(style)
  ctx.fillStyle = style.textColor || getThemeTextColor()
  ctx.textAlign = style.textAlign
  ctx.textBaseline = "top"

  const maxWidth = w - TEXT_PADDING * 2
  if (maxWidth <= 0) { ctx.restore(); return }
  const lines = wrapText(ctx, text, maxWidth)
  const lineHeight = style.fontSize * LINE_HEIGHT_MULTIPLIER
  const totalTextHeight = lines.length * lineHeight
  const startY = y + Math.max(TEXT_PADDING, (h - totalTextHeight) / 2)

  let textX = x + TEXT_PADDING
  if (style.textAlign === "center") textX = x + w / 2
  else if (style.textAlign === "right") textX = x + w - TEXT_PADDING

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

  if (el.type === "ellipse" && el.text) {
    const x = Math.min(el.x, el.x + el.width)
    const y = Math.min(el.y, el.y + el.height)
    drawShapeText(ctx, el.style, el.text, x, y, Math.abs(el.width), Math.abs(el.height))
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

  if (el.type === "diamond" && el.text) {
    const x = Math.min(el.x, el.x + el.width)
    const y = Math.min(el.y, el.y + el.height)
    drawShapeText(ctx, el.style, el.text, x, y, Math.abs(el.width), Math.abs(el.height))
  }
}

function drawLine(ctx: CanvasRenderingContext2D, el: LineElement) {
  if (el.points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(el.points[0].x, el.points[0].y)
  ctx.lineTo(el.points[1].x, el.points[1].y)
  ctx.stroke()
}

function drawArrowhead(ctx: CanvasRenderingContext2D, tip: Point, angle: number, headLen: number, color: string) {
  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.lineTo(
    tip.x - headLen * Math.cos(angle - ARROWHEAD_ANGLE),
    tip.y - headLen * Math.sin(angle - ARROWHEAD_ANGLE)
  )
  ctx.lineTo(
    tip.x - headLen * Math.cos(angle + ARROWHEAD_ANGLE),
    tip.y - headLen * Math.sin(angle + ARROWHEAD_ANGLE)
  )
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawArrow(ctx: CanvasRenderingContext2D, el: ArrowElement) {
  if (el.points.length < 2) return

  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const hasCurve = el.controlPointOffset && (el.controlPointOffset.x !== 0 || el.controlPointOffset.y !== 0)
  const headLen = ARROW_HEAD_BASE_SIZE + el.style.strokeWidth * ARROW_HEAD_STROKE_MULTIPLIER

  if (hasCurve) {
    const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
    const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(cpx, cpy, end.x, end.y)
    ctx.stroke()

    const endAngle = Math.atan2(end.y - cpy, end.x - cpx)
    drawArrowhead(ctx, end, endAngle, headLen, el.style.strokeColor)

    if (el.bidirectional) {
      const startAngle = Math.atan2(start.y - cpy, start.x - cpx)
      drawArrowhead(ctx, start, startAngle, headLen, el.style.strokeColor)
    }
  } else {
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    const endAngle = Math.atan2(end.y - start.y, end.x - start.x)
    drawArrowhead(ctx, end, endAngle, headLen, el.style.strokeColor)

    if (el.bidirectional) {
      const startAngle = Math.atan2(start.y - end.y, start.x - end.x)
      drawArrowhead(ctx, start, startAngle, headLen, el.style.strokeColor)
    }
  }

  // Draw label
  if (el.label) {
    let labelX: number
    let labelY: number
    if (hasCurve) {
      const cpx = (start.x + end.x) / 2 + el.controlPointOffset!.x
      const cpy = (start.y + end.y) / 2 + el.controlPointOffset!.y
      labelX = 0.25 * start.x + 0.5 * cpx + 0.25 * end.x
      labelY = 0.25 * start.y + 0.5 * cpy + 0.25 * end.y
    } else {
      labelX = (start.x + end.x) / 2
      labelY = (start.y + end.y) / 2
    }

    ctx.save()
    ctx.font = buildFontString(el.style)
    const metrics = ctx.measureText(el.label)
    const textW = metrics.width + ARROW_LABEL_PADDING_X
    const textH = el.style.fontSize + ARROW_LABEL_PADDING_Y

    ctx.fillStyle = getThemeCanvasBg()
    ctx.globalAlpha = ARROW_LABEL_BG_OPACITY
    ctx.fillRect(labelX - textW / 2, labelY - textH / 2, textW, textH)
    ctx.globalAlpha = 1

    ctx.fillStyle = getThemeTextColor()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(el.label, labelX, labelY)
    ctx.restore()
  }
}

function drawFreehand(ctx: CanvasRenderingContext2D, el: DrawElement) {
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
  if (el.type !== "text" || !el.text) return
  ctx.font = buildFontString(el.style)
  ctx.fillStyle = el.style.textColor || (el.style.strokeColor === "transparent" ? getThemeTextColor() : el.style.strokeColor)
  ctx.textAlign = el.style.textAlign
  ctx.textBaseline = "top"

  const lines = el.text.split("\n")
  const lineHeight = el.style.fontSize * LINE_HEIGHT_MULTIPLIER

  let textX = el.x
  if (el.style.textAlign === "center") textX = el.x + el.width / 2
  else if (el.style.textAlign === "right") textX = el.x + el.width

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textX, el.y + i * lineHeight)
  }
}

function drawSticky(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.type !== "sticky") return
  const r = el.style.borderRadius
  const x = el.x
  const y = el.y
  const w = el.width
  const h = el.height

  // Shadow
  ctx.shadowColor = STICKY_SHADOW_COLOR
  ctx.shadowBlur = STICKY_SHADOW_BLUR
  ctx.shadowOffsetX = STICKY_SHADOW_OFFSET_X
  ctx.shadowOffsetY = STICKY_SHADOW_OFFSET_Y

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

    const maxWidth = w - STICKY_PADDING * 2
    const lines = wrapText(ctx, el.text, maxWidth)
    const lineHeight = el.style.fontSize * STICKY_LINE_HEIGHT_MULTIPLIER

    let textX = x + STICKY_PADDING
    if (el.style.textAlign === "center") textX = x + w / 2
    else if (el.style.textAlign === "right") textX = x + w - STICKY_PADDING

    for (let i = 0; i < lines.length; i++) {
      const textY = y + STICKY_PADDING + i * lineHeight
      if (textY + lineHeight > y + h - STICKY_PADDING) break
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
  const padding = SELECTION_PADDING / camera.zoom
  const center = getElementCenter(el)

  ctx.save()

  // Apply rotation for selection outline and handles
  if (el.rotation !== 0) {
    ctx.translate(center.x, center.y)
    ctx.rotate(el.rotation)
    ctx.translate(-center.x, -center.y)
  }

  // Selection outline
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom
  if (el.type === "group") {
    // Dashed bounding box for groups
    ctx.setLineDash([GROUP_DASH_ON / camera.zoom, GROUP_DASH_OFF / camera.zoom])
  } else {
    ctx.setLineDash([])
  }
  ctx.strokeRect(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + padding * 2,
    bounds.height + padding * 2
  )
  ctx.setLineDash([])

  // Groups: draw handles but no rotation handle
  if (el.type === "group") {
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
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom
    for (const h of handles) {
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
      ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
    }
    ctx.restore()
    return
  }

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
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom

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
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = 1 / camera.zoom
  ctx.moveTo(bounds.x + bounds.width / 2, bounds.y - padding)
  ctx.lineTo(rotHandleX, rotHandleY)
  ctx.stroke()

  // Rotation handle circle
  const rotRadius = ROTATION_HANDLE_RADIUS / camera.zoom
  ctx.beginPath()
  ctx.arc(rotHandleX, rotHandleY, rotRadius, 0, Math.PI * 2)
  ctx.fillStyle = "#FFFFFF"
  ctx.fill()
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom
  ctx.stroke()

  ctx.restore()
}

function drawArrowControlHandle(
  ctx: CanvasRenderingContext2D,
  el: ArrowElement,
  camera: Camera
) {
  if (el.points.length < 2) return
  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const offset = el.controlPointOffset || { x: 0, y: 0 }
  const cpx = (start.x + end.x) / 2 + offset.x
  const cpy = (start.y + end.y) / 2 + offset.y

  const handleSize = ARROW_CONTROL_HANDLE_SIZE / camera.zoom

  // Draw a small diamond handle
  ctx.beginPath()
  ctx.moveTo(cpx, cpy - handleSize)
  ctx.lineTo(cpx + handleSize, cpy)
  ctx.lineTo(cpx, cpy + handleSize)
  ctx.lineTo(cpx - handleSize, cpy)
  ctx.closePath()
  ctx.fillStyle = "#FFFFFF"
  ctx.fill()
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom
  ctx.stroke()
}

function drawConnectionPoints(
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  camera: Camera,
  activePoint: { elementId: string; side: ConnectionSide } | null
) {
  const cps = getConnectionPoints(el)
  const dotSize = CONNECTION_POINT_RADIUS / camera.zoom

  for (const cp of cps) {
    const isActive = activePoint && activePoint.elementId === el.id && activePoint.side === cp.side
    ctx.beginPath()
    ctx.arc(cp.point.x, cp.point.y, dotSize, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? "#2563EB" : SELECTION_COLOR
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = SELECTION_LINE_WIDTH / camera.zoom
    ctx.stroke()
  }
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
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = 1 / camera.zoom
  ctx.setLineDash([SMART_GUIDE_DASH[0] / camera.zoom, SMART_GUIDE_DASH[1] / camera.zoom])

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

function drawImage(ctx: CanvasRenderingContext2D, el: BoardElement) {
  if (el.type !== "image" || !el.imageData) return

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
