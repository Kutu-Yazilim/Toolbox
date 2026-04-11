import type {
  BoardElement,
  Camera,
  Point,
  Bounds,
  SmartGuide,
} from "@/types/board"
import { getElementBounds } from "./transforms"
import { SNAP_THRESHOLD } from "./constants"

// ── Smart Guides ─────────────────────────────────────────────────

export function computeSmartGuides(
  movingIds: string[],
  allElements: BoardElement[],
  camera: Camera
): SmartGuide[] {
  const threshold = SNAP_THRESHOLD / camera.zoom
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
            const guideDedup = 0.5
            if (!guides.some((g) => g.orientation === "vertical" && Math.abs(g.position - edge.value) < guideDedup)) {
              guides.push({ orientation: "vertical", position: edge.value, snappedTo: edge.value })
            }
          }
        }
      } else {
        for (const mh of movingHorizontals) {
          if (Math.abs(mh - edge.value) < threshold) {
            const guideDedup = 0.5
            if (!guides.some((g) => g.orientation === "horizontal" && Math.abs(g.position - edge.value) < guideDedup)) {
              guides.push({ orientation: "horizontal", position: edge.value, snappedTo: edge.value })
            }
          }
        }
      }
    }
  }

  return guides
}

// ── Element-to-Element Snapping ─────────────────────────────────

export function computeElementSnap(
  movingBounds: Bounds,
  otherElements: BoardElement[],
  camera: Camera,
  gridSize: number | null,
): { snappedPosition: Point; guides: SmartGuide[] } {
  const threshold = SNAP_THRESHOLD / camera.zoom
  const guides: SmartGuide[] = []
  let snapX = movingBounds.x
  let snapY = movingBounds.y

  // Grid snapping
  if (gridSize !== null) {
    snapX = Math.round(snapX / gridSize) * gridSize
    snapY = Math.round(snapY / gridSize) * gridSize
    return { snappedPosition: { x: snapX, y: snapY }, guides: [] }
  }

  // Element-to-element snapping
  const movingCenterX = movingBounds.x + movingBounds.width / 2
  const movingCenterY = movingBounds.y + movingBounds.height / 2
  const movingRight = movingBounds.x + movingBounds.width
  const movingBottom = movingBounds.y + movingBounds.height

  let bestDxAbs = threshold
  let bestDyAbs = threshold
  let bestDx = 0
  let bestDy = 0

  for (const el of otherElements) {
    if (!el.visible || el.locked) continue
    const b = getElementBounds(el)

    const otherCenterX = b.x + b.width / 2
    const otherCenterY = b.y + b.height / 2
    const otherRight = b.x + b.width
    const otherBottom = b.y + b.height

    // Vertical snap targets (x positions)
    const xPairs: [number, number][] = [
      [movingBounds.x, b.x],
      [movingBounds.x, otherRight],
      [movingBounds.x, otherCenterX],
      [movingRight, b.x],
      [movingRight, otherRight],
      [movingRight, otherCenterX],
      [movingCenterX, otherCenterX],
      [movingCenterX, b.x],
      [movingCenterX, otherRight],
    ]

    for (const [from, to] of xPairs) {
      const diff = to - from
      if (Math.abs(diff) < bestDxAbs) {
        bestDxAbs = Math.abs(diff)
        bestDx = diff
        // Add guide only for the best match
        const existingIdx = guides.findIndex((g) => g.orientation === "vertical")
        const guide: SmartGuide = { orientation: "vertical", position: to, snappedTo: to }
        if (existingIdx >= 0) {
          guides[existingIdx] = guide
        } else {
          guides.push(guide)
        }
      }
    }

    // Horizontal snap targets (y positions)
    const yPairs: [number, number][] = [
      [movingBounds.y, b.y],
      [movingBounds.y, otherBottom],
      [movingBounds.y, otherCenterY],
      [movingBottom, b.y],
      [movingBottom, otherBottom],
      [movingBottom, otherCenterY],
      [movingCenterY, otherCenterY],
      [movingCenterY, b.y],
      [movingCenterY, otherBottom],
    ]

    for (const [from, to] of yPairs) {
      const diff = to - from
      if (Math.abs(diff) < bestDyAbs) {
        bestDyAbs = Math.abs(diff)
        bestDy = diff
        const existingIdx = guides.findIndex((g) => g.orientation === "horizontal")
        const guide: SmartGuide = { orientation: "horizontal", position: to, snappedTo: to }
        if (existingIdx >= 0) {
          guides[existingIdx] = guide
        } else {
          guides.push(guide)
        }
      }
    }
  }

  if (bestDxAbs < threshold) snapX = movingBounds.x + bestDx
  if (bestDyAbs < threshold) snapY = movingBounds.y + bestDy

  // Remove guides that didn't snap
  const finalGuides = guides.filter((g) => {
    if (g.orientation === "vertical") return bestDxAbs < threshold
    return bestDyAbs < threshold
  })

  return { snappedPosition: { x: snapX, y: snapY }, guides: finalGuides }
}
