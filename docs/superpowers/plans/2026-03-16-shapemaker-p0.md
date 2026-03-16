# ShapeMaker P0: Core Interactions & Transform System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shape-level selection, movement, rotation, scaling, copy/paste, and an interaction state machine to the ShapeMaker tool.

**Architecture:** Refactor into interaction layers — pure state machine + hit testing + transform utilities — replacing the ad-hoc mouse state in ShapeMakerCanvas. Moves bake into points; rotation stored separately.

**Tech Stack:** React 19, TypeScript 5.9, Canvas 2D API, Vite

**Spec:** `docs/superpowers/specs/2026-03-16-shapemaker-p0-design.md`

**Verification:** `tsc -b && npx vite build` (no test framework configured)

---

## Chunk 1: Types & Transform Utilities

### Task 1: Extend type definitions

**Files:**
- Modify: `src/types/shapemaker.ts`

- [ ] **Step 1: Add new types to shapemaker.ts**

Add these types after the existing `CloseSegment` / `PathSegment` section, before the Paint styles section:

```typescript
// ─── Transform ─────────────────────────────────────────────────

export type ShapeTransform = {
  rotation: number   // radians, around bounding box center
  scaleX: number     // 1.0 = no scale
  scaleY: number
}

export const DEFAULT_TRANSFORM: ShapeTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
}

// ─── Bounding box (computed, not stored) ───────────────────────

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

// ─── Handle positions for resize ───────────────────────────────

export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

// ─── Editing mode ──────────────────────────────────────────────

export type EditingMode = "shape" | "node"

// ─── Interaction state machine ─────────────────────────────────

export type InteractionState =
  | { type: "idle" }
  | { type: "shape-selected"; pathId: string; mode: EditingMode }
  | { type: "dragging-shape"; pathId: string; startPoint: Point; originalSegments: PathSegment[] }
  | { type: "rotating"; pathId: string; center: Point; startAngle: number; originalRotation: number }
  | {
      type: "resizing"
      pathId: string
      handle: HandlePosition
      anchor: Point
      originalBBox: BoundingBox
      originalSegments: PathSegment[]
      originalTransform: ShapeTransform
    }
  | { type: "dragging-node"; selectedPoint: SelectedPoint }
  | { type: "drawing-pen" }
  | { type: "drawing-shape"; shapeType: "rectangle" | "ellipse" | "line"; start: Point }

// ─── Canvas events (for state machine input) ───────────────────

export type CanvasEvent =
  | { type: "mousedown"; point: Point; screenPoint: Point; button: number; altKey: boolean; shiftKey: boolean }
  | { type: "mousemove"; point: Point; screenPoint: Point; shiftKey: boolean }
  | { type: "mouseup"; point: Point }
  | { type: "dblclick"; point: Point; screenPoint: Point }
  | { type: "keydown"; key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }

// ─── Hit test results ──────────────────────────────────────────

export type HitTestResult =
  | { type: "none" }
  | { type: "shape-body"; pathId: string; layerId: string }
  | { type: "resize-handle"; handle: HandlePosition }
  | { type: "rotation-zone" }
  | { type: "node"; selectedPoint: SelectedPoint }

// ─── Actions emitted by state machine ──────────────────────────

export type InteractionAction =
  | { type: "select-shape"; pathId: string | null }
  | { type: "move-shape"; pathId: string; segments: PathSegment[] }
  | { type: "set-rotation"; pathId: string; rotation: number }
  | { type: "resize-shape"; pathId: string; newSegments: PathSegment[]; newTransform: ShapeTransform }
  | { type: "bake-resize"; pathId: string; anchor: Point; scaleX: number; scaleY: number; originalSegments: PathSegment[] }
  | { type: "move-node"; selectedPoint: SelectedPoint; newPos: Point }
  | { type: "delete-shape"; pathId: string }
  | { type: "delete-node"; selectedPoint: SelectedPoint }
  | { type: "copy" }
  | { type: "paste" }
  | { type: "duplicate" }
  | { type: "duplicate-and-drag"; pathId: string }
  | { type: "nudge"; delta: Point }
  | { type: "add-segment"; point: Point }
  | { type: "close-path" }
  | { type: "new-path" }
  | { type: "finish-drawing-shape"; start: Point; end: Point; shapeType: "rectangle" | "ellipse" | "line" }
  | { type: "push-history" }
  | { type: "set-cursor"; cursor: string }

// ─── Clipboard ─────────────────────────────────────────────────

export type ClipboardEntry = {
  paths: ShapePath[]
  pasteCount: number
}
```

- [ ] **Step 2: Add `transform` field to `ShapePath`**

In the existing `ShapePath` type, add the `transform` field:

```typescript
export type ShapePath = {
  id: string
  name: string
  segments: PathSegment[]
  closed: boolean
  paint: PaintStyle
  visible: boolean
  locked: boolean
  transform: ShapeTransform  // NEW
}
```

- [ ] **Step 3: Update `DEFAULT_PAINT` area — add import for `DEFAULT_TRANSFORM` in createPath**

No change needed to `DEFAULT_PAINT` itself. The `DEFAULT_TRANSFORM` constant is already added in Step 1. The `createPath` function in `ShapeMaker.tsx` will be updated in Task 7 to use it.

- [ ] **Step 4: Update `HistoryEntry` to NOT include interaction state**

The existing `HistoryEntry` type stays as-is — it only snapshots `layers`, `activeLayerId`, `activePathId`. Interaction state resets to `{ type: "idle" }` on undo/redo.

- [ ] **Step 5: Verify build**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc -b`

Expected: Build errors in files that reference `ShapePath` without providing `transform`. This is expected and will be fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/types/shapemaker.ts
git commit -m "feat(shapemaker): add transform, interaction state, and action types"
```

---

### Task 2: Transform utilities

**Files:**
- Create: `src/utils/shapemakerTransform.ts`

- [ ] **Step 1: Create the transform utilities file**

```typescript
import type { Point, PathSegment, ShapePath, BoundingBox, HandlePosition, ShapeTransform } from "@/types/shapemaker"

// ─── Bounding box ──────────────────────────────────────────────

/** Collect all coordinate points from segments (including control points for tight bbox) */
function collectEndpoints(segments: PathSegment[]): Point[] {
  const pts: Point[] = []
  for (const seg of segments) {
    switch (seg.type) {
      case "moveTo":
      case "lineTo":
        pts.push(seg.point)
        break
      case "quadraticBezierTo":
        pts.push(seg.controlPoint, seg.endPoint)
        break
      case "cubicTo":
        pts.push(seg.controlPoint1, seg.controlPoint2, seg.endPoint)
        break
      case "arcToPoint":
        pts.push(seg.endPoint)
        break
    }
  }
  return pts
}

export function computeBoundingBox(segments: PathSegment[]): BoundingBox {
  const pts = collectEndpoints(segments)
  if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function bboxCenter(bbox: BoundingBox): Point {
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
}

// ─── Handle positions ──────────────────────────────────────────

export function getHandlePositions(bbox: BoundingBox): Record<HandlePosition, Point> {
  const { x, y, width: w, height: h } = bbox
  return {
    nw: { x, y },
    n:  { x: x + w / 2, y },
    ne: { x: x + w, y },
    e:  { x: x + w, y: y + h / 2 },
    se: { x: x + w, y: y + h },
    s:  { x: x + w / 2, y: y + h },
    sw: { x, y: y + h },
    w:  { x, y: y + h / 2 },
  }
}

export function getAnchorForHandle(handle: HandlePosition, bbox: BoundingBox): Point {
  const handles = getHandlePositions(bbox)
  const opposites: Record<HandlePosition, HandlePosition> = {
    nw: "se", n: "s", ne: "sw", e: "w", se: "nw", s: "n", sw: "ne", w: "e",
  }
  return handles[opposites[handle]]
}

export function getCursorForHandle(handle: HandlePosition, rotationRad: number): string {
  // Base angles for each handle (unrotated)
  const baseAngles: Record<HandlePosition, number> = {
    n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315,
  }
  const rotDeg = (rotationRad * 180) / Math.PI
  const angle = ((baseAngles[handle] + rotDeg) % 360 + 360) % 360

  // Map angle to cursor
  if (angle < 22.5 || angle >= 337.5) return "ns-resize"
  if (angle < 67.5) return "nesw-resize"
  if (angle < 112.5) return "ew-resize"
  if (angle < 157.5) return "nwse-resize"
  if (angle < 202.5) return "ns-resize"
  if (angle < 247.5) return "nesw-resize"
  if (angle < 292.5) return "ew-resize"
  return "nwse-resize"
}

// ─── Point transforms ──────────────────────────────────────────

/** Translate all points in segments by delta */
export function translateSegments(segments: PathSegment[], dx: number, dy: number): PathSegment[] {
  return segments.map((seg) => {
    switch (seg.type) {
      case "moveTo":
        return { ...seg, point: { x: seg.point.x + dx, y: seg.point.y + dy } }
      case "lineTo":
        return { ...seg, point: { x: seg.point.x + dx, y: seg.point.y + dy } }
      case "quadraticBezierTo":
        return {
          ...seg,
          controlPoint: { x: seg.controlPoint.x + dx, y: seg.controlPoint.y + dy },
          endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy },
        }
      case "cubicTo":
        return {
          ...seg,
          controlPoint1: { x: seg.controlPoint1.x + dx, y: seg.controlPoint1.y + dy },
          controlPoint2: { x: seg.controlPoint2.x + dx, y: seg.controlPoint2.y + dy },
          endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy },
        }
      case "arcToPoint":
        return { ...seg, endPoint: { x: seg.endPoint.x + dx, y: seg.endPoint.y + dy } }
      case "close":
        return seg
    }
  })
}

/** Scale all points relative to an anchor */
export function scaleSegments(
  segments: PathSegment[],
  anchor: Point,
  scaleX: number,
  scaleY: number
): PathSegment[] {
  function scalePoint(p: Point): Point {
    return {
      x: anchor.x + (p.x - anchor.x) * scaleX,
      y: anchor.y + (p.y - anchor.y) * scaleY,
    }
  }

  return segments.map((seg) => {
    switch (seg.type) {
      case "moveTo":
        return { ...seg, point: scalePoint(seg.point) }
      case "lineTo":
        return { ...seg, point: scalePoint(seg.point) }
      case "quadraticBezierTo":
        return {
          ...seg,
          controlPoint: scalePoint(seg.controlPoint),
          endPoint: scalePoint(seg.endPoint),
        }
      case "cubicTo":
        return {
          ...seg,
          controlPoint1: scalePoint(seg.controlPoint1),
          controlPoint2: scalePoint(seg.controlPoint2),
          endPoint: scalePoint(seg.endPoint),
        }
      case "arcToPoint":
        return { ...seg, endPoint: scalePoint(seg.endPoint) }
      case "close":
        return seg
    }
  })
}

/** Rotate a point around a center */
export function rotatePoint(p: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = p.x - center.x
  const dy = p.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

/** Un-rotate a point (for hit testing rotated shapes) */
export function unrotatePoint(p: Point, center: Point, angle: number): Point {
  return rotatePoint(p, center, -angle)
}

/** Snap angle to nearest increment */
export function snapAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc -b`

Still expect errors from ShapePath missing `transform` in other files. The new file itself should compile clean.

- [ ] **Step 3: Commit**

```bash
git add src/utils/shapemakerTransform.ts
git commit -m "feat(shapemaker): add transform utilities - bbox, translate, scale, rotate"
```

---

### Task 3: Hit testing module

**Files:**
- Create: `src/utils/shapemakerHitTest.ts`

- [ ] **Step 1: Create the hit testing file**

```typescript
import type {
  Point,
  PathSegment,
  ShapePath,
  Layer,
  ShapeTransform,
  BoundingBox,
  HandlePosition,
  HitTestResult,
  SelectedPoint,
  EditingMode,
} from "@/types/shapemaker"
import { computeBoundingBox, bboxCenter, getHandlePositions, unrotatePoint } from "./shapemakerTransform"

// ─── Path2D building ───────────────────────────────────────────

export function buildPath2D(segments: PathSegment[]): Path2D {
  const p = new Path2D()
  for (const seg of segments) {
    switch (seg.type) {
      case "moveTo":
        p.moveTo(seg.point.x, seg.point.y)
        break
      case "lineTo":
        p.lineTo(seg.point.x, seg.point.y)
        break
      case "quadraticBezierTo":
        p.quadraticCurveTo(seg.controlPoint.x, seg.controlPoint.y, seg.endPoint.x, seg.endPoint.y)
        break
      case "cubicTo":
        p.bezierCurveTo(
          seg.controlPoint1.x, seg.controlPoint1.y,
          seg.controlPoint2.x, seg.controlPoint2.y,
          seg.endPoint.x, seg.endPoint.y,
        )
        break
      case "arcToPoint": {
        // Approximate — same as existing renderPath logic
        const rx = seg.radius.x
        const ry = seg.radius.y
        if (rx === ry) {
          p.arcTo(seg.endPoint.x, seg.endPoint.y, seg.endPoint.x, seg.endPoint.y, rx)
        } else {
          p.lineTo(seg.endPoint.x, seg.endPoint.y)
        }
        break
      }
      case "close":
        p.closePath()
        break
    }
  }
  return p
}

// ─── Handle hit testing ────────────────────────────────────────

const HANDLE_SIZE = 8  // px in screen space
const ROTATION_ZONE_RADIUS = 12
const ROTATION_ZONE_OFFSET = 16

function screenDist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Test if screenPoint hits a resize handle. Points are in screen space. */
export function hitTestHandles(
  screenPoint: Point,
  bbox: BoundingBox,
  rotation: number,
  center: Point,
  zoom: number,
  panX: number,
  panY: number,
): HandlePosition | null {
  const handles = getHandlePositions(bbox)
  const entries = Object.entries(handles) as [HandlePosition, Point][]

  for (const [handle, canvasPoint] of entries) {
    // Convert canvas point to screen space
    const screenHandle = canvasToScreen(canvasPoint, rotation, center, zoom, panX, panY)
    if (screenDist(screenPoint, screenHandle) <= HANDLE_SIZE) {
      return handle
    }
  }
  return null
}

/** Test if screenPoint is in a rotation zone (just outside corners) */
export function hitTestRotationZone(
  screenPoint: Point,
  bbox: BoundingBox,
  rotation: number,
  center: Point,
  zoom: number,
  panX: number,
  panY: number,
): boolean {
  const corners: HandlePosition[] = ["nw", "ne", "se", "sw"]
  const handles = getHandlePositions(bbox)

  for (const corner of corners) {
    const canvasCorner = handles[corner]
    const screenCorner = canvasToScreen(canvasCorner, rotation, center, zoom, panX, panY)
    // Rotation zone is offset outward from corner
    const dx = screenCorner.x - (panX + center.x * zoom)
    const dy = screenCorner.y - (panY + center.y * zoom)
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const zonePoint = {
      x: screenCorner.x + (dx / len) * ROTATION_ZONE_OFFSET,
      y: screenCorner.y + (dy / len) * ROTATION_ZONE_OFFSET,
    }
    if (screenDist(screenPoint, zonePoint) <= ROTATION_ZONE_RADIUS) {
      return true
    }
  }
  return false
}

function canvasToScreen(
  canvasPoint: Point,
  rotation: number,
  center: Point,
  zoom: number,
  panX: number,
  panY: number,
): Point {
  // Apply rotation around center
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const dx = canvasPoint.x - center.x
  const dy = canvasPoint.y - center.y
  const rx = center.x + dx * cos - dy * sin
  const ry = center.y + dx * sin + dy * cos
  // Apply zoom + pan
  return { x: rx * zoom + panX, y: ry * zoom + panY }
}

// ─── Node hit testing ──────────────────────────────────────────

export function hitTestNodes(
  canvasPoint: Point,
  path: ShapePath,
  threshold: number,
): SelectedPoint | null {
  for (let i = 0; i < path.segments.length; i++) {
    const seg = path.segments[i]
    if (seg.type === "moveTo" || seg.type === "lineTo") {
      if (dist(canvasPoint, seg.point) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "point" }
      }
    } else if (seg.type === "quadraticBezierTo") {
      if (dist(canvasPoint, seg.controlPoint) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint1" }
      }
      if (dist(canvasPoint, seg.endPoint) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "cubicTo") {
      if (dist(canvasPoint, seg.controlPoint1) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint1" }
      }
      if (dist(canvasPoint, seg.controlPoint2) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint2" }
      }
      if (dist(canvasPoint, seg.endPoint) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "arcToPoint") {
      if (dist(canvasPoint, seg.endPoint) < threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    }
  }
  return null
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// ─── Shape body hit testing (isPointInPath / isPointInStroke) ──

export function hitTestShapeBody(
  ctx: CanvasRenderingContext2D,
  canvasPoint: Point,
  path: ShapePath,
  zoom: number,
): boolean {
  if (path.segments.length === 0) return false

  // Un-rotate the test point into the shape's local space
  const bbox = computeBoundingBox(path.segments)
  const center = bboxCenter(bbox)
  const localPoint = unrotatePoint(canvasPoint, center, path.transform.rotation)

  const path2d = buildPath2D(path.segments)

  // Test fill for closed paths
  if (path.closed) {
    if (ctx.isPointInPath(path2d, localPoint.x, localPoint.y)) {
      return true
    }
  }

  // Test stroke with inflated lineWidth
  ctx.save()
  ctx.lineWidth = Math.max(path.paint.strokeWidth, 8 / zoom)
  const inStroke = ctx.isPointInStroke(path2d, localPoint.x, localPoint.y)
  ctx.restore()

  return inStroke
}

// ─── Full hit test orchestrator ────────────────────────────────

export function performHitTest(
  ctx: CanvasRenderingContext2D,
  canvasPoint: Point,
  screenPoint: Point,
  layers: Layer[],
  selectedPathId: string | null,
  editingMode: EditingMode | null,
  zoom: number,
  panX: number,
  panY: number,
): HitTestResult {
  // 1. If shape selected in shape mode, test handles first
  if (selectedPathId && editingMode === "shape") {
    const selectedPath = findPath(layers, selectedPathId)
    if (selectedPath) {
      const bbox = computeBoundingBox(selectedPath.segments)
      const center = bboxCenter(bbox)
      const rotation = selectedPath.transform.rotation

      // Resize handles
      const handle = hitTestHandles(screenPoint, bbox, rotation, center, zoom, panX, panY)
      if (handle) return { type: "resize-handle", handle }

      // Rotation zones
      if (hitTestRotationZone(screenPoint, bbox, rotation, center, zoom, panX, panY)) {
        return { type: "rotation-zone" }
      }
    }
  }

  // 2. If in node mode, test nodes on active path
  if (selectedPathId && editingMode === "node") {
    const selectedPath = findPath(layers, selectedPathId)
    if (selectedPath) {
      // Un-rotate point for node testing on rotated shapes
      const bbox = computeBoundingBox(selectedPath.segments)
      const center = bboxCenter(bbox)
      const localPoint = unrotatePoint(canvasPoint, center, selectedPath.transform.rotation)
      const nodeHit = hitTestNodes(localPoint, selectedPath, 10 / zoom)
      if (nodeHit) return { type: "node", selectedPoint: nodeHit }
    }
  }

  // 3. Test shape bodies (reverse z-order = topmost first)
  for (let li = layers.length - 1; li >= 0; li--) {
    const layer = layers[li]
    if (!layer.visible || layer.locked) continue
    for (let pi = layer.paths.length - 1; pi >= 0; pi--) {
      const path = layer.paths[pi]
      if (!path.visible || path.locked) continue
      if (hitTestShapeBody(ctx, canvasPoint, path, zoom)) {
        return { type: "shape-body", pathId: path.id, layerId: layer.id }
      }
    }
  }

  return { type: "none" }
}

function findPath(layers: Layer[], pathId: string): ShapePath | null {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}
```

- [ ] **Step 2: Verify the new file compiles**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc --noEmit --pretty src/utils/shapemakerHitTest.ts 2>&1 | head -30`

Expect: May show errors due to ShapePath missing transform in other files but the file itself should be structurally sound.

- [ ] **Step 3: Commit**

```bash
git add src/utils/shapemakerHitTest.ts
git commit -m "feat(shapemaker): add hit testing module with Path2D and handle detection"
```

---

### Task 4: Clipboard utilities

**Files:**
- Create: `src/utils/shapemakerClipboard.ts`

- [ ] **Step 1: Create clipboard file**

```typescript
import type { ShapePath, ClipboardEntry, PathSegment } from "@/types/shapemaker"
import { DEFAULT_TRANSFORM } from "@/types/shapemaker"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/shapemakerClipboard.ts
git commit -m "feat(shapemaker): add clipboard utilities for copy/paste/duplicate"
```

---

## Chunk 2: Interaction State Machine

### Task 5: Interaction state machine

**Files:**
- Create: `src/utils/shapemakerInteraction.ts`

- [ ] **Step 1: Create the state machine file**

This is the core of the refactor. A pure function that takes current state + event + context and returns new state + actions.

```typescript
import type {
  Point,
  Layer,
  ToolMode,
  InteractionState,
  CanvasEvent,
  InteractionAction,
  HitTestResult,
  SelectedPoint,
  EditingMode,
  BoundingBox,
  HandlePosition,
  ShapeTransform,
  PathSegment,
} from "@/types/shapemaker"
import { computeBoundingBox, bboxCenter, getAnchorForHandle, snapAngle, translateSegments, getCursorForHandle } from "./shapemakerTransform"

export type InteractionContext = {
  layers: Layer[]
  tool: ToolMode
  zoom: number
  panX: number
  panY: number
  snapEnabled: boolean
  gridSize: number
  hitTest: HitTestResult  // pre-computed by the canvas before calling
  activePathId: string | null
}

export type ProcessResult = {
  newState: InteractionState
  actions: InteractionAction[]
}

export function processEvent(
  state: InteractionState,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  switch (state.type) {
    case "idle":
      return processIdle(state, event, ctx)
    case "shape-selected":
      return processShapeSelected(state, event, ctx)
    case "dragging-shape":
      return processDraggingShape(state, event, ctx)
    case "rotating":
      return processRotating(state, event, ctx)
    case "resizing":
      return processResizing(state, event, ctx)
    case "dragging-node":
      return processDraggingNode(state, event, ctx)
    case "drawing-pen":
      return processDrawingPen(state, event, ctx)
    case "drawing-shape":
      return processDrawingShape(state, event, ctx)
  }
}

// ─── IDLE ──────────────────────────────────────────────────────

function processIdle(
  state: InteractionState,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  if (event.type !== "mousedown" && event.type !== "keydown") {
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown" && event.button !== 0) {
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown") {
    if (ctx.tool === "select") {
      if (ctx.hitTest.type === "shape-body") {
        return {
          newState: { type: "shape-selected", pathId: ctx.hitTest.pathId, mode: "shape" },
          actions: [
            { type: "select-shape", pathId: ctx.hitTest.pathId },
            { type: "set-cursor", cursor: "move" },
          ],
        }
      }
      return { newState: state, actions: [{ type: "set-cursor", cursor: "default" }] }
    }

    if (ctx.tool === "pen") {
      return {
        newState: { type: "drawing-pen" },
        actions: [{ type: "add-segment", point: event.point }],
      }
    }

    if (ctx.tool === "rectangle" || ctx.tool === "ellipse" || ctx.tool === "line") {
      return {
        newState: { type: "drawing-shape", shapeType: ctx.tool, start: event.point },
        actions: [],
      }
    }
  }

  return { newState: state, actions: [] }
}

// ─── SHAPE-SELECTED ────────────────────────────────────────────

function processShapeSelected(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  const path = findPath(ctx.layers, state.pathId)
  if (!path) return { newState: { type: "idle" }, actions: [] }

  // Handle keyboard events
  if (event.type === "keydown") {
    return processShapeSelectedKeyboard(state, event, ctx)
  }

  // Handle double-click to toggle shape/node mode
  if (event.type === "dblclick") {
    if (state.mode === "shape") {
      return {
        newState: { ...state, mode: "node" },
        actions: [],
      }
    }
    return { newState: state, actions: [] }
  }

  if (event.type === "mousedown" && event.button === 0) {
    if (state.mode === "shape") {
      return processShapeModeMouseDown(state, event, ctx, path)
    } else {
      return processNodeModeMouseDown(state, event, ctx, path)
    }
  }

  // Cursor updates on mousemove
  if (event.type === "mousemove" && state.mode === "shape") {
    return processShapeModeCursorUpdate(state, event, ctx)
  }

  return { newState: state, actions: [] }
}

function processShapeModeMouseDown(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: Extract<CanvasEvent, { type: "mousedown" }>,
  ctx: InteractionContext,
  path: { segments: PathSegment[]; transform: ShapeTransform },
): ProcessResult {
  const hitTest = ctx.hitTest

  // Resize handle
  if (hitTest.type === "resize-handle") {
    const bbox = computeBoundingBox(path.segments)
    const anchor = getAnchorForHandle(hitTest.handle, bbox)
    return {
      newState: {
        type: "resizing",
        pathId: state.pathId,
        handle: hitTest.handle,
        anchor,
        originalBBox: bbox,
        originalSegments: JSON.parse(JSON.stringify(path.segments)),
        originalTransform: { ...path.transform },
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Rotation zone
  if (hitTest.type === "rotation-zone") {
    const bbox = computeBoundingBox(path.segments)
    const center = bboxCenter(bbox)
    const startAngle = Math.atan2(event.point.y - center.y, event.point.x - center.x)
    return {
      newState: {
        type: "rotating",
        pathId: state.pathId,
        center,
        startAngle,
        originalRotation: path.transform.rotation,
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on same shape body → start drag (or alt+drag for duplicate)
  if (hitTest.type === "shape-body" && hitTest.pathId === state.pathId) {
    if (event.altKey) {
      return {
        newState: {
          type: "dragging-shape",
          pathId: state.pathId,
          startPoint: event.point,
          originalSegments: JSON.parse(JSON.stringify(path.segments)),
        },
        actions: [
          { type: "push-history" },
          { type: "duplicate-and-drag", pathId: state.pathId },
        ],
      }
    }
    return {
      newState: {
        type: "dragging-shape",
        pathId: state.pathId,
        startPoint: event.point,
        originalSegments: JSON.parse(JSON.stringify(path.segments)),
      },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on different shape
  if (hitTest.type === "shape-body" && hitTest.pathId !== state.pathId) {
    return {
      newState: { type: "shape-selected", pathId: hitTest.pathId, mode: "shape" },
      actions: [{ type: "select-shape", pathId: hitTest.pathId }],
    }
  }

  // Click on nothing → deselect
  if (hitTest.type === "none") {
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  return { newState: state, actions: [] }
}

function processNodeModeMouseDown(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: Extract<CanvasEvent, { type: "mousedown" }>,
  ctx: InteractionContext,
  _path: { segments: PathSegment[]; transform: ShapeTransform },
): ProcessResult {
  const hitTest = ctx.hitTest

  if (hitTest.type === "node") {
    return {
      newState: { type: "dragging-node", selectedPoint: hitTest.selectedPoint },
      actions: [{ type: "push-history" }],
    }
  }

  // Click on a different shape body
  if (hitTest.type === "shape-body") {
    if (hitTest.pathId !== state.pathId) {
      return {
        newState: { type: "shape-selected", pathId: hitTest.pathId, mode: "shape" },
        actions: [{ type: "select-shape", pathId: hitTest.pathId }],
      }
    }
    // Click on own body in node mode — keep node mode
    return { newState: state, actions: [] }
  }

  if (hitTest.type === "none") {
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  return { newState: state, actions: [] }
}

function processShapeSelectedKeyboard(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  event: Extract<CanvasEvent, { type: "keydown" }>,
  ctx: InteractionContext,
): ProcessResult {
  const mod = event.ctrlKey || event.metaKey

  // Escape: node mode → shape mode, or shape mode → idle
  if (event.key === "Escape") {
    if (state.mode === "node") {
      return { newState: { ...state, mode: "shape" }, actions: [] }
    }
    return {
      newState: { type: "idle" },
      actions: [{ type: "select-shape", pathId: null }],
    }
  }

  // Delete
  if (event.key === "Delete" || event.key === "Backspace") {
    if (state.mode === "node") {
      // Handled externally — we don't know which node is selected from here
      // The canvas component tracks selectedPoint separately for node mode
      return { newState: state, actions: [] }
    }
    return {
      newState: { type: "idle" },
      actions: [
        { type: "push-history" },
        { type: "delete-shape", pathId: state.pathId },
      ],
    }
  }

  // Copy
  if (mod && event.key === "c") {
    return { newState: state, actions: [{ type: "copy" }] }
  }

  // Paste
  if (mod && event.key === "v") {
    return { newState: state, actions: [{ type: "paste" }] }
  }

  // Duplicate
  if (mod && event.key === "d") {
    return { newState: state, actions: [{ type: "push-history" }, { type: "duplicate" }] }
  }

  // Arrow keys (nudge)
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    const amount = event.shiftKey ? 10 : 1
    const delta: Point = { x: 0, y: 0 }
    if (event.key === "ArrowUp") delta.y = -amount
    if (event.key === "ArrowDown") delta.y = amount
    if (event.key === "ArrowLeft") delta.x = -amount
    if (event.key === "ArrowRight") delta.x = amount
    return {
      newState: state,
      actions: [
        { type: "push-history" },
        { type: "nudge", delta },
      ],
    }
  }

  return { newState: state, actions: [] }
}

function processShapeModeCursorUpdate(
  state: Extract<InteractionState, { type: "shape-selected" }>,
  _event: Extract<CanvasEvent, { type: "mousemove" }>,
  ctx: InteractionContext,
): ProcessResult {
  const hitTest = ctx.hitTest
  if (hitTest.type === "resize-handle") {
    const path = findPath(ctx.layers, state.pathId)
    const rotation = path?.transform.rotation ?? 0
    return {
      newState: state,
      actions: [{ type: "set-cursor", cursor: getCursorForHandle(hitTest.handle, rotation) }],
    }
  }
  if (hitTest.type === "rotation-zone") {
    return { newState: state, actions: [{ type: "set-cursor", cursor: "grab" }] }
  }
  if (hitTest.type === "shape-body" && hitTest.pathId === state.pathId) {
    return { newState: state, actions: [{ type: "set-cursor", cursor: "move" }] }
  }
  return { newState: state, actions: [{ type: "set-cursor", cursor: "default" }] }
}

// ─── DRAGGING-SHAPE ────────────────────────────────────────────

function processDraggingShape(
  state: Extract<InteractionState, { type: "dragging-shape" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const dx = event.point.x - state.startPoint.x
    const dy = event.point.y - state.startPoint.y
    // IMPORTANT: translate from ORIGINAL segments, not current, to avoid compounding
    const newSegments = translateSegments(state.originalSegments, dx, dy)
    return {
      newState: state,
      actions: [{ type: "move-shape", pathId: state.pathId, segments: newSegments }],
    }
  }

  if (event.type === "mouseup") {
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── ROTATING ──────────────────────────────────────────────────

function processRotating(
  state: Extract<InteractionState, { type: "rotating" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const currentAngle = Math.atan2(
      event.point.y - state.center.y,
      event.point.x - state.center.x,
    )
    let newRotation = state.originalRotation + (currentAngle - state.startAngle)

    if (event.shiftKey) {
      const snap15 = (15 * Math.PI) / 180
      newRotation = snapAngle(newRotation, snap15)
    }

    return {
      newState: state,
      actions: [{ type: "set-rotation", pathId: state.pathId, rotation: newRotation }],
    }
  }

  if (event.type === "mouseup") {
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── RESIZING ──────────────────────────────────────────────────

function processResizing(
  state: Extract<InteractionState, { type: "resizing" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    const { handle, anchor, originalBBox, originalSegments } = state

    // Compute scale based on handle type
    let scaleX = 1
    let scaleY = 1

    const isCorner = ["nw", "ne", "se", "sw"].includes(handle)
    const isHorizontal = ["e", "w"].includes(handle)
    const isVertical = ["n", "s"].includes(handle)

    if (isCorner || isHorizontal) {
      const newWidth = Math.abs(event.point.x - anchor.x)
      scaleX = originalBBox.width > 0 ? newWidth / originalBBox.width : 1
    }
    if (isCorner || isVertical) {
      const newHeight = Math.abs(event.point.y - anchor.y)
      scaleY = originalBBox.height > 0 ? newHeight / originalBBox.height : 1
    }

    // Shift = proportional
    if (event.shiftKey && isCorner) {
      const maxScale = Math.max(scaleX, scaleY)
      scaleX = maxScale
      scaleY = maxScale
    }

    // Prevent zero scale
    scaleX = Math.max(scaleX, 0.01)
    scaleY = Math.max(scaleY, 0.01)

    return {
      newState: state,
      actions: [{
        type: "bake-resize",
        pathId: state.pathId,
        anchor,
        scaleX,
        scaleY,
        originalSegments: originalSegments,
      }],
    }
  }

  if (event.type === "mouseup") {
    // Scale is already baked — just transition back
    return {
      newState: { type: "shape-selected", pathId: state.pathId, mode: "shape" },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAGGING-NODE ─────────────────────────────────────────────

function processDraggingNode(
  state: Extract<InteractionState, { type: "dragging-node" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousemove") {
    return {
      newState: state,
      actions: [{ type: "move-node", selectedPoint: state.selectedPoint, newPos: event.point }],
    }
  }

  if (event.type === "mouseup") {
    // Return to shape-selected in node mode
    // We need the pathId from the selectedPoint
    return {
      newState: {
        type: "shape-selected",
        pathId: state.selectedPoint.pathId,
        mode: "node",
      },
      actions: [],
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAWING-PEN ───────────────────────────────────────────────

function processDrawingPen(
  state: InteractionState,
  event: CanvasEvent,
  ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mousedown" && event.button === 0) {
    return {
      newState: state,
      actions: [{ type: "add-segment", point: event.point }],
    }
  }

  if (event.type === "keydown") {
    if (event.key === "Enter") {
      return {
        newState: { type: "idle" },
        actions: [{ type: "close-path" }],
      }
    }
    if (event.key === "Escape") {
      return {
        newState: { type: "idle" },
        actions: [{ type: "new-path" }],
      }
    }
  }

  return { newState: state, actions: [] }
}

// ─── DRAWING-SHAPE ─────────────────────────────────────────────

function processDrawingShape(
  state: Extract<InteractionState, { type: "drawing-shape" }>,
  event: CanvasEvent,
  _ctx: InteractionContext,
): ProcessResult {
  if (event.type === "mouseup") {
    // Transition to shape-selected — the finish-drawing-shape action will create the shape
    // and set activePathId, which the dispatcher uses to update interactionState
    return {
      newState: { type: "idle" },  // Temporarily idle; dispatcher updates to shape-selected after creating the shape
      actions: [{
        type: "finish-drawing-shape",
        start: state.start,
        end: event.point,
        shapeType: state.shapeType,
      }],
    }
  }

  return { newState: state, actions: [] }
}

// ─── Helpers ───────────────────────────────────────────────────

function findPath(layers: Layer[], pathId: string) {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/shapemakerInteraction.ts
git commit -m "feat(shapemaker): add interaction state machine with all state transitions"
```

---

## Chunk 3: Rendering Updates

### Task 6: Update rendering for rotation

**Files:**
- Modify: `src/utils/shapemakerCanvas.ts`

- [ ] **Step 1: Update `renderPath` to apply rotation**

In `src/utils/shapemakerCanvas.ts`, modify the `renderPath` function to wrap drawing with rotation transform when `path.transform.rotation !== 0`:

```typescript
export function renderPath(
  ctx: CanvasRenderingContext2D,
  path: ShapePath
) {
  if (!path.visible || path.segments.length === 0) return

  ctx.save()

  // Apply rotation if present
  if (path.transform.rotation !== 0) {
    const bbox = computeBoundingBox(path.segments)
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    ctx.translate(cx, cy)
    ctx.rotate(path.transform.rotation)
    ctx.translate(-cx, -cy)
  }

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
```

Add the import at the top:

```typescript
import { computeBoundingBox } from "./shapemakerTransform"
```

- [ ] **Step 2: Add bounding box + handles rendering function**

Add this function at the end of `shapemakerCanvas.ts`:

```typescript
export function renderBoundingBox(
  ctx: CanvasRenderingContext2D,
  path: ShapePath,
  zoom: number,
  panX: number,
  panY: number,
) {
  const bbox = computeBoundingBox(path.segments)
  if (bbox.width === 0 && bbox.height === 0) return

  const center = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // Apply rotation
  ctx.translate(center.x, center.y)
  ctx.rotate(path.transform.rotation)
  ctx.translate(-center.x, -center.y)

  // Dashed bounding box
  ctx.strokeStyle = "#818cf8"
  ctx.lineWidth = 1 / zoom
  ctx.setLineDash([6 / zoom, 4 / zoom])
  ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height)
  ctx.setLineDash([])

  // Resize handles
  const handleSize = 8 / zoom
  const halfHandle = handleSize / 2
  ctx.fillStyle = "#ffffff"
  ctx.strokeStyle = "#818cf8"
  ctx.lineWidth = 1.5 / zoom

  const handles = [
    { x: bbox.x, y: bbox.y },                                    // nw
    { x: bbox.x + bbox.width / 2, y: bbox.y },                   // n
    { x: bbox.x + bbox.width, y: bbox.y },                       // ne
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 },     // e
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },          // se
    { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height },     // s
    { x: bbox.x, y: bbox.y + bbox.height },                       // sw
    { x: bbox.x, y: bbox.y + bbox.height / 2 },                  // w
  ]

  for (const h of handles) {
    ctx.fillRect(h.x - halfHandle, h.y - halfHandle, handleSize, handleSize)
    ctx.strokeRect(h.x - halfHandle, h.y - halfHandle, handleSize, handleSize)
  }

  ctx.restore()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/shapemakerCanvas.ts
git commit -m "feat(shapemaker): add rotation-aware rendering and bounding box handles"
```

---

### Task 7: Update ShapeMaker.tsx — wire up state machine and action dispatcher

**Files:**
- Modify: `src/components/shapemaker/ShapeMaker.tsx`

This is the largest single task. The changes:

- [ ] **Step 1: Add imports and update `createPath` to include `transform`**

Add to imports:

```typescript
import { DEFAULT_TRANSFORM } from "@/types/shapemaker"
import type { InteractionState, ClipboardEntry, InteractionAction } from "@/types/shapemaker"
import { computeBoundingBox, translateSegments, scaleSegments } from "@/utils/shapemakerTransform"
import { copyToClipboard, pasteFromClipboard, duplicatePath, duplicatePathWithOffset } from "@/utils/shapemakerClipboard"
```

Update `createPath`:

```typescript
function createPath(name: string): ShapePath {
  return {
    id: uid("path"),
    name,
    segments: [],
    closed: false,
    paint: { ...DEFAULT_PAINT },
    visible: true,
    locked: false,
    transform: { ...DEFAULT_TRANSFORM },
  }
}
```

- [ ] **Step 2: Replace scattered state with `InteractionState` and clipboard**

Replace these state declarations:

```typescript
// REMOVE these:
// const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null)

// ADD these:
const [interactionState, setInteractionState] = useState<InteractionState>({ type: "idle" })
const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null)
const [selectedNodePoint, setSelectedNodePoint] = useState<SelectedPoint | null>(null)
```

Keep `selectedPoint` functionality but rename to `selectedNodePoint` since it's now only for node-mode editing.

- [ ] **Step 3: Add action dispatcher**

Add after the helpers section:

```typescript
const dispatchActions = useCallback(
  (actions: InteractionAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case "select-shape":
          setActivePathId(action.pathId)
          setSelectedNodePoint(null)
          break

        case "move-shape": {
          const { pathId, segments } = action
          setLayers((prev) =>
            prev.map((layer) => ({
              ...layer,
              paths: layer.paths.map((p) => {
                if (p.id !== pathId) return p
                return { ...p, segments }
              }),
            }))
          )
          break
        }

        case "set-rotation": {
          setLayers((prev) =>
            prev.map((layer) => ({
              ...layer,
              paths: layer.paths.map((p) => {
                if (p.id !== action.pathId) return p
                return { ...p, transform: { ...p.transform, rotation: action.rotation } }
              }),
            }))
          )
          break
        }

        case "bake-resize": {
          const { pathId, anchor, scaleX, scaleY, originalSegments } = action
          const newSegments = scaleSegments(originalSegments, anchor, scaleX, scaleY)
          setLayers((prev) =>
            prev.map((layer) => ({
              ...layer,
              paths: layer.paths.map((p) => {
                if (p.id !== pathId) return p
                return { ...p, segments: newSegments }
              }),
            }))
          )
          break
        }

        case "move-node":
          handleMovePoint(action.selectedPoint, action.newPos)
          break

        case "delete-shape": {
          setLayers((prev) =>
            prev.map((layer) => ({
              ...layer,
              paths: layer.paths.filter((p) => p.id !== action.pathId),
            }))
          )
          setActivePathId(null)
          break
        }

        case "copy": {
          if (activePathId) {
            const path = getActivePath()
            if (path) setClipboard(copyToClipboard([path]))
          }
          break
        }

        case "paste": {
          if (clipboard) {
            const { paths, updatedClipboard } = pasteFromClipboard(clipboard)
            setClipboard(updatedClipboard)
            setLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== activeLayerId) return layer
                return { ...layer, paths: [...layer.paths, ...paths] }
              })
            )
            if (paths.length > 0) setActivePathId(paths[0].id)
          }
          break
        }

        case "duplicate": {
          if (activePathId) {
            const path = getActivePath()
            if (path) {
              const dup = duplicatePathWithOffset(path, 10, 10)
              setLayers((prev) =>
                prev.map((layer) => {
                  if (layer.id !== activeLayerId) return layer
                  return { ...layer, paths: [...layer.paths, dup] }
                })
              )
              setActivePathId(dup.id)
              setInteractionState({ type: "shape-selected", pathId: dup.id, mode: "shape" })
            }
          }
          break
        }

        case "duplicate-and-drag": {
          const origPath = layers.flatMap(l => l.paths).find(p => p.id === action.pathId)
          if (origPath) {
            const clone = duplicatePath(origPath)
            setLayers((prev) =>
              prev.map((layer) => {
                if (layer.id !== activeLayerId) return layer
                // Insert clone at the same position — it stays, user drags the original
                return { ...layer, paths: [...layer.paths, clone] }
              })
            )
          }
          break
        }

        case "nudge": {
          if (activePathId) {
            setLayers((prev) =>
              prev.map((layer) => ({
                ...layer,
                paths: layer.paths.map((p) => {
                  if (p.id !== activePathId) return p
                  return { ...p, segments: translateSegments(p.segments, action.delta.x, action.delta.y) }
                }),
              }))
            )
          }
          break
        }

        case "add-segment":
          handleAddSegment(action.point)
          break

        case "close-path":
          handleClosePath()
          break

        case "new-path":
          handleNewPath()
          break

        case "finish-drawing-shape":
          handleFinishShape(action.start, action.end)
          // handleFinishShape sets activePathId; transition to shape-selected
          // Note: since handleFinishShape calls setActivePathId internally,
          // we update interaction state to match after creation
          break

        case "push-history":
          pushHistory()
          break

        case "set-cursor":
          // Handled by canvas component
          break
      }
    }
  },
  [activePathId, activeLayerId, clipboard, layers, handleAddSegment, handleClosePath, handleNewPath, handleFinishShape, handleMovePoint, pushHistory, getActivePath]
)
```

- [ ] **Step 4: Update keyboard handler to route through state machine for shape-selected state**

Update `handleKeyDown` to check interaction state first:

```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return

    // If shape is selected, route copy/paste/delete/nudge through state machine
    if (interactionState.type === "shape-selected") {
      const canvasEvent = {
        type: "keydown" as const,
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      }
      const result = processEvent(interactionState, canvasEvent, {
        layers, tool, zoom, panX, panY, snapEnabled, gridSize,
        hitTest: { type: "none" }, activePathId,
      })
      if (result.actions.length > 0) {
        e.preventDefault()
        setInteractionState(result.newState)
        dispatchActions(result.actions)
        return
      }
    }

    // Global paste (works even in idle state)
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault()
      dispatchActions([{ type: "paste" }])
      return
    }

    // Existing tool shortcuts
    if (e.key === "v" || e.key === "V") {
      setTool("select")
    } else if (e.key === "p" || e.key === "P") {
      setTool("pen")
    } else if (e.key === "l" || e.key === "L") {
      setTool("line")
    } else if (e.key === "r" || e.key === "R") {
      setTool("rectangle")
    } else if (e.key === "o" || e.key === "O") {
      setTool("ellipse")
    } else if (e.key === "g" || e.key === "G") {
      setShowGrid((v) => !v)
    } else if (e.key === "s" || e.key === "S") {
      if (!e.ctrlKey && !e.metaKey) setSnapEnabled((v) => !v)
    } else if (e.key === "Escape") {
      handleNewPath()
      setInteractionState({ type: "idle" })
    } else if (e.key === "Enter") {
      handleClosePath()
    } else if (e.key === "Delete" || e.key === "Backspace") {
      handleDeleteSelectedPoint()
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      setInteractionState({ type: "idle" })
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault()
      redo()
      setInteractionState({ type: "idle" })
    } else if (e.key === "1") {
      setCurveMode("line")
    } else if (e.key === "2") {
      setCurveMode("quadratic")
    } else if (e.key === "3") {
      setCurveMode("cubic")
    }
  },
  [interactionState, layers, tool, zoom, panX, panY, snapEnabled, gridSize, activePathId, handleNewPath, handleClosePath, handleDeleteSelectedPoint, undo, redo, dispatchActions]
)
```

- [ ] **Step 5: Pass interaction state and dispatcher to ShapeMakerCanvas**

Update the canvas props in the JSX:

```tsx
<ShapeMakerCanvas
  layers={layers}
  activeLayerId={activeLayerId}
  activePathId={activePathId}
  tool={tool}
  snapEnabled={snapEnabled}
  gridSize={gridSize}
  showGrid={showGrid}
  zoom={zoom}
  panX={panX}
  panY={panY}
  selectedPoint={selectedNodePoint}
  backgroundColor={backgroundColor}
  interactionState={interactionState}
  onInteractionStateChange={setInteractionState}
  onDispatchActions={dispatchActions}
  onAddSegment={handleAddSegment}
  onSelectPoint={setSelectedNodePoint}
  onMovePoint={handleMovePoint}
  onPanChange={(x, y) => { setPanX(x); setPanY(y) }}
  onZoomChange={setZoom}
  onFinishShape={handleFinishShape}
  onSelectPath={(id) => setActivePathId(id)}
  onDragStart={pushHistory}
  curveMode={curveMode}
/>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shapemaker/ShapeMaker.tsx
git commit -m "feat(shapemaker): wire up interaction state machine and action dispatcher"
```

---

### Task 8: Update ShapeMakerCanvas.tsx — integrate state machine and hit testing

**Files:**
- Modify: `src/components/shapemaker/ShapeMakerCanvas.tsx`

- [ ] **Step 1: Add imports and new props**

Add imports:

```typescript
import type { InteractionState, InteractionAction, HitTestResult } from "@/types/shapemaker"
import { performHitTest } from "@/utils/shapemakerHitTest"
import { processEvent } from "@/utils/shapemakerInteraction"
import { renderBoundingBox } from "@/utils/shapemakerCanvas"
import { computeBoundingBox, bboxCenter } from "@/utils/shapemakerTransform"
```

Add new props to the `Props` type:

```typescript
interactionState: InteractionState
onInteractionStateChange: (state: InteractionState) => void
onDispatchActions: (actions: InteractionAction[]) => void
```

- [ ] **Step 2: Add cursor state and process mouse events through state machine**

Add cursor state:

```typescript
const [cursor, setCursor] = useState("crosshair")
```

Update `handleMouseDown` to route select-tool events through the state machine:

For `tool === "select"`, instead of the current manual hit-test logic, do:

```typescript
if (tool === "select" || interactionState.type === "shape-selected" || interactionState.type === "dragging-shape") {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const editingMode = interactionState.type === "shape-selected" ? interactionState.mode : null
  const hitResult = performHitTest(
    ctx, point, { x: e.clientX, y: e.clientY },
    layers, activePathId, editingMode, zoom, panX, panY,
  )

  const canvasEvent = {
    type: "mousedown" as const,
    point,
    screenPoint: { x: e.clientX, y: e.clientY },
    button: e.button,
    altKey: e.altKey,
    shiftKey: e.shiftKey,
  }

  const result = processEvent(interactionState, canvasEvent, {
    layers, tool, zoom, panX, panY, snapEnabled, gridSize,
    hitTest: hitResult, activePathId,
  })

  onInteractionStateChange(result.newState)
  onDispatchActions(result.actions)

  // Handle cursor from actions
  for (const action of result.actions) {
    if (action.type === "set-cursor") setCursor(action.cursor)
  }
  return
}
```

Similarly update `handleMouseMove` and `handleMouseUp` to route through the state machine when in an active interaction state (dragging-shape, rotating, resizing, dragging-node).

Update `handleMouseMove`:

```typescript
// After panning check, before existing drag logic:
if (["dragging-shape", "rotating", "resizing", "dragging-node"].includes(interactionState.type)) {
  const canvasEvent = {
    type: "mousemove" as const,
    point,
    screenPoint: { x: e.clientX, y: e.clientY },
    shiftKey: e.shiftKey,
  }
  const result = processEvent(interactionState, canvasEvent, {
    layers, tool, zoom, panX, panY, snapEnabled, gridSize,
    hitTest: { type: "none" }, activePathId,
  })
  onInteractionStateChange(result.newState)
  onDispatchActions(result.actions)
  for (const action of result.actions) {
    if (action.type === "set-cursor") setCursor(action.cursor)
  }
  return
}

// Cursor update when shape selected (hover detection)
if (interactionState.type === "shape-selected" && interactionState.mode === "shape") {
  const canvas = canvasRef.current
  const ctx = canvas?.getContext("2d")
  if (ctx) {
    const hitResult = performHitTest(
      ctx, point, { x: e.clientX, y: e.clientY },
      layers, activePathId, "shape", zoom, panX, panY,
    )
    const canvasEvent = {
      type: "mousemove" as const,
      point,
      screenPoint: { x: e.clientX, y: e.clientY },
      shiftKey: e.shiftKey,
    }
    const result = processEvent(interactionState, canvasEvent, {
      layers, tool, zoom, panX, panY, snapEnabled, gridSize,
      hitTest: hitResult, activePathId,
    })
    for (const action of result.actions) {
      if (action.type === "set-cursor") setCursor(action.cursor)
    }
  }
}
```

- [ ] **Step 3: Add double-click handler**

Add a new handler:

```typescript
const handleDoubleClick = useCallback(
  (e: React.MouseEvent) => {
    if (interactionState.type !== "shape-selected") return
    const point = getCanvasPoint(e)
    const canvasEvent = {
      type: "dblclick" as const,
      point,
      screenPoint: { x: e.clientX, y: e.clientY },
    }
    const result = processEvent(interactionState, canvasEvent, {
      layers, tool, zoom, panX, panY, snapEnabled, gridSize,
      hitTest: { type: "none" }, activePathId,
    })
    onInteractionStateChange(result.newState)
    onDispatchActions(result.actions)
  },
  [interactionState, layers, tool, zoom, panX, panY, snapEnabled, gridSize, activePathId, getCanvasPoint, onInteractionStateChange, onDispatchActions]
)
```

Add `onDoubleClick={handleDoubleClick}` to the canvas element.

- [ ] **Step 4: Add bounding box rendering to the render function**

In the `render` callback, after rendering control points, add:

```typescript
// Bounding box + handles for selected shape in shape mode
if (interactionState.type === "shape-selected" && interactionState.mode === "shape") {
  const selectedPath = layers
    .flatMap((l) => l.paths)
    .find((p) => p.id === interactionState.pathId)
  if (selectedPath) {
    renderBoundingBox(ctx, selectedPath, zoom, panX, panY)
  }
}
```

Add `interactionState` to the render dependency array.

- [ ] **Step 5: Delete the old `isPointNearPath`, `sampleQuadratic`, `sampleCubic`, `distToPoint`, `distToLineSegment` functions**

These are at the bottom of `ShapeMakerCanvas.tsx` (lines 394-476). Remove them entirely — they're replaced by the hit testing module.

- [ ] **Step 6: Update cursor on canvas element**

Change the container div's className to use dynamic cursor:

```tsx
<div ref={containerRef} className="flex-1 min-h-0 relative overflow-hidden" style={{ cursor }}>
```

- [ ] **Step 7: Update `handleMouseUp` to route through state machine**

```typescript
const handleMouseUp = useCallback((e: React.MouseEvent) => {
  if (isPanning) {
    setIsPanning(false)
    setDragStart(null)
    return
  }

  // Route through state machine for active interactions
  if (["dragging-shape", "rotating", "resizing", "dragging-node", "drawing-shape"].includes(interactionState.type)) {
    const point = getCanvasPoint(e)
    const canvasEvent = { type: "mouseup" as const, point }
    const result = processEvent(interactionState, canvasEvent, {
      layers, tool, zoom, panX, panY, snapEnabled, gridSize,
      hitTest: { type: "none" }, activePathId,
    })
    onInteractionStateChange(result.newState)
    onDispatchActions(result.actions)
    return
  }

  // Legacy: shape preview for drawing tools
  if (isDragging && shapePreview) {
    onFinishShape(shapePreview.start, shapePreview.current)
    setShapePreview(null)
  }

  setIsDragging(false)
}, [isPanning, isDragging, shapePreview, interactionState, layers, tool, zoom, panX, panY, snapEnabled, gridSize, activePathId, getCanvasPoint, onFinishShape, onInteractionStateChange, onDispatchActions])
```

- [ ] **Step 8: Verify build**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc -b`

Fix any type errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/shapemaker/ShapeMakerCanvas.tsx
git commit -m "feat(shapemaker): integrate state machine and hit testing into canvas"
```

---

## Chunk 4: Properties Panel & Code Export

### Task 9: Add Transform section to PropertiesPanel

**Files:**
- Modify: `src/components/shapemaker/PropertiesPanel.tsx`

- [ ] **Step 1: Update Props type and add imports**

```typescript
import type { PaintStyle, ShapePath, BoundingBox, InteractionState } from "@/types/shapemaker"
import { computeBoundingBox } from "@/utils/shapemakerTransform"
```

Update Props:

```typescript
type Props = {
  path: ShapePath | null
  interactionState: InteractionState
  onUpdatePaint: (paint: Partial<PaintStyle>) => void
  onUpdatePath: (updates: Partial<ShapePath>) => void
  onUpdateTransform: (pathId: string, bbox: BoundingBox, changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
}
```

- [ ] **Step 2: Add Transform section before the Path section**

Inside the `PropertiesPanel` component, after the null check, add:

```typescript
const isShapeMode = interactionState.type === "shape-selected" && interactionState.mode === "shape"
const bbox = path ? computeBoundingBox(path.segments) : null

// ...in the JSX, before the Path section:

{isShapeMode && bbox && (
  <Section title="Transform">
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground w-4">X</span>
        <input
          type="number"
          value={Math.round(bbox.x)}
          onChange={(e) => onUpdateTransform(path!.id, bbox, { x: Number(e.target.value) })}
          className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground w-4">Y</span>
        <input
          type="number"
          value={Math.round(bbox.y)}
          onChange={(e) => onUpdateTransform(path!.id, bbox, { y: Number(e.target.value) })}
          className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground w-4">W</span>
        <input
          type="number"
          value={Math.round(bbox.width)}
          onChange={(e) => onUpdateTransform(path!.id, bbox, { width: Number(e.target.value) })}
          min={1}
          className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground w-4">H</span>
        <input
          type="number"
          value={Math.round(bbox.height)}
          onChange={(e) => onUpdateTransform(path!.id, bbox, { height: Number(e.target.value) })}
          min={1}
          className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
        />
      </div>
    </div>
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground w-4">R</span>
      <input
        type="number"
        value={Math.round((path!.transform.rotation * 180) / Math.PI)}
        onChange={(e) => onUpdateTransform(path!.id, bbox, { rotation: Number(e.target.value) })}
        step={1}
        className="flex-1 px-1.5 py-1 text-xs font-mono bg-muted/30 border border-border rounded outline-none focus:ring-1 focus:ring-ring min-w-0"
      />
      <span className="text-xs text-muted-foreground">deg</span>
    </div>
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <input type="checkbox" className="accent-primary" />
      Lock aspect ratio
    </label>
  </Section>
)}

**Note:** The lock aspect ratio checkbox is local UI state in the Properties panel. When checked, changing W should auto-adjust H proportionally and vice versa. Implement with a `useState<boolean>(false)` in the component. When locked and W changes, compute `newH = currentH * (newW / currentW)` and pass both to `onUpdateTransform`.
```

- [ ] **Step 3: Add `onUpdateTransform` handler in ShapeMaker.tsx**

In `ShapeMaker.tsx`, add:

```typescript
const handleUpdateTransform = useCallback(
  (pathId: string, currentBBox: BoundingBox, changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => {
    pushHistory()
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        paths: layer.paths.map((p) => {
          if (p.id !== pathId) return p

          let newSegments = [...p.segments]
          let newTransform = { ...p.transform }

          // Position change (bake into points)
          if (changes.x !== undefined) {
            const dx = changes.x - currentBBox.x
            newSegments = translateSegments(newSegments, dx, 0)
          }
          if (changes.y !== undefined) {
            const dy = changes.y - currentBBox.y
            newSegments = translateSegments(newSegments, 0, dy)
          }

          // Size change (scale points from top-left)
          if (changes.width !== undefined && currentBBox.width > 0) {
            const scaleX = changes.width / currentBBox.width
            const anchor = { x: currentBBox.x, y: currentBBox.y }
            newSegments = scaleSegments(newSegments, anchor, scaleX, 1)
          }
          if (changes.height !== undefined && currentBBox.height > 0) {
            const scaleY = changes.height / currentBBox.height
            const anchor = { x: currentBBox.x, y: currentBBox.y }
            newSegments = scaleSegments(newSegments, anchor, 1, scaleY)
          }

          // Rotation
          if (changes.rotation !== undefined) {
            newTransform.rotation = (changes.rotation * Math.PI) / 180
          }

          return { ...p, segments: newSegments, transform: newTransform }
        }),
      }))
    )
  },
  [pushHistory]
)
```

Pass it to PropertiesPanel:

```tsx
<PropertiesPanel
  path={activePath}
  interactionState={interactionState}
  onUpdatePaint={handleUpdatePaint}
  onUpdatePath={handleUpdatePath}
  onUpdateTransform={handleUpdateTransform}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/shapemaker/PropertiesPanel.tsx src/components/shapemaker/ShapeMaker.tsx
git commit -m "feat(shapemaker): add transform section to properties panel"
```

---

### Task 10: Update code export for rotation

**Files:**
- Modify: `src/utils/shapemakerCodegen.ts`

- [ ] **Step 1: Wrap rotated shapes with canvas.save/translate/rotate/restore**

In `generateFlutterCode`, update the per-path section to handle rotation:

After the `canvas.drawPath` lines, wrap the whole shape block when rotation is non-zero. Replace the per-path loop body:

```typescript
for (const path of layer.paths) {
  if (!path.visible || path.segments.length === 0) continue

  const paintVar = `paint${paintIdx}`
  const pathVar = `path${pathIdx}`
  const hasRotation = path.transform.rotation !== 0

  lines.push("")
  lines.push(`    // ${layer.name} - ${path.name}`)

  if (hasRotation) {
    // Compute center for rotation
    const bbox = computeBoundingBox(path.segments)
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    const cxCode = opts.responsive
      ? `size.width * ${(cx / opts.canvasWidth).toFixed(4)}`
      : cx.toFixed(1)
    const cyCode = opts.responsive
      ? `size.height * ${(cy / opts.canvasHeight).toFixed(4)}`
      : cy.toFixed(1)

    lines.push("    canvas.save();")
    lines.push(`    canvas.translate(${cxCode}, ${cyCode});`)
    lines.push(`    canvas.rotate(${path.transform.rotation.toFixed(4)});`)
    lines.push(`    canvas.translate(-${cxCode}, -${cyCode});`)
  }

  lines.push(generatePaintCode(path.paint, paintVar, opts))
  lines.push("")
  lines.push(generatePathCode(path, pathVar, opts))
  lines.push("")

  if (path.paint.paintingStyle === "fillAndStroke") {
    lines.push(`    canvas.drawPath(${pathVar}, ${paintVar});`)
    lines.push(`    final ${paintVar}Stroke = Paint()`)
    lines.push("      ..style = PaintingStyle.stroke")
    lines.push(`      ..strokeWidth = ${path.paint.strokeWidth.toFixed(1)}`)
    lines.push(`      ..color = ${colorToFlutter(path.paint.strokeColor, path.paint.strokeOpacity)};`)
    lines.push(`    canvas.drawPath(${pathVar}, ${paintVar}Stroke);`)
  } else {
    lines.push(`    canvas.drawPath(${pathVar}, ${paintVar});`)
  }

  if (hasRotation) {
    lines.push("    canvas.restore();")
  }

  paintIdx++
  pathIdx++
}
```

Add import at top:

```typescript
import { computeBoundingBox } from "./shapemakerTransform"
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/shapemakerCodegen.ts
git commit -m "feat(shapemaker): emit canvas.save/translate/rotate/restore for rotated shapes"
```

---

## Chunk 5: Final Integration & Build Verification

### Task 11: Fix all remaining build errors

**Files:**
- Various — fix any TypeScript errors from missing `transform` field

- [ ] **Step 1: Run full build and fix errors**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc -b 2>&1`

Common fixes needed:
- Any place that creates a `ShapePath` object literal needs `transform: { ...DEFAULT_TRANSFORM }` or `transform: { rotation: 0, scaleX: 1, scaleY: 1 }`
- The `handleDuplicatePath` in `ShapeMaker.tsx` uses `JSON.parse(JSON.stringify(...))` which will preserve the transform field from the original — no change needed
- The `HistoryEntry` type uses `Layer[]` which contains `ShapePath[]` — the JSON clone preserves transform, no change needed

- [ ] **Step 2: Run full build**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npx tsc -b && npx vite build`

Expected: Clean build with no errors.

- [ ] **Step 3: Manual smoke test**

Run: `cd /Users/utkualpturen/Developer/KutuYazılım/Projects/kutu-tree && npm run dev`

Test in browser:
1. Draw a rectangle → click it with select tool → should see bounding box + handles
2. Drag the shape → should move (all points update)
3. Drag a corner handle → should resize
4. Hover outside corner → cursor changes → drag to rotate
5. Double-click → enters node mode (control points visible)
6. Escape → back to shape mode
7. Ctrl+C then Ctrl+V → paste with offset
8. Ctrl+D → duplicate in place
9. Arrow keys → nudge shape
10. Properties panel shows X, Y, W, H, R values
11. Export code → rotated shape has canvas.save/rotate/restore

- [ ] **Step 4: Fix any issues found in smoke test**

Address bugs discovered during manual testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(shapemaker): complete P0 - core interactions, transforms, copy/paste"
```
