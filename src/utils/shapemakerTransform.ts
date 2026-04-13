import type { Point, PathSegment, BoundingBox, HandlePosition } from "@/types/shapemaker"

// ─── Bounding box ──────────────────────────────────────────────

function collectAllPoints(segments: PathSegment[]): Point[] {
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
  const pts = collectAllPoints(segments)
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
  const baseAngles: Record<HandlePosition, number> = {
    n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315,
  }
  const rotDeg = (rotationRad * 180) / Math.PI
  const angle = ((baseAngles[handle] + rotDeg) % 360 + 360) % 360

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

export function scaleSegments(
  segments: PathSegment[],
  anchor: Point,
  scaleX: number,
  scaleY: number,
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

export function unrotatePoint(p: Point, center: Point, angle: number): Point {
  return rotatePoint(p, center, -angle)
}

export function snapAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment
}

// ─── Type-safe segment point update ────────────────────────────

export function updateSegmentPoint(
  segment: PathSegment,
  field: string,
  value: Point,
): PathSegment {
  switch (segment.type) {
    case "moveTo":
      return { ...segment, point: value }
    case "lineTo":
      return { ...segment, point: value }
    case "quadraticBezierTo":
      if (field === "controlPoint") return { ...segment, controlPoint: value }
      return { ...segment, endPoint: value }
    case "cubicTo":
      if (field === "controlPoint1") return { ...segment, controlPoint1: value }
      if (field === "controlPoint2") return { ...segment, controlPoint2: value }
      return { ...segment, endPoint: value }
    case "arcToPoint":
      return { ...segment, endPoint: value }
    case "close":
      return segment
  }
}
