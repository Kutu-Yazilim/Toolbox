import type {
  Point,
  PathSegment,
  BoundingBox,
  HandlePosition,
  HitTestResult,
  SelectedPoint,
  ShapePath,
  Layer,
} from "@/types/shapemaker"
import {
  computeBoundingBox,
  bboxCenter,
  getHandlePositions,
  rotatePoint,
  unrotatePoint,
} from "./shapemakerTransform"

// ─── Constants ─────────────────────────────────────────────────

const HANDLE_RADIUS_PX = 6      // screen pixels
const NODE_RADIUS_PX = 7        // screen pixels
const STROKE_HIT_WIDTH = 8      // screen pixels, added to shape stroke width
const ROTATION_ZONE_OUTER = 28  // screen pixels outside corner handle
const ROTATION_ZONE_INNER = 0   // flush with handle edge

// ─── Path2D builder ────────────────────────────────────────────

export function buildPath2D(segments: PathSegment[]): Path2D {
  const path = new Path2D()

  for (const seg of segments) {
    switch (seg.type) {
      case "moveTo":
        path.moveTo(seg.point.x, seg.point.y)
        break
      case "lineTo":
        path.lineTo(seg.point.x, seg.point.y)
        break
      case "quadraticBezierTo":
        path.quadraticCurveTo(
          seg.controlPoint.x,
          seg.controlPoint.y,
          seg.endPoint.x,
          seg.endPoint.y,
        )
        break
      case "cubicTo":
        path.bezierCurveTo(
          seg.controlPoint1.x,
          seg.controlPoint1.y,
          seg.controlPoint2.x,
          seg.controlPoint2.y,
          seg.endPoint.x,
          seg.endPoint.y,
        )
        break
      case "arcToPoint": {
        const rx = seg.radius.x
        const ry = seg.radius.y
        if (rx === ry) {
          path.arcTo(seg.endPoint.x, seg.endPoint.y, seg.endPoint.x, seg.endPoint.y, rx)
        } else {
          path.lineTo(seg.endPoint.x, seg.endPoint.y)
        }
        break
      }
      case "close":
        path.closePath()
        break
    }
  }

  return path
}

// ─── Handle hit test ───────────────────────────────────────────

/**
 * Check if a screen-space point is within any resize handle.
 * The bbox and rotation are in canvas space; we transform the test point
 * into unrotated canvas space, then project to screen space for radius check.
 */
export function hitTestHandles(
  screenPoint: Point,
  bbox: BoundingBox,
  rotation: number,
  zoom: number,
  panX: number,
  panY: number,
): HandlePosition | null {
  const center = bboxCenter(bbox)
  const handlePositions = getHandlePositions(bbox)
  const radiusPx = HANDLE_RADIUS_PX

  for (const [handle, canvasPos] of Object.entries(handlePositions) as [HandlePosition, Point][]) {
    // rotate the canvas handle position by the shape's rotation around center
    const rotated = rotatePoint(canvasPos, center, rotation)
    // convert to screen space
    const sx = rotated.x * zoom + panX
    const sy = rotated.y * zoom + panY
    const dx = screenPoint.x - sx
    const dy = screenPoint.y - sy
    if (dx * dx + dy * dy <= radiusPx * radiusPx) {
      return handle
    }
  }

  return null
}

// ─── Rotation zone hit test ─────────────────────────────────────

/**
 * The rotation zone is the area just outside the corner handles.
 * A square region ROTATION_ZONE_OUTER px wide around each corner, minus the
 * inner handle area, triggers a rotation cursor.
 */
export function hitTestRotationZone(
  screenPoint: Point,
  bbox: BoundingBox,
  rotation: number,
  zoom: number,
  panX: number,
  panY: number,
): boolean {
  const center = bboxCenter(bbox)
  const cornerHandles: HandlePosition[] = ["nw", "ne", "se", "sw"]
  const handlePositions = getHandlePositions(bbox)
  const outerR = HANDLE_RADIUS_PX + ROTATION_ZONE_OUTER
  const innerR = HANDLE_RADIUS_PX + ROTATION_ZONE_INNER

  for (const handle of cornerHandles) {
    const canvasPos = handlePositions[handle]
    const rotated = rotatePoint(canvasPos, center, rotation)
    const sx = rotated.x * zoom + panX
    const sy = rotated.y * zoom + panY
    const dx = screenPoint.x - sx
    const dy = screenPoint.y - sy
    const dist2 = dx * dx + dy * dy
    if (dist2 <= outerR * outerR && dist2 > innerR * innerR) {
      return true
    }
  }

  return false
}

// ─── Node hit test ─────────────────────────────────────────────

/**
 * Check if a canvas-space point is near any node (anchor or control point)
 * of the given path.
 */
export function hitTestNodes(
  canvasPoint: Point,
  path: ShapePath,
  zoom: number,
): SelectedPoint | null {
  const threshold = NODE_RADIUS_PX / zoom

  for (let i = 0; i < path.segments.length; i++) {
    const seg = path.segments[i]

    if (seg.type === "moveTo" || seg.type === "lineTo") {
      if (distSq(canvasPoint, seg.point) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "point" }
      }
    } else if (seg.type === "quadraticBezierTo") {
      if (distSq(canvasPoint, seg.controlPoint) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint1" }
      }
      if (distSq(canvasPoint, seg.endPoint) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "cubicTo") {
      if (distSq(canvasPoint, seg.controlPoint1) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint1" }
      }
      if (distSq(canvasPoint, seg.controlPoint2) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "controlPoint2" }
      }
      if (distSq(canvasPoint, seg.endPoint) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    } else if (seg.type === "arcToPoint") {
      if (distSq(canvasPoint, seg.endPoint) <= threshold * threshold) {
        return { pathId: path.id, segmentIndex: i, pointType: "endPoint" }
      }
    }
  }

  return null
}

// ─── Shape body hit test ───────────────────────────────────────

/**
 * Use isPointInPath / isPointInStroke to test if a canvas-space point
 * is inside the shape body. The context transform must already account
 * for zoom/pan; we pass raw canvas coordinates here.
 *
 * The rotation transform is applied in-context so Path2D coords stay
 * in the unrotated shape space.
 */
export function hitTestShapeBody(
  ctx: CanvasRenderingContext2D,
  canvasPoint: Point,
  path: ShapePath,
  zoom: number,
): boolean {
  if (!path.visible || path.segments.length === 0) return false

  const path2D = buildPath2D(path.segments)
  const rotation = path.transform?.rotation ?? 0
  const center = bboxCenter(computeBoundingBox(path.segments))

  // To test a rotated shape we un-rotate the test point instead of
  // modifying the path2D (avoids allocating a new path2D per test).
  const testPoint = rotation !== 0
    ? unrotatePoint(canvasPoint, center, rotation)
    : canvasPoint

  ctx.save()
  ctx.setTransform(zoom, 0, 0, zoom, 0, 0)

  const hitFill = ctx.isPointInPath(path2D, testPoint.x, testPoint.y)

  const strokeHitWidth = Math.max(path.paint.strokeWidth, STROKE_HIT_WIDTH / zoom)
  const prevLW = ctx.lineWidth
  ctx.lineWidth = strokeHitWidth
  const hitStroke = ctx.isPointInStroke(path2D, testPoint.x, testPoint.y)
  ctx.lineWidth = prevLW

  ctx.restore()

  const paintStyle = path.paint.paintingStyle
  if (paintStyle === "fill" || paintStyle === "fillAndStroke") {
    if (hitFill) return true
  }
  if (paintStyle === "stroke" || paintStyle === "fillAndStroke") {
    if (hitStroke) return true
  }

  return false
}

// ─── Orchestrated hit test ─────────────────────────────────────

export interface HitTestContext {
  ctx: CanvasRenderingContext2D
  layers: Layer[]
  selectedPathId: string | null
  zoom: number
  panX: number
  panY: number
  /** canvas-space point */
  canvasPoint: Point
  /** screen-space point */
  screenPoint: Point
  /** whether we are in node editing mode */
  nodeMode: boolean
}

/**
 * Priority order:
 * 1. Resize handles (only when a shape is selected)
 * 2. Rotation zone (only when a shape is selected)
 * 3. Nodes (only in node mode)
 * 4. Shape body (all shapes, top layer first)
 * 5. none
 */
export function performHitTest(htx: HitTestContext): HitTestResult {
  const { ctx, layers, selectedPathId, zoom, panX, panY, canvasPoint, screenPoint, nodeMode } = htx

  // Find the selected path for handle/rotation tests
  if (selectedPathId !== null) {
    const selectedPath = findPath(layers, selectedPathId)
    if (selectedPath) {
      const bbox = computeBoundingBox(selectedPath.segments)
      const rotation = selectedPath.transform?.rotation ?? 0

      // 1. Resize handles
      const handle = hitTestHandles(screenPoint, bbox, rotation, zoom, panX, panY)
      if (handle !== null) {
        return { type: "resize-handle", handle }
      }

      // 2. Rotation zone
      if (hitTestRotationZone(screenPoint, bbox, rotation, zoom, panX, panY)) {
        return { type: "rotation-zone" }
      }
    }
  }

  // 3. Nodes (node mode only)
  if (nodeMode && selectedPathId !== null) {
    const selectedPath = findPath(layers, selectedPathId)
    if (selectedPath) {
      const sp = hitTestNodes(canvasPoint, selectedPath, zoom)
      if (sp !== null) {
        return { type: "node", selectedPoint: sp }
      }
    }
  }

  // 4. Shape body — iterate layers top-to-bottom, paths top-to-bottom
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

// ─── Helpers ───────────────────────────────────────────────────

function distSq(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function findPath(layers: Layer[], pathId: string): ShapePath | null {
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.id === pathId) return path
    }
  }
  return null
}
