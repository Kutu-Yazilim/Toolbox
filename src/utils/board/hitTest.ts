import type {
  BoardElement,
  Camera,
  Point,
  Bounds,
  ResizeHandle,
} from "@/types/board"
import { getElementBounds, getElementCenter, rotatePoint } from "./transforms"
import {
  HANDLE_SIZE,
  ROTATION_HANDLE_OFFSET,
  HIT_TEST_TOLERANCE,
  BEZIER_SAMPLE_STEPS,
} from "./constants"

// ── Hit Testing ─────────────────────────────────────────────────

export function pointInElement(px: number, py: number, el: BoardElement, tolerance = HIT_TEST_TOLERANCE): boolean {
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
      const drawTolerance = 2
      for (let i = 0; i < el.points.length - 1; i++) {
        if (pointNearLine(testX, testY, el.points[i], el.points[i + 1], tolerance + el.style.strokeWidth + drawTolerance)) {
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
    case "group": {
      // Groups use bounding box hit test (filled)
      const t = tolerance
      return (
        testX >= bounds.x - t &&
        testX <= bounds.x + bounds.width + t &&
        testY >= bounds.y - t &&
        testY <= bounds.y + bounds.height + t
      )
    }
    case "rectangle":
    case "text":
    case "sticky":
    case "image": {
      // Bounding box check
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

export function pointNearLine(px: number, py: number, a: Point, b: Point, threshold: number): boolean {
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

export function pointNearBezier(px: number, py: number, start: Point, control: Point, end: Point, threshold: number): boolean {
  // Sample the bezier curve and check distance to segments
  let prevX = start.x
  let prevY = start.y
  for (let i = 1; i <= BEZIER_SAMPLE_STEPS; i++) {
    const t = i / BEZIER_SAMPLE_STEPS
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
  if (el.type !== "arrow") return false
  if (el.points.length < 2) return false
  if (!el.controlPointOffset || (el.controlPointOffset.x === 0 && el.controlPointOffset.y === 0)) return false

  const start = el.points[0]
  const end = el.points[el.points.length - 1]
  const cpx = (start.x + end.x) / 2 + el.controlPointOffset.x
  const cpy = (start.y + end.y) / 2 + el.controlPointOffset.y
  const handleSize = HANDLE_SIZE / camera.zoom

  return Math.abs(px - cpx) <= handleSize && Math.abs(py - cpy) <= handleSize
}
