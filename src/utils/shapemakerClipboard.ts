import type { ShapePath, ClipboardEntry, PathSegment } from "@/types/shapemaker"
import { translateSegments } from "./shapemakerTransform"

let idCounter = Date.now()
function uid(prefix = "id") {
  return `${prefix}_${++idCounter}_${Date.now().toString(36)}`
}

const PASTE_OFFSET = 10

export function copyToClipboard(paths: ShapePath[]): ClipboardEntry {
  return {
    paths: JSON.parse(JSON.stringify(paths)),
    pasteCount: 0,
  }
}

export function pasteFromClipboard(clipboard: ClipboardEntry): { paths: ShapePath[]; updatedClipboard: ClipboardEntry } {
  const newCount = clipboard.pasteCount + 1
  const offset = PASTE_OFFSET * newCount

  const paths = clipboard.paths.map((p) => ({
    ...JSON.parse(JSON.stringify(p)),
    id: uid("path"),
    name: `${p.name} copy`,
    segments: translateSegments(
      JSON.parse(JSON.stringify(p.segments)) as PathSegment[],
      offset,
      offset,
    ),
  }))

  return {
    paths,
    updatedClipboard: { ...clipboard, pasteCount: newCount },
  }
}

export function duplicatePath(path: ShapePath): ShapePath {
  return {
    ...JSON.parse(JSON.stringify(path)),
    id: uid("path"),
    name: `${path.name} copy`,
  }
}

export function duplicatePathWithOffset(path: ShapePath, dx: number, dy: number): ShapePath {
  const dup = duplicatePath(path)
  dup.segments = translateSegments(dup.segments, dx, dy)
  return dup
}
