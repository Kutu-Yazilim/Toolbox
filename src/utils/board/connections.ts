import type {
  BoardElement,
  ArrowElement,
  Camera,
  Point,
  ConnectionSide,
} from "@/types/board"
import { getElementBounds } from "./transforms"
import { CONNECTION_THRESHOLD } from "./constants"

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
  const threshold = CONNECTION_THRESHOLD / camera.zoom
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
  if (arrow.type !== "arrow") return arrow
  if (arrow.points.length < 2) return arrow
  const arrowEl = arrow as ArrowElement
  const newPoints: [Point, Point] = [{ ...arrowEl.points[0] }, { ...arrowEl.points[1] }]
  if (arrowEl.startConnection) {
    const el = elements.find((e) => e.id === arrowEl.startConnection!.elementId)
    if (el) {
      newPoints[0] = getConnectionPoint(el, arrowEl.startConnection!.side)
    }
  }
  if (arrowEl.endConnection) {
    const el = elements.find((e) => e.id === arrowEl.endConnection!.elementId)
    if (el) {
      newPoints[1] = getConnectionPoint(el, arrowEl.endConnection!.side)
    }
  }
  return { ...arrowEl, points: newPoints }
}
