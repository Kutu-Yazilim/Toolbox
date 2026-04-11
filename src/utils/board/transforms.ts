import type {
  BoardElement,
  Camera,
  Point,
  Bounds,
  ResizeHandle,
  ElementStyle,
  ElementType,
} from "@/types/board"
import {
  DEFAULT_STYLE,
  getThemeStrokeColor,
  getThemeFillColor,
  getThemeTextColor,
} from "@/types/board"
import {
  TEXT_DEFAULT_WIDTH,
  TEXT_DEFAULT_HEIGHT,
  STICKY_MIN_SIZE,
  STICKY_DEFAULT_FILL,
  STICKY_DEFAULT_STROKE,
  STICKY_DEFAULT_STROKE_WIDTH,
  STICKY_FONT_SIZE,
  STICKY_DEFAULT_BORDER_RADIUS,
  RECTANGLE_DEFAULT_BORDER_RADIUS,
  IMAGE_DEFAULT_SIZE,
} from "./constants"

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

export function getElementCenter(el: BoardElement): Point {
  const bounds = getElementBounds(el)
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
}

export function rotatePoint(px: number, py: number, cx: number, cy: number, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = px - cx
  const dy = py - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
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

  const common = {
    id: generateElementId(),
    x,
    y,
    width: 0,
    height: 0,
    rotation: 0,
    locked: false,
    visible: true,
    name: null,
    groupId: null,
  }

  switch (type) {
    case "text":
      return {
        ...common,
        type: "text",
        width: TEXT_DEFAULT_WIDTH,
        height: TEXT_DEFAULT_HEIGHT,
        text: "",
        richText: [],
        style: { ...baseStyle, fillColor: "transparent", strokeColor: getThemeTextColor() },
      }
    case "sticky":
      return {
        ...common,
        type: "sticky",
        width: STICKY_MIN_SIZE,
        height: STICKY_MIN_SIZE,
        text: "",
        richText: [],
        stickyColor: STICKY_DEFAULT_FILL,
        style: {
          ...baseStyle,
          fillColor: STICKY_DEFAULT_FILL,
          strokeColor: STICKY_DEFAULT_STROKE,
          strokeWidth: STICKY_DEFAULT_STROKE_WIDTH,
          fontSize: STICKY_FONT_SIZE,
          borderRadius: STICKY_DEFAULT_BORDER_RADIUS,
        },
      }
    case "rectangle":
      return {
        ...common,
        type: "rectangle",
        text: "",
        borderRadius: RECTANGLE_DEFAULT_BORDER_RADIUS,
        style: { ...baseStyle, fillColor: themedFill, borderRadius: RECTANGLE_DEFAULT_BORDER_RADIUS },
      }
    case "ellipse":
      return {
        ...common,
        type: "ellipse",
        text: "",
        style: { ...baseStyle, fillColor: themedFill },
      }
    case "diamond":
      return {
        ...common,
        type: "diamond",
        text: "",
        style: { ...baseStyle, fillColor: themedFill },
      }
    case "line":
      return {
        ...common,
        type: "line",
        points: [{ x, y }, { x, y }],
        style: { ...baseStyle, fillColor: "transparent" },
      }
    case "arrow":
      return {
        ...common,
        type: "arrow",
        points: [{ x, y }, { x, y }],
        startConnection: null,
        endConnection: null,
        controlPointOffset: null,
        bidirectional: false,
        label: "",
        richLabel: [],
        style: { ...baseStyle, fillColor: "transparent" },
      }
    case "draw":
      return {
        ...common,
        type: "draw",
        points: [{ x, y }],
        style: { ...baseStyle, fillColor: "transparent" },
      }
    case "image":
      return {
        ...common,
        type: "image",
        width: IMAGE_DEFAULT_SIZE,
        height: IMAGE_DEFAULT_SIZE,
        imageData: "",
        style: { ...baseStyle, fillColor: "transparent", strokeColor: "transparent" },
      }
    case "group":
      return {
        ...common,
        type: "group",
        isGroup: true,
        childIds: [],
        style: { ...baseStyle, fillColor: "transparent", strokeColor: "transparent" },
      }
  }
}

// ── Resize Logic ────────────────────────────────────────────────

export function resizeElement(
  el: BoardElement,
  handle: ResizeHandle,
  dx: number,
  dy: number
): { x?: number; y?: number; width?: number; height?: number } {
  const updates: { x?: number; y?: number; width?: number; height?: number } = {}

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

// ── Snap to Grid ────────────────────────────────────────────────

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}
