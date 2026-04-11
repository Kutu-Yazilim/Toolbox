import type {
  BoardElement,
  Bounds,
} from "@/types/board"
import { getElementBounds } from "./transforms"

// ── Group Helpers ───────────────────────────────────────────────

/** Calculate bounding box of a group from its children */
export function computeGroupBounds(
  groupEl: BoardElement,
  allElements: BoardElement[]
): Bounds {
  const childIds = groupEl.type === "group" ? groupEl.childIds : []
  if (childIds.length === 0) return getElementBounds(groupEl)

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const cid of childIds) {
    const child = allElements.find((e) => e.id === cid)
    if (!child) continue
    const b = getElementBounds(child)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }

  if (minX === Infinity) return getElementBounds(groupEl)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Get nesting depth of a group (0 = top-level element) */
export function getGroupNestingDepth(
  elementId: string,
  allElements: BoardElement[]
): number {
  let depth = 0
  let current = allElements.find((e) => e.id === elementId)
  while (current?.groupId) {
    depth++
    current = allElements.find((e) => e.id === current!.groupId)
  }
  return depth
}

/** Get all descendant IDs of a group recursively */
export function getGroupDescendantIds(
  groupId: string,
  allElements: BoardElement[]
): string[] {
  const group = allElements.find((e) => e.id === groupId)
  if (!group || group.type !== "group") return []
  const result: string[] = []
  for (const cid of group.childIds) {
    result.push(cid)
    const child = allElements.find((e) => e.id === cid)
    if (child?.type === "group") {
      result.push(...getGroupDescendantIds(cid, allElements))
    }
  }
  return result
}

/** Sync all group elements' bounds to match their children */
export function syncAllGroupBounds(elements: BoardElement[]): BoardElement[] {
  return elements.map((el) => {
    if (el.type !== "group") return el
    const bounds = computeGroupBounds(el, elements)
    return { ...el, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  })
}
